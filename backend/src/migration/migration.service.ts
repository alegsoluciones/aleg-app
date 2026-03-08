import { Injectable, Inject, BadRequestException, Logger, ForbiddenException } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm'; // 👈 Import InjectRepository
import * as XLSX from 'xlsx';
import * as ExcelJS from 'exceljs';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { Patient, PatientStatus } from '../entities/patient.entity';
import { MedicalRecord } from '../entities/medical-record.entity';
import { Tenant } from '../tenants/entities/tenant.entity';
import { TenantModule } from '../tenants/entities/tenant-module.entity'; // 👈 Import Entity
import { TENANT_CONNECTION } from '../tenants/tenant-connection.provider';
import { ModuleCode } from '../common/enums/modules.enum';

@Injectable()
export class ExcelMigrationService {
    private readonly logger = new Logger(ExcelMigrationService.name);

    constructor(
        @Inject(TENANT_CONNECTION) private readonly connection: DataSource,
        @InjectRepository(TenantModule) private readonly tenantModuleRepo: Repository<TenantModule>, // 👈 Inject Repo
        @InjectRepository(Tenant) private readonly tenantRepo: Repository<Tenant> // 👈 Inject Tenant Repo for ID lookup
    ) { }

    // Helpers
    private matchesScope(key: string, list: string[]): boolean { return list.some(item => key.includes(item)); }
    private isDateOrGarbageNumber(val: string): boolean {
        const num = Number(val);
        if (!isNaN(num) && num > 10000 && num < 60000) return false;
        if (val.replace(/\s/g, '').match(/^\d{8,11}$/)) return false;
        return !!(val.replace(/\s/g, '').match(/^\d{5,10}$/) || this.parseSmartDate(val));
    }
    private excelSerialDateToJS(serial: number): Date {
        const utc_days = Math.floor(serial - 25569);
        const utc_value = utc_days * 86400;
        const date_info = new Date(utc_value * 1000);
        const fractional_day = serial - Math.floor(serial) + 0.0000001;
        let total_seconds = Math.floor(86400 * fractional_day);
        const seconds = total_seconds % 60;
        total_seconds -= seconds;
        const hours = Math.floor(total_seconds / (60 * 60));
        const minutes = Math.floor(total_seconds / 60) % 60;
        return new Date(Date.UTC(date_info.getUTCFullYear(), date_info.getUTCMonth(), date_info.getUTCDate(), hours, minutes, seconds));
    }
    private parseSmartDate(val: any): Date | null {
        if (!val) return null;
        if (val instanceof Date) return val;
        if (typeof val === 'number') { if (val > 10000 && val < 60000) return this.excelSerialDateToJS(val); return null; }
        if (typeof val === 'string' && !isNaN(Number(val))) { const n = Number(val); if (n > 10000 && n < 60000) return this.excelSerialDateToJS(n); }
        if (typeof val === 'string') {
            const cleanVal = val.trim();
            const m = cleanVal.match(/(\d{1,2})[\.\/\-\s]+(\d{1,2})[\.\/\-\s]+(\d{2,4})/);
            if (m) {
                let day = parseInt(m[1]), month = parseInt(m[2]), year = parseInt(m[3]);
                if (year < 100) year += year > 50 ? 1900 : 2000;
                if (month < 1 || month > 12) return null;
                if (day < 1 || day > 31) return null;
                return new Date(Date.UTC(year, month - 1, day));
            }
        }
        return null;
    }
    private getLimaDateISO(): string {
        return new Date().toLocaleString('sv', { timeZone: 'America/Lima' }).replace(' ', 'T') + '-05:00';
    }

    // --- MÉTODOS ---

