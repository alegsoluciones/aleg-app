import { Injectable, NotFoundException, Logger, UnauthorizedException, Inject, ConflictException, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, Like, Between } from 'typeorm';
import * as path from 'path';
import * as fs from 'fs';
import { Patient, PatientStatus } from '../entities/patient.entity';
import { MedicalRecord } from '../entities/medical-record.entity';
import { CreatePatientDto } from './dto/create-patient.dto';
import { UpdatePatientDto } from './dto/update-patient.dto';
import * as crypto from 'crypto';
import { AuditService } from '../audit/audit.service';

import { StorageService } from '../common/services/storage.service';
import { PdfService } from '../common/services/pdf.service'; // 👈 Import

@Injectable()
export class PatientsService {
    private readonly logger = new Logger(PatientsService.name);

    constructor(
        @InjectRepository(Patient)
        private readonly patientRepository: Repository<Patient>,

        @InjectRepository(MedicalRecord)
        private readonly recordRepository: Repository<MedicalRecord>,

        private readonly auditService: AuditService,
        private readonly dataSource: DataSource,
        private readonly storageService: StorageService,
        private readonly pdfService: PdfService // 👈 Inject
    ) { }

    private async getTenantSlug(tenantId: string): Promise<string> {
        const res = await this.dataSource.query('SELECT slug FROM tenant WHERE id = ?', [tenantId]);
        if (res && res.length > 0) return res[0].slug;
        return 'default-tenant';
    }

    private getLimaDateISO(): string {
        return new Date().toLocaleString('sv', { timeZone: 'America/Lima' }).replace(' ', 'T') + '-05:00';
    }



    private syncHumanReadableJson(tenantSlug: string, patient: Patient) {
        if (!tenantSlug) return;
        try {
            // 1. ROTATE & PRESERVE (Plastic Surgery)
            // Finds any old INFO file (even with old name), moves to trash, and returns content for merging
            const oldData = this.storageService.rotatePatientInfo(tenantSlug, patient.internalId, patient.id);

            const { fullPath } = this.storageService.getSecurePath(tenantSlug, patient.id, patient.name);
            const safeName = patient.name.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase();
            const fileName = `INFO_${patient.internalId}_${safeName}.json`;

            const { records, tenant, ...patientData } = patient;

            // 2. MERGE STRATEGY (DB Authority + Preservation)
            const dataToSave = {
                ...(oldData || {}), // 🛡️ Preserve manual fields from old file
                ...patientData,     // 👑 DB Overwrites known fields
                internalId: patient.internalId,
                status: patient.status,
                dni: patient.dni,
                birthDate: patient.birthDate ? new Date(patient.birthDate).toISOString().split('T')[0] : null,
                firstConsultationDate: patient.firstConsultationDate ? new Date(patient.firstConsultationDate).toISOString().split('T')[0] : null,
                lastUpdate: this.getLimaDateISO()
            };

            this.storageService.saveDigitalTwin(fullPath, fileName, dataToSave);
        } catch (e) {
            this.logger.error(`Error syncing Human JSON: ${e.message}`);
        }
    }

    private syncRecordJson(tenantSlug: string, record: MedicalRecord, deletedInfo?: any) {
        if (!tenantSlug) return;
        try {
            const { fullPath } = this.storageService.getSecurePath(tenantSlug, record.patient.id, record.patient.name, record.date);
            const fileName = `REC_${record.id}_PROCEDIMIENTOS.json`;
            const attachments = typeof record.attachments === 'string' ? JSON.parse(record.attachments) : (record.attachments || []);

            const data = {
                id: record.id,
                fecha: new Date(record.date).toISOString().split('T')[0],
                titulo: record.title,
                notas: record.notes,
                procedimiento: record.steps,
                archivos: attachments.map((a: string) => path.basename(a)),
                historial_eliminados: deletedInfo ? [deletedInfo] : [], // Simplification for new structure
                ultima_actualizacion: this.getLimaDateISO()
            };

            this.storageService.saveDigitalTwin(fullPath, fileName, data);
        } catch (e) {
            this.logger.error(`Error syncing Record JSON: ${e.message}`);
        }
    }

