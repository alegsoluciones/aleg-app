import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PatientsService } from './patients.service';
import { PatientsController } from './patients.controller';
import { Patient } from '../entities/patient.entity';
import { MedicalRecord } from '../entities/medical-record.entity';
import { StorageService } from '../common/services/storage.service';
import { PdfService } from '../common/services/pdf.service'; // 👈 Added
// 👇 IMPORTANTE: Importar el AuditModule
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Patient, MedicalRecord]),
    AuditModule, // 👈 AHORA SÍ: Permitimos que PatientsService use AuditService
  ],
  controllers: [PatientsController],
  providers: [
    PatientsService,
    StorageService,
    PdfService // 👈 Added
  ],
  exports: [PatientsService],
})
export class PatientsModule { }