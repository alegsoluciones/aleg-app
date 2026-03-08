import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { Response } from 'express';

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly STORAGE_ROOT = path.join(process.cwd(), 'storage');

  constructor() {
    this.ensureStorageRoot();
  }

  private ensureStorageRoot() {
    if (!fs.existsSync(this.STORAGE_ROOT)) {
      fs.mkdirSync(this.STORAGE_ROOT, { recursive: true });
    }
  }

  getSecurePath(tenantSlug: string, patientInternalId: string, patientName: string, visitDate?: Date, create: boolean = true) {
    if (!tenantSlug) throw new BadRequestException('CRITICAL: Tenant Slug is required for storage operations.');

    // 🔒 IMMUTABILITY: Use ID (UUID) directly as folder name. Name is ignored for folder structure.
    const patientFolder = patientInternalId;

    // 🔒 ISOLATION: Path ALWAYS includes tenantSlug
    const patientPath = path.join(this.STORAGE_ROOT, tenantSlug, patientFolder);

    let finalPath = patientPath;
    let visitDateStr = '';

    if (visitDate) {
      visitDateStr = new Date(visitDate).toISOString().split('T')[0];
      finalPath = path.join(patientPath, visitDateStr);
    }

    if (create && !fs.existsSync(finalPath)) {
      fs.mkdirSync(finalPath, { recursive: true });
    }

    return { fullPath: finalPath, relativePath: path.relative(process.cwd(), finalPath), visitDateStr, patientFolder };
  }

  renameFolder(oldPath: string, newPath: string) {
    if (oldPath === newPath) return;

    if (fs.existsSync(oldPath)) {
      const newParent = path.dirname(newPath);
      if (!fs.existsSync(newParent)) fs.mkdirSync(newParent, { recursive: true });

      try {
        fs.renameSync(oldPath, newPath);
        this.logger.log(`Carpeta renombrada: ${oldPath} -> ${newPath}`);
      } catch (e) {
        this.logger.error(`Error renombrando carpeta: ${e.message}`);
      }
    }
  }

  saveDigitalTwin(fullPath: string, fileName: string, data: any) {
    try {
      if (!fs.existsSync(fullPath)) fs.mkdirSync(fullPath, { recursive: true });

      const filePath = path.join(fullPath, fileName);
      const tempPath = `${filePath}.tmp`;
      fs.writeFileSync(tempPath, JSON.stringify(data, null, 2));
      fs.renameSync(tempPath, filePath);
    } catch (error) {
      this.logger.error(`Error escribiendo gemelo digital: ${error.message}`);
    }
  }

  saveFile(fullPath: string, fileName: string, buffer: Buffer): string {
    if (!fs.existsSync(fullPath)) fs.mkdirSync(fullPath, { recursive: true });
    const filePath = path.join(fullPath, fileName);
    fs.writeFileSync(filePath, buffer);
    return path.relative(process.cwd(), filePath).replace(/\\/g, '/');
  }

  /**
   * 🛡️ SECURE STREAMING
   * Validates that the requested file belongs to the requesting Tenant.
   */
  streamFile(relativePath: string, res: Response, requestTenantSlug: string) {
    if (!requestTenantSlug) {
      throw new BadRequestException('Security Violation: Tenant Context Missing');
    }

    // 1. Sanitize Path
    const safeRelative = relativePath.replace(/^(\.\.(\/|\\|$))+/, '');
    const absolutePath = path.join(process.cwd(), safeRelative);

    // 2. Enforce Root Storage Boundary
    if (!absolutePath.startsWith(this.STORAGE_ROOT)) {
      throw new BadRequestException('Access Denied: System File Protection');
    }

    // 3. 🔒 TENANT ISOLATION CHECK
    // The path MUST contain /storage/{tenantSlug}/
    const expectedBasePath = path.join(this.STORAGE_ROOT, requestTenantSlug);

    if (!absolutePath.startsWith(expectedBasePath)) {
      this.logger.warn(`🛑 BLOCKED CROSS-TENANT ACCESS: Tenant '${requestTenantSlug}' tried to access '${relativePath}'`);
      throw new NotFoundException('Archivo no encontrado o acceso denegado.'); // Obfuscate reason
    }

    // 4. Check Existence
    if (!fs.existsSync(absolutePath)) {
      throw new NotFoundException('Archivo no encontrado');
    }

    // 5. Stream
    const stat = fs.statSync(absolutePath);
    res.setHeader('Content-Length', stat.size);

    const readStream = fs.createReadStream(absolutePath);
    readStream.pipe(res);
  }

  softDeleteRecordFolder(tenantSlug: string, patientId: string, visitDate: Date, recordId: string) {
    if (!tenantSlug || !patientId || !visitDate || !recordId) return;

    // 1. Locate Source
    // Note: patientName is irrelevant for path generation with new UUID logic, passing empty string
    const { fullPath: sourcePath, visitDateStr } = this.getSecurePath(tenantSlug, patientId, '', visitDate, false);

    if (fs.existsSync(sourcePath)) {
      this.logger.log(`Found source path: ${sourcePath}`);

      // 2. Define Target
      const trashFolder = `VISIT_${recordId}_${visitDateStr}`;
      const trashPath = path.join(this.STORAGE_ROOT, tenantSlug, '_TRASH_', patientId, trashFolder);
      this.logger.log(`Target trash path: ${trashPath}`);

      // 3. Move
      try {
        if (!fs.existsSync(path.dirname(trashPath))) {
          fs.mkdirSync(path.dirname(trashPath), { recursive: true });
        }
        fs.renameSync(sourcePath, trashPath);
        this.logger.log(`♻️ Visita movida a Trash: ${sourcePath} -> ${trashPath}`);
      } catch (error) {
        this.logger.error(`❌ Error moviendo visita a Trash: ${error.message}`);
      }
    } else {
      this.logger.warn(`Source path NOT found: ${sourcePath}. Params: ${JSON.stringify({ tenantSlug, patientId, visitDate })}`);
    }
  }

  /**
   * 🔄 PLASTIC SURGERY PROTOCOL
   * Finds existing INFO_{ID}_*.json, reads it, moves it to trash, and returns content.
   * This ensures we don't leave ghost files when renaming a patient.
   */
  rotatePatientInfo(tenantSlug: string, patientInternalId: string, patientId: string): any | null {
    if (!tenantSlug || !patientInternalId || !patientId) return null;

    const { fullPath } = this.getSecurePath(tenantSlug, patientId, ''); // Path to patient root
    if (!fs.existsSync(fullPath)) return null;

    // 1. Search for existing INFO file
    const files = fs.readdirSync(fullPath);
    const infoFile = files.find(f => f.startsWith(`INFO_${patientInternalId}_`) && f.endsWith('.json'));

    if (!infoFile) return null;

    const currentFilePath = path.join(fullPath, infoFile);
    let oldContent = null;

    try {
      // 2. Read Content (Preservation)
      const raw = fs.readFileSync(currentFilePath, 'utf-8');
      oldContent = JSON.parse(raw);
    } catch (e) {
      this.logger.error(`Error reading old info file ${infoFile}: ${e.message}`);
    }

    // 3. Move to Trash (Soft Delete)
    const trashName = `${infoFile}.replaced_${Date.now()}`;
    const trashPath = path.join(this.STORAGE_ROOT, tenantSlug, '_TRASH_', patientId, trashName);

    try {
      if (!fs.existsSync(path.dirname(trashPath))) {
        fs.mkdirSync(path.dirname(trashPath), { recursive: true });
      }
      fs.renameSync(currentFilePath, trashPath);
      this.logger.log(`♻️ Rotated Info File: ${infoFile} -> ${trashName}`);
    } catch (e) {
      this.logger.error(`Error rotating info file: ${e.message}`);
    }

    return oldContent;
  }
}