    async create(createPatientDto: CreatePatientDto, tenantId: string, tenantSlug: string, userEmail: string = 'SYSTEM') {
        const statusInicial = createPatientDto.status || PatientStatus.DRAFT;
        let saved: Patient | null = null;
        let attempts = 0;
        const MAX_RETRIES = 3;

        while (attempts < MAX_RETRIES) {
            try {
                // 1. Calcular Siguiente ID (con estrategia anti-colisión)
                let nextInternalId = 'HC-0001';
                const lastPatient = await this.patientRepository.findOne({
                    where: { tenantId: tenantId, internalId: Like('HC-%') },
                    order: { internalId: 'DESC' }
                });

                if (lastPatient) {
                    const parts = lastPatient.internalId.split('-');
                    if (parts.length === 2) {
                        const num = parseInt(parts[1], 10);
                        if (!isNaN(num)) nextInternalId = `HC-${(num + 1).toString().padStart(4, '0')}`;
                    }
                }

                // 2. Intentar Insertar
                const DEFAULT_ANTECEDENTES = { medicos: "NO REFIERE", quirurgicos: "NO REFIERE", alergicos: "NO REFIERE", medicamentos: "NO REFIERE" };
                const DEFAULT_EVALUATION = { tipo_piel: "NO ESPECIFICADO", aspecto: "NO ESPECIFICADO", color: "NO ESPECIFICADO", textura: "NO ESPECIFICADO" };

                const newPatient = this.patientRepository.create({
                    ...createPatientDto,
                    tenantId: tenantId,
                    status: statusInicial,
                    internalId: nextInternalId,
                    firstConsultationDate: new Date(),
                    antecedentes: DEFAULT_ANTECEDENTES,
                    evaluation: DEFAULT_EVALUATION,
                    other_info: {},
                    diagnostico: 'PENDIENTE',
                    tratamiento: 'PENDIENTE'
                });

                saved = await this.patientRepository.save(newPatient);
                break; // Éxito: Salir del bucle

            } catch (error) {
                this.logger.error(`❌ Error creando paciente (Intento ${attempts}/${MAX_RETRIES}): ${error.message} \nStack: ${error.stack}`);

                if (error.code === 'ER_DUP_ENTRY' && attempts < MAX_RETRIES - 1) {
                    this.logger.warn(`Colisión de ID detectada. Reintentando...`);
                    attempts++;
                    await new Promise(r => setTimeout(r, 100)); // Pequeña espera para desempate
                    continue;
                }
                // Expose Error to Client for Debugging
                throw new InternalServerErrorException(`Error creating patient: ${error.message}`);
            }
        }

        if (!saved) {
            throw new ConflictException('No se pudo crear el paciente después de varios intentos. Intente nuevamente.');
        }

        if (tenantSlug) this.syncHumanReadableJson(tenantSlug, saved);
        await this.auditService.create({
            action: 'CREATE PATIENT', userId: 'SYSTEM', userEmail: userEmail, tenantId: tenantId, level: 'INFO',
            metadata: { name: saved.name, internalId: saved.internalId }
        });

        return saved;
    }

    // 👇 LÓGICA DE VALIDACIÓN DE FECHA + AUDITORÍA
    async createRecord(patientId: string, data: any, tenantId: string, tenantSlug: string, userEmail: string) {
        const patient = await this.patientRepository.findOne({ where: { id: patientId, tenantId } });
        if (!patient) throw new NotFoundException('Paciente no encontrado');

        // 1. Validar si ya existe consulta HOY (00:00 - 23:59)
        const dateToCheck = data.date ? new Date(data.date) : new Date();

        const startOfDay = new Date(dateToCheck);
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date(dateToCheck);
        endOfDay.setHours(23, 59, 59, 999);

        const existingRecord = await this.recordRepository.findOne({
            where: {
                patient: { id: patientId },
                date: Between(startOfDay, endOfDay)
            }
        });

        if (existingRecord) {
            // Loguear en consola
            this.logger.warn(`Intento de duplicado bloqueado. Paciente: ${patient.internalId}, Fecha: ${dateToCheck}`);

            // Registrar Auditoría de Bloqueo
            await this.auditService.create({
                action: 'DUPLICATE RECORD BLOCKED',
                userId: 'SYSTEM', userEmail: userEmail, tenantId: tenantId, level: 'WARNING',
                metadata: { patient: patient.name, attemptedDate: dateToCheck, existingRecordId: existingRecord.id }
            });

            // Lanzar error para que el Frontend se entere
            throw new ConflictException('VISIT_ALREADY_EXISTS');
        }

        // 2. Si no existe, crear
        const newRecord = this.recordRepository.create({
            patient: patient,
            date: dateToCheck,
            title: data.title || 'Consulta General',
            notes: data.notes || '',
            steps: data.steps || [],
            attachments: []
        });
        // 3. Reload from DB to ensure we get the exact persisted Date (Timezone Consistency)
        const savedRecord = await this.recordRepository.save(newRecord);
        // Note: We might need to reload again if @CreateDateColumn or similar modifies it,
        // but for 'date' field explicitly set, save() returns it.
        // Wait, my fix WAS to reload!
        // I need to keep the reload logic but remove the LOGS.

        // Re-applying the reload logic cleanly:
        const reloadedRecord = await this.recordRepository.findOne({ where: { id: savedRecord.id }, relations: ['patient'] });

        if (tenantSlug && reloadedRecord) {
            this.syncRecordJson(tenantSlug, reloadedRecord);
            this.syncHumanReadableJson(tenantSlug, patient);
        }

        if (!reloadedRecord) throw new ConflictException('Error al crear la consulta');

        await this.auditService.create({
            action: 'CREATE RECORD', userId: 'SYSTEM', userEmail: userEmail, tenantId: tenantId, level: 'INFO',
            metadata: { patient: patient.name, recordId: reloadedRecord.id, date: reloadedRecord.date }
        });

        return reloadedRecord;
    }