    async importPatients(files: any[], tenantSlug: string) {
        // 🛡️ SECURITY CHECK: ONE-SHOT VALIDATION
        // We need tenantId first.
        const tenant = await this.tenantRepo.findOne({ where: { slug: tenantSlug } });
        if (!tenant) throw new BadRequestException(`No existe la empresa con slug: ${tenantSlug}`);

        const moduleRecord = await this.tenantModuleRepo.findOne({
            where: {
                tenantId: tenant.id,
                module: { code: ModuleCode.UTIL_IMPORTER }
            },
            relations: ['module']
        });

        // If no record exists, strictly blocked? Or check active_modules in JSON?
        // "Security Architecture" implies stricter check on Entity.
        if (!moduleRecord) {
            // Fallback/Legacy check: Is it in config?
            if (!tenant.config?.active_modules?.includes(ModuleCode.UTIL_IMPORTER)) {
                throw new ForbiddenException('No tienes una suscripción activa al Migrador (util_importer).');
            }
            // If in config but not in Entity (legacy), we might allow or block. 
            // Strategy: Warn but ALLOW for legacy, but we should create entity.
            // For now, let's enforce "Must have Entity" for the One-Shot logic to work reliably.
            // BUT since we just added logic to create entity during subscription, existing users might not have it.
            // Let's create it if missing but present in JSON?
            // No, simpler: Block if not strictly allowed.
            // "No usage record found for importer."
        } else {
            if (moduleRecord.usage_status === 'CONSUMED') {
                throw new ForbiddenException('⛔ El importador ya fue utilizado. Esta es una herramienta de uso único.');
            }
            if (moduleRecord.usage_status === 'EXPIRED' || (moduleRecord.valid_until && new Date() > moduleRecord.valid_until)) {
                throw new ForbiddenException('⛔ El periodo de importación ha caducado.');
            }
        }

        const queryRunner = this.connection.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        const results: string[] = [];
        const DEFAULT_ANTECEDENTES = { medicos: "NO REFIERE", quirurgicos: "NO REFIERE", alergicos: "NO REFIERE", medicamentos: "NO REFIERE" };
        const DEFAULT_EVALUATION = { tipo_piel: "NO ESPECIFICADO", aspecto: "NO ESPECIFICADO", color: "NO ESPECIFICADO", textura: "NO ESPECIFICADO" };

        try {
            this.logger.log(`🔍 DEBUG: Iniciando análisis para ${tenantSlug}`);

            // Tenant already fetched above
            // const tenant = await queryRunner.manager.findOne(Tenant, { where: { slug: tenantSlug } });
            // if (!tenant) throw new BadRequestException(`No existe la empresa con slug: ${tenantSlug}`);

            const storageBase = path.join(process.cwd(), 'storage');
            const tenantDir = path.join(storageBase, tenantSlug);
            if (!fs.existsSync(tenantDir)) fs.mkdirSync(tenantDir, { recursive: true });

            for (const file of files) {
                const workbook = XLSX.read(file.buffer, { type: 'buffer' });
                const sheet = workbook.Sheets[workbook.SheetNames[0]];
                const data: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '', blankrows: true });

                let extractedDni = '';
                let extractedName = '';
                const rootData: any = { diagnostico: "PENDIENTE", tratamiento: "PENDIENTE" };
                const basicInfo: any = { occupation: "NO ESPECIFICADO", address: "", birthDate: null };
                const newAntecedentes: any = { ...DEFAULT_ANTECEDENTES };
                const newEvaluation: any = { ...DEFAULT_EVALUATION };
                const newOtherInfo = {};

                const SCOPES = { ROOT_DIAGNOSTICO: ['DIAGNOSTICO', 'DIAGNÓSTICO'], ROOT_TRATAMIENTO: ['TRATAMIENTO', 'PLAN', 'INDICACIONES'], EVALUATION_FISICA: ['TIPO DE PIEL', 'TIPO PIEL', 'ASPECTO', 'COLOR', 'TEXTURA', 'BIOTIPO', 'FOTOTIPO', 'LESIONES'], ANTECEDENTES: ['MEDICOS', 'ALERGICOS', 'QUIRURGICOS', 'MEDICAMENTOS', 'FARMACOS', 'PATOLOGICOS', 'ANTECEDENTES'], BASIC: ['NOMBRE', 'PACIENTE', 'DNI', 'CEDULA', 'OCUPACION', 'DIRECCION', 'NACIMIENTO', 'EDAD', 'TELEFONO', 'FECHA DE NAC', 'FECHA NAC', 'F. NAC'] };

                for (const row of data.slice(0, 60)) {
                    for (let k = 0; k < row.length; k++) {
                        const cellRaw = row[k];
                        const cell = cellRaw ? cellRaw.toString().trim() : '';
                        if (!cell || this.isDateOrGarbageNumber(cell)) continue;

                        let key = '', val = '', consumedNext = false;
                        if (cell.includes(':')) {
                            const parts = cell.split(':'); key = parts[0].trim().toUpperCase(); val = parts.slice(1).join(':').trim();
                            if (!val && row[k + 1]) { val = row[k + 1] ? row[k + 1].toString().trim() : ''; consumedNext = true; }
                        } else {
                            const nextCell = row[k + 1] ? row[k + 1].toString().trim() : '';
                            if (cell.length > 2 && cell.length < 40 && isNaN(Number(cell)) && nextCell) { key = cell.toUpperCase(); val = nextCell; consumedNext = true; }
                        }

                        if (!key || !val) continue;

                        if (this.matchesScope(key, SCOPES.ROOT_DIAGNOSTICO)) rootData.diagnostico = val;
                        else if (this.matchesScope(key, SCOPES.ROOT_TRATAMIENTO)) rootData.tratamiento = val;
                        else if (this.matchesScope(key, SCOPES.EVALUATION_FISICA)) {
                            let jsonKey = key.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
                            if (jsonKey === 'tipo_de_piel') jsonKey = 'tipo_piel';
                            newEvaluation[jsonKey] = val;
                        }
                        else if (this.matchesScope(key, SCOPES.ANTECEDENTES)) {
                            const cleanKey = key.toLowerCase().replace(/\s+/g, '_').replace(/[:\.]/g, '');
                            const matchedKey = Object.keys(DEFAULT_ANTECEDENTES).find(k => cleanKey.includes(k));
                            if (matchedKey) newAntecedentes[matchedKey] = val;
                            else newAntecedentes[cleanKey] = val;
                        }
                        else if (this.matchesScope(key, SCOPES.BASIC)) {
                            if (key.includes('NOMBRE') || key.includes('PACIENTE')) extractedName = val;
                            if (key.includes('DNI') || key.includes('CEDULA')) extractedDni = val.replace(/[^a-zA-Z0-9]/g, '');
                            if (key.includes('OCUPACION')) basicInfo.occupation = val;
                            if (key.includes('DIRECCION')) basicInfo.address = val;
                            if (key.includes('NAC')) {
                                const parsedBDate = this.parseSmartDate(val);
                                if (parsedBDate) basicInfo.birthDate = parsedBDate;
                            }
                        } else newOtherInfo[key.replace(/[^a-zA-Z0-9_ ]/g, '')] = val;
                        if (consumedNext) k++;
                    }
                }

                if (!extractedName && data.length > 0 && data[0][0]) extractedName = data[0][1] ? data[0][1].toString() : '';
                if (!extractedName) { this.logger.warn(`⚠️ SKIP: No encontré nombre en ${file.originalname}`); continue; }

                let internalId = extractedDni;
                if (!internalId) {
                    const nameSanitized = extractedName.trim().toUpperCase().replace(/\s+/g, '');
                    const nameHash = crypto.createHash('md5').update(nameSanitized).digest('hex').substring(0, 10).toUpperCase();
                    internalId = `TEMP-${nameHash}`;
                } else internalId = `TEMP-${extractedDni}`;

                let patient = await queryRunner.manager.findOne(Patient, { where: { internalId } });
                if (!patient) {
                    patient = new Patient();
                    patient.internalId = internalId;
                    patient.records = [];
                }

                patient.name = extractedName.toUpperCase();
                patient.tenant = tenant;
                patient.occupation = basicInfo.occupation;
                patient.address = basicInfo.address;
                patient.birthDate = basicInfo.birthDate;
                patient.diagnostico = rootData.diagnostico;
                patient.tratamiento = rootData.tratamiento;
                patient.antecedentes = newAntecedentes;
                patient.evaluation = newEvaluation;
                patient.other_info = Object.keys(newOtherInfo).length > 0 ? newOtherInfo : {};
                if (!patient.status) patient.status = PatientStatus.DRAFT;

                patient = await queryRunner.manager.save(patient);
                const patientUUID = patient.id;
                results.push(patientUUID);

                const patientDir = path.join(tenantDir, patientUUID);
                if (!fs.existsSync(patientDir)) fs.mkdirSync(patientDir, { recursive: true });

                const safeOriginalName = file.originalname.replace(/[^a-zA-Z0-9.\-_ ()]/g, '_');
                fs.writeFileSync(path.join(patientDir, safeOriginalName), file.buffer);

                const workbookImage = new ExcelJS.Workbook();
                await workbookImage.xlsx.load(file.buffer);
                const worksheet = workbookImage.getWorksheet(1);
                const imagesByRow = new Map<number, any[]>();
                if (worksheet) {
                    for (const image of worksheet.getImages()) {
                        const img = workbookImage.model.media?.find((m: any) => m.index === Number(image.imageId));
                        if (img) {
                            const r = Math.floor(image.range.tl.nativeRow) + 1;
                            if (!imagesByRow.has(r)) imagesByRow.set(r, []);
                            imagesByRow.get(r)!.push(img);
                        }
                    }
                }

                let earliestDate: Date | null = null;
                let visitCount = 0;

                for (let i = 0; i < data.length; i++) {
                    const row = data[i];
                    if (!row || row.length === 0) continue;

                    let detectedDate: Date | null = null;
                    let dateColIndex = -1;

                    for (let c = 0; c < 15; c++) {
                        const cellVal = row[c] ? row[c].toString() : '';
                        detectedDate = this.parseSmartDate(cellVal);
                        if (detectedDate) {
                            dateColIndex = c;
                            if (patient.birthDate) {
                                const bDate = new Date(patient.birthDate);
                                if (detectedDate.toISOString().split('T')[0] === bDate.toISOString().split('T')[0]) continue;
                            }
                            if (detectedDate.getFullYear() > new Date().getFullYear() + 1) continue;
                            break;
                        }
                    }

                    if (detectedDate) {
                        if (!earliestDate || detectedDate < earliestDate) earliestDate = detectedDate;

                        let titleCandidate = (row[dateColIndex + 1] || '').toString().trim();
                        let forceStep = false;
                        if (titleCandidate.length > 40 || titleCandidate.toUpperCase().includes('FALTA')) forceStep = true;

                        const recordData = {
                            date: detectedDate,
                            title: (!titleCandidate || forceStep) ? 'Consulta / Procedimiento' : titleCandidate,
                            steps: [] as string[],
                            attachments: [] as string[],
                            notes: ''
                        };

                        if (forceStep && titleCandidate) recordData.steps.push(titleCandidate);

                        for (let c = dateColIndex + 2; c < 10; c++) {
                            const extraText = (row[c] || '').toString().trim();
                            if (extraText.length > 2 && !this.isDateOrGarbageNumber(extraText)) recordData.steps.push(extraText);
                        }

                        const recordUUID = crypto.randomUUID();
                        const recordDir = path.join(patientDir, 'records', recordUUID);
                        if (!fs.existsSync(recordDir)) fs.mkdirSync(recordDir, { recursive: true });

                        let j = i + 1;
                        while (j < data.length) {
                            const nextRow = data[j];
                            const currentRowIndexExcel = j + 1;
                            const imgs = imagesByRow.get(currentRowIndexExcel);
                            if (imgs) {
                                for (const img of imgs) {
                                    const rawExt = img.extension || 'jpg';
                                    const ext = rawExt.startsWith('.') ? rawExt : `.${rawExt}`;
                                    const imgUUID = crypto.randomUUID();
                                    const fileName = `${imgUUID}${ext}`;
                                    fs.writeFileSync(path.join(recordDir, fileName), img.buffer);
                                    const pubUrl = `storage/${tenantSlug}/${patientUUID}/records/${recordUUID}/${fileName}`;
                                    if (!recordData.attachments.includes(pubUrl)) recordData.attachments.push(pubUrl);
                                }
                            }

                            if (!nextRow || nextRow.length === 0) { j++; continue; }
                            let nextIsDate = false;
                            for (let c = 0; c < 15; c++) {
                                const cellVal = nextRow[c] ? nextRow[c].toString() : '';
                                const d = this.parseSmartDate(cellVal);
                                if (d) {
                                    if (!patient.birthDate || d.toISOString().split('T')[0] !== new Date(patient.birthDate).toISOString().split('T')[0]) {
                                        nextIsDate = true; break;
                                    }
                                }
                            }
                            if (nextIsDate) break;
                            const nextColText = nextRow[0] ? nextRow[0].toString() : '';
                            if (nextColText.includes('NOMBRE:')) break;

                            const txtParts: string[] = [];
                            for (let c = 0; c < 10; c++) {
                                if (nextRow[c] !== undefined && nextRow[c] !== null && nextRow[c] !== '') txtParts.push(nextRow[c].toString());
                            }
                            const txt = txtParts.join(' ').trim();
                            if (txt.length > 2) recordData.steps.push(txt.replace(/^[-*,]/, '').trim());
                            j++;
                        }

                        if (recordData.steps.length === 0) recordData.steps.push("⚠️ Visita registrada en histórico. Sin detalles de procedimiento legibles.");
                        recordData.notes = recordData.steps.join('\n');

                        const visitJsonName = `PROCEDIMIENTOS.json`;
                        fs.writeFileSync(path.join(recordDir, visitJsonName), JSON.stringify({
                            id: recordUUID,
                            fecha: recordData.date.toISOString().split('T')[0],
                            titulo: recordData.title,
                            procedimiento: recordData.steps,
                            archivos: recordData.attachments.map(a => path.basename(a))
                        }, null, 2));

                        await queryRunner.query(
                            `INSERT INTO medical_record (id, date, title, notes, steps, attachments, createdAt, patientId) 
                     VALUES (?, ?, ?, ?, ?, ?, NOW(), ?)`,
                            [recordUUID, recordData.date, recordData.title, recordData.notes, JSON.stringify(recordData.steps), JSON.stringify(recordData.attachments), patientUUID]
                        );
                        visitCount++;
                    }
                }

                if (earliestDate) {
                    await queryRunner.manager.update(Patient, patient.id, { firstConsultationDate: earliestDate });
                    patient.firstConsultationDate = earliestDate;
                }

                // JSON PRINCIPAL (LIMPIO SIN TENANT)
                const safeName = patient.name.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase();
                const mainJsonName = `INFO_${patient.internalId}_${safeName}.json`;

                // 👇 LIMPIEZA: Quitamos 'tenant' para que sea igual al del servicio
                const { records, tenant: t, ...patientData } = patient;
                const patientSummary = {
                    ...patientData,
                    birthDate: patient.birthDate ? new Date(patient.birthDate).toISOString().split('T')[0] : null,
                    firstConsultationDate: patient.firstConsultationDate ? new Date(patient.firstConsultationDate).toISOString().split('T')[0] : null,
                    importedAt: new Date().toISOString(),
                    totalVisits: visitCount
                };
                fs.writeFileSync(path.join(patientDir, mainJsonName), JSON.stringify(patientSummary, null, 2));
            }

