import { Injectable } from '@nestjs/common';
import PDFDocument from 'pdfkit';
import { Tenant } from '../../tenants/entities/tenant.entity';
import { Patient } from '../../entities/patient.entity';
import { MedicalRecord } from '../../entities/medical-record.entity';
import { StorageService } from './storage.service';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class PdfService {
    constructor(private readonly storageService: StorageService) { }

    async generateConsultationPdf(
        tenant: Tenant,
        patient: Patient,
        record: MedicalRecord,
        tenantSlug: string
    ): Promise<Buffer> {
        return new Promise((resolve, reject) => {
            const doc = new PDFDocument({ margin: 50, size: 'A4' });
            const buffers: Buffer[] = [];

            doc.on('data', buffers.push.bind(buffers));
            doc.on('end', async () => {
                const pdfData = Buffer.concat(buffers);

                // Save to Storage (Digital Twin)
                try {
                    const filename = `Consulta-${record.id.slice(0, 8)}.pdf`;

                    // 1. Get Secure Path
                    const { fullPath } = this.storageService.getSecurePath(tenantSlug, patient.internalId, patient.name, record.date);

                    // 2. Save File
                    this.storageService.saveFile(fullPath, filename, pdfData);

                } catch (e) {
                    console.error("Error archiving PDF", e);
                }

                resolve(pdfData);
            });
            doc.on('error', reject);

            // --- HEADER ---
            // Logo
            if (tenant.config?.branding?.logoUrl) {
                // Warning: loading remote images in pdfkit needs 'http' request or fetching buffer first.
                // For simplicity, we skip remote image fetch in this iteration unless easy.
                // We'll use text fallback for reliability.
            }

            doc.fontSize(20).text(tenant.name || 'CLÍNICA', { align: 'center' });
            doc.fontSize(10).text(tenant.config?.address || 'Dirección no registrada', { align: 'center' });
            doc.moveDown();
            doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
            doc.moveDown();

            // --- PATIENT INFO ---
            doc.fontSize(12).font('Helvetica-Bold').text('DATOS DEL PACIENTE');
            doc.fontSize(10).font('Helvetica');
            doc.text(`Nombre: ${patient.name}`, 50, doc.y + 5);
            doc.text(`Identificador: ${patient.internalId}`, 300, doc.y - 10);

            const age = patient.birthDate ? new Date().getFullYear() - new Date(patient.birthDate).getFullYear() : '--';
            doc.text(`Edad: ${age} Años`);

            if (patient.data) {
                doc.moveDown(0.5);
                Object.entries(patient.data).forEach(([key, val]) => {
                    doc.text(`${key.toUpperCase()}: ${val}`);
                });
            }
            doc.moveDown();

            // --- RECORD INFO ---
            doc.rect(50, doc.y, 500, 20).fill('#f0f0f0').stroke();
            doc.fillColor('black').fontSize(10).font('Helvetica-Bold')
                .text(`CONSULTA: ${record.date ? record.date.toString().split('T')[0] : ''}`, 60, doc.y - 15);

            doc.moveDown();
            doc.font('Helvetica-Bold').text(record.title || 'Consulta General');
            doc.font('Helvetica').moveDown(0.5);
            doc.text(record.notes || 'Sin notas registradas.');
            doc.moveDown();

            // Dynamic Data
            if (record.data) {
                doc.font('Helvetica-Bold').text('Detalles Adicionales:');
                doc.font('Helvetica');
                Object.entries(record.data).forEach(([key, val]) => {
                    doc.text(`• ${key.replace(/_/g, ' ').toUpperCase()}: ${val}`, { indent: 10 });
                });
                doc.moveDown();
            }

            // Treatment/Steps
            if (record.steps && record.steps.length > 0) {
                doc.font('Helvetica-Bold').text('Plan / Tratamiento:');
                record.steps.forEach(step => {
                    doc.font('Helvetica').text(`- ${step}`, { indent: 10 });
                });
            }

            // --- FOOTER ---
            const bottom = doc.page.height - 50;
            doc.fillColor('grey').fontSize(8).text(`Generado por ALEG APP - ${new Date().toLocaleDateString()}`, 50, bottom, { align: 'center' });

            doc.end();
        });
    }
}