    async removeRecord(recordId: string, tenantId: string, tenantSlug: string, userEmail: string) {
        const record = await this.recordRepository.findOne({ where: { id: recordId }, relations: ['patient'] });


        // DEBUG FILE LOGGING
        try {
            fs.writeFileSync('DEBUG_REMOVE.log', `RecordId: ${recordId}\nFound: ${!!record}\nUserEmail: ${userEmail}\nBypass: ${userEmail === 'superadmin@alegapp.com'}\nTenantId: ${tenantId}\nRecTenant: ${record?.patient?.tenantId}\n`);
        } catch (e) { }

        // 🛡️ SECURITY: Tenant Isolation (Bypass for SuperAdmin)
        const isSuperAdmin = userEmail === 'superadmin@alegapp.com';
        if (!record || (!isSuperAdmin && record.patient.tenantId !== tenantId)) {
            throw new NotFoundException('Registro no encontrado o sin permisos');
        }

        const patient = record.patient;

        const slug = tenantSlug || await this.getTenantSlug(tenantId);

        // ♻️ Visit Trash Implementation
        this.storageService.softDeleteRecordFolder(slug, patient.id, record.date, record.id);

        await this.recordRepository.delete(recordId);

        await this.auditService.create({
            action: 'DELETE RECORD', userId: 'SYSTEM', userEmail: userEmail, tenantId: tenantId, level: 'WARNING',
            metadata: { patient: patient.name, fecha: record.date, titulo: record.title }
        });

        this.syncHumanReadableJson(slug, patient);

        this.syncHumanReadableJson(slug, patient);
        return { status: 'OK' };
    }

    // 👇 PROTOCOL GUTENBERG: PDF GENERATION
    async generatePdf(patientId: string, recordId: string, tenantId: string, tenantSlug: string): Promise<Buffer> {
        const record = await this.recordRepository.findOne({ where: { id: recordId }, relations: ['patient', 'patient.tenant'] }); // Ensure patient + tenant
        if (!record || record.patient.tenantId !== tenantId) throw new NotFoundException('Registro no encontrado o sin acceso');

        // Check if PDF exists? (Cache) - For now, we regenerate to ensure dynamic freshness
        // In "production", check this.storageService for existing file.

        // We need the Tenant entity to get config/branding
        // Assuming record.patient.tenant is loaded.
        // If not, we might need relation or fetch it.
        // Let's rely on 'patient.tenant' relation added above.

        return this.pdfService.generateConsultationPdf(record.patient.tenant, record.patient, record, tenantSlug);
    }

    async findAll(tenantId: string) {
        return this.patientRepository.find({ where: { tenantId: tenantId }, relations: ['records'], order: { createdAt: 'DESC' } });
    }

    async findOne(term: string, tenantId: string) {
        // Check if term is a UUID (approximate check: length > 20 and contains dashes)
        const isUUID = term.length > 20 && term.includes('-');

        this.logger.log(`🔍 Finding Patient (v2). Term: "${term}", TenantId: "${tenantId}", IsUUID: ${isUUID}`);

        let patient;
        if (isUUID) {
            patient = await this.patientRepository.findOne({ where: { id: term, tenantId: tenantId }, relations: ['records'] });
        } else {
            patient = await this.patientRepository.findOne({ where: { internalId: term, tenantId: tenantId }, relations: ['records'] });
        }

        if (!patient) {
            this.logger.warn(`❌ Patient not found for term: "${term}" in tenant: "${tenantId}"`);
            // Double check if it exists in another tenant
            const ghost = await this.patientRepository.findOne({ where: isUUID ? { id: term } : { internalId: term } });
            if (ghost) {
                this.logger.error(`⚠️ PATIENT EXISTS BUT IN TENANT: ${ghost.tenantId} (Expected: ${tenantId})`);
            }
            throw new NotFoundException('Paciente no encontrado');
        }

        if (patient.records) patient.records.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        return patient;
    }