            await queryRunner.commitTransaction();

            // 🛡️ SECURITY: MARK AS CONSUMED
            if (moduleRecord) {
                moduleRecord.usage_status = 'CONSUMED';
                await this.tenantModuleRepo.save(moduleRecord);
                this.logger.log(`🔒 Importer marked as CONSUMED for tenant ${tenantSlug}`);
            }

            return { processed: results.length };

        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw new BadRequestException(error.message);
        } finally {
            await queryRunner.release();
        }
    }

    async markAsReady(id: string) {
        const queryRunner = this.connection.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
        try {
            await queryRunner.query(`UPDATE patient SET status = 'READY' WHERE id = ?`, [id]);
            await queryRunner.commitTransaction();
            return { status: 'OK' };
        } catch (err) {
            await queryRunner.rollbackTransaction();
            throw new BadRequestException(err.message);
        } finally { await queryRunner.release(); }
    }

    // Método batch añadido
    async markReadyBatch(ids: string[]) {
        const queryRunner = this.connection.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
        try {
            if (ids.length === 0) return { count: 0 };

            for (const id of ids) {
                await queryRunner.query(`UPDATE patient SET status = 'READY' WHERE id = ?`, [id]);
            }

            await queryRunner.commitTransaction();
            return { count: ids.length };
        } catch (err) {
            await queryRunner.rollbackTransaction();
            throw new BadRequestException(err.message);
        } finally { await queryRunner.release(); }
    }

    async finalizeBatch(tenantSlug: string) {
        const queryRunner = this.connection.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        const storageBase = path.join(process.cwd(), 'storage');
        const tenantDir = path.join(storageBase, tenantSlug);

        try {
            const candidates = await queryRunner.manager.find(Patient, { where: { status: PatientStatus.READY }, order: { firstConsultationDate: 'ASC' }, relations: ['records'] });
            if (candidates.length === 0) return { message: 'No hay pacientes listos.' };

            const lastActive = await queryRunner.manager.findOne(Patient, { where: { status: PatientStatus.ACTIVE }, order: { internalId: 'DESC' } });
            let nextSequence = 1;
            if (lastActive && lastActive.internalId.startsWith('HC-')) {
                const numPart = parseInt(lastActive.internalId.split('-')[1]);
                if (!isNaN(numPart)) nextSequence = numPart + 1;
            }
            const results: any[] = [];

            for (const patient of candidates) {
                const oldInternalId = patient.internalId;
                const newInternalId = `HC-${nextSequence.toString().padStart(4, '0')}`;

                patient.internalId = newInternalId;
                patient.status = PatientStatus.ACTIVE;
                const saved = await queryRunner.manager.save(patient);
                results.push({ old: oldInternalId, new: newInternalId });
                nextSequence++;

                // ACTUALIZAR JSON FÍSICO
                if (fs.existsSync(tenantDir)) {
                    const patientDir = path.join(tenantDir, patient.id);
                    if (fs.existsSync(patientDir)) {
                        const files = fs.readdirSync(patientDir);
                        files.forEach(f => { if (f.startsWith(`INFO_${oldInternalId}`)) fs.unlinkSync(path.join(patientDir, f)); });

                        const safeName = patient.name.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase();
                        const newJsonName = `INFO_${newInternalId}_${safeName}.json`;

                        // 👇 LIMPIEZA AQUÍ TAMBIÉN
                        const { records, tenant: t, ...patientData } = saved;

                        const jsonContent = {
                            ...patientData,
                            internalId: newInternalId,
                            status: 'ACTIVE',
                            birthDate: patient.birthDate ? new Date(patient.birthDate).toISOString().split('T')[0] : null,
                            firstConsultationDate: patient.firstConsultationDate ? new Date(patient.firstConsultationDate).toISOString().split('T')[0] : null,
                            lastUpdate: this.getLimaDateISO()
                        };

                        fs.writeFileSync(path.join(patientDir, newJsonName), JSON.stringify(jsonContent, null, 2));
                    }
                }
            }
            await queryRunner.commitTransaction();
            return { processed: results.length, details: results };
        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw new BadRequestException(error.message);
        } finally { await queryRunner.release(); }
    }

    async runDiagnostics(tenantSlug: string) {
        const queryRunner = this.connection.createQueryRunner();
        await queryRunner.connect();
        try {
            const tables = await queryRunner.query(`SHOW TABLES`);
            const patients = await queryRunner.query(`SELECT id, name, internalId, tenantId FROM patient`);
            const records = await queryRunner.query(`SELECT id, date, title, patientId FROM medical_record ORDER BY createdAt DESC LIMIT 10`);
            return { status: 'DIAGNOSTICS_COMPLETE', tenant: tenantSlug, tables, patients, records, analysis: patients.length > 0 && !patients[0].tenantId ? 'ERROR: TENANT ID NULL' : 'OK' };
        } catch (err) { return { error: err.message }; }
        finally { await queryRunner.release(); }
    }
}