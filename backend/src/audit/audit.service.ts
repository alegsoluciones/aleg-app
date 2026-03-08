import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from './audit-log.entity';

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(
    @InjectRepository(AuditLog)
    private auditRepository: Repository<AuditLog>,
  ) { }

  // 👇 MÉTODO MAESTRO PARA CREAR LOGS (SANITIZADO)
  async create(data: Partial<AuditLog>) {
    try {
      // 1. Sanitización de seguridad (Doble check)
      if (data.metadata && typeof data.metadata === 'object') {
        // Si por error llega un password, lo eliminamos aquí también
        if ('password' in data.metadata) data.metadata.password = '***HIDDEN***';
      }

      // 2. Crear y Guardar
      const log = this.auditRepository.create(data);
      return await this.auditRepository.save(log);

    } catch (error) {
      // Si falla la auditoría, NO rompemos la app, solo avisamos en consola
      this.logger.error(`Falló al guardar log de auditoría: ${error.message}`);
    }
  }

  async findAll(limit: number = 50) {
    return this.auditRepository.find({
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  async findByTenant(tenantId: string, limit: number = 50) {
    return this.auditRepository.find({
      where: { tenantId },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }
}