    async update(id: string, updatePatientDto: UpdatePatientDto, tenantId: string, tenantSlug?: string) {
        const patient = await this.patientRepository.findOne({ where: { id, tenantId } });
        if (!patient) throw new NotFoundException('Paciente no encontrado');
        await this.patientRepository.update(id, updatePatientDto);
        const updatedPatient = await this.patientRepository.findOne({ where: { id } });
        if (tenantSlug && updatedPatient) this.syncHumanReadableJson(tenantSlug, updatedPatient);
        return updatedPatient;
    }

    async remove(id: string, tenantId: string, tenantSlug?: string, userEmail: string = 'SYSTEM') {
        const patient = await this.patientRepository.findOne({ where: { id, tenantId } });
        if (!patient) throw new NotFoundException('Paciente no encontrado');

        const slug = tenantSlug || await this.getTenantSlug(tenantId);

        try {
            const { fullPath } = this.storageService.getSecurePath(slug, patient.id, patient.name);
            if (fs.existsSync(fullPath)) {
                // Move to Trash using StorageService helper if available or manual rename
                // We don't have a public Trash helper in StorageService yet, so we construct path
                // But fullPath is storage/slug/HC-NAME.

                // Mark JSON as Deleted
                const safeName = patient.name.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase();
                const fileName = `INFO_${patient.internalId}_${safeName}.json`;
                const jsonPath = path.join(fullPath, fileName);

                if (fs.existsSync(jsonPath)) {
                    const data = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
                    data.status = 'DELETED';
                    data.deletedInfo = { deletedBy: userEmail, deletedAt: this.getLimaDateISO() };
                    fs.writeFileSync(jsonPath, JSON.stringify(data, null, 2));
                }

                const trashPath = path.join(process.cwd(), 'storage', slug, '_TRASH_', `${patient.internalId}_DELETED_${Date.now()}`);
                this.storageService.renameFolder(fullPath, trashPath);
            }
        } catch (e) { this.logger.error(`Error deleting patient folder: ${e.message}`); }

        await this.auditService.create({
            action: 'DELETE PATIENT', userId: 'SYSTEM', userEmail: userEmail, tenantId: tenantId, level: 'CRITICAL',
            metadata: { name: patient.name, internalId: patient.internalId }
        });

        await this.recordRepository.delete({ patient: { id: patient.id } });
        return this.patientRepository.remove(patient);
    }

    async getStats(tenantId: string) {
        const total = await this.patientRepository.count({ where: { tenantId } });
        const active = await this.patientRepository.count({ where: { tenantId, status: PatientStatus.ACTIVE } });
        const now = new Date();
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
        const newThisMonth = await this.patientRepository.createQueryBuilder('patient').where('patient.tenantId = :tenantId', { tenantId }).andWhere('patient.createdAt >= :firstDay', { firstDay }).getCount();
        return { totalPatients: total, activePatients: active, newThisMonth };
    }

    async addPhotosToRecord(recordId: string, files: Array<Express.Multer.File>, tenantId: string, tenantSlug: string, userEmail: string) {
        const record = await this.recordRepository.findOne({ where: { id: recordId }, relations: ['patient'] });
        if (!record || record.patient.tenantId !== tenantId) throw new UnauthorizedException('No tienes permiso');

        const slug = tenantSlug || await this.getTenantSlug(tenantId);
        const { fullPath } = this.storageService.getSecurePath(slug, record.patient.id, record.patient.name, record.date);

        const photosAdded: string[] = [];
        for (const file of files) {
            const ext = path.extname(file.originalname);
            const imgUUID = crypto.randomUUID();
            const fileName = `${imgUUID}${ext}`;
            const relativePath = this.storageService.saveFile(fullPath, fileName, file.buffer);
            photosAdded.push(relativePath);
        }

        let currentPhotos = typeof record.attachments === 'string' ? JSON.parse(record.attachments) : (record.attachments || []);
        record.attachments = [...currentPhotos, ...photosAdded];
        const saved = await this.recordRepository.save(record);
        this.syncRecordJson(slug, record);
        return saved;
    }

    async removePhoto(recordId: string, photoUrl: string, tenantId: string, tenantSlug: string, userEmail: string) {
        const record = await this.recordRepository.findOne({ where: { id: recordId }, relations: ['patient'] });
        if (!record || record.patient.tenantId !== tenantId) throw new UnauthorizedException('Acceso denegado');

        const slug = tenantSlug || await this.getTenantSlug(tenantId);

        let cleanUrl = photoUrl.replace(/^(\.\/|\/|\\)/, '');
        cleanUrl = decodeURIComponent(cleanUrl);
        const fullPath = path.resolve(process.cwd(), cleanUrl);
        const fileName = path.basename(fullPath);
        let deletedInfo: any = null;

        if (fs.existsSync(fullPath)) {
            const dir = path.dirname(fullPath);
            const ext = path.extname(fullPath);
            const base = path.basename(fullPath, ext);
            if (!base.includes('.deleted')) {
                const deletedName = `${base}.deleted${ext}`;
                const targetPath = path.join(dir, deletedName);
                try {
                    fs.renameSync(fullPath, targetPath);
                    deletedInfo = {
                        archivo: fileName,
                        usuario: userEmail,
                        fecha: this.getLimaDateISO(),
                        accion: 'ELIMINAR_FOTO'
                    };
                } catch (err) { this.logger.error(`Error rename: ${err.message}`); }
            }
        }

        let currentPhotos = typeof record.attachments === 'string' ? JSON.parse(record.attachments) : (record.attachments || []);
        currentPhotos = currentPhotos.filter(p => p !== photoUrl);
        record.attachments = currentPhotos;
        await this.recordRepository.save(record);

        this.syncRecordJson(slug, record, deletedInfo);

        if (deletedInfo) {
            await this.auditService.create({
                action: `DELETE FOTO`, userId: 'SYSTEM', userEmail: userEmail, tenantId: tenantId, level: 'WARNING',
                metadata: { paciente: record.patient.name, fecha_visita: record.date, archivo: fileName }
            });
        }
        return { status: 'OK' };
    }

    async updateRecord(recordId: string, data: any, tenantId: string, tenantSlug: string) {
        const record = await this.recordRepository.findOne({ where: { id: recordId }, relations: ['patient'] });
        if (!record || record.patient.tenantId !== tenantId) throw new UnauthorizedException('Acceso denegado');

        if (data.notes !== undefined) record.notes = data.notes;
        if (data.title !== undefined) record.title = data.title;
        if (data.steps !== undefined) record.steps = data.steps;
        if (data.date !== undefined) record.date = new Date(data.date);

        // ✅ CRITICAL FIX: Save the JSON data column (contains bodyMap)
        if (data.data !== undefined) record.data = data.data;

        const saved = await this.recordRepository.save(record);
        const slug = tenantSlug || await this.getTenantSlug(tenantId);

        if (data.date) {
            const firstVisit = await this.recordRepository.findOne({ where: { patient: { id: record.patient.id } }, order: { date: 'ASC' } });
            if (firstVisit) {
                await this.patientRepository.update(record.patient.id, { firstConsultationDate: firstVisit.date });
                const updatedPatient = await this.patientRepository.findOne({ where: { id: record.patient.id } });
                if (updatedPatient) this.syncHumanReadableJson(slug, updatedPatient);
            }
        }
        this.syncRecordJson(slug, saved);
        return saved;
    }

    async revertStatus(id: string, tenantId: string, tenantSlug?: string) {
        const patient = await this.patientRepository.findOne({ where: { id, tenantId } });
        if (!patient) throw new NotFoundException('Paciente no encontrado');

        if (patient.internalId.startsWith('HC-')) {
            const newTempId = `TEMP-${Date.now().toString().slice(-6)}`;
            patient.status = PatientStatus.DRAFT;
            patient.internalId = newTempId;
        } else {
            patient.status = PatientStatus.DRAFT;
        }

        const savedPatient = await this.patientRepository.save(patient);
        const slug = tenantSlug || await this.getTenantSlug(tenantId);
        this.syncHumanReadableJson(slug, savedPatient);

        return { status: 'OK' };
    }

    async bulkDelete(ids: string[], tenantId: string, tenantSlug?: string, userEmail: string = 'SYSTEM') {
        for (const id of ids) { await this.remove(id, tenantId, tenantSlug, userEmail); }
        return { status: 'OK' };
    }
}