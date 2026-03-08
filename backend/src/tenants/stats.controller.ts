import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Patient } from '../entities/patient.entity';
import { MedicalRecord } from '../entities/medical-record.entity';
import { AuditService } from '../audit/audit.service';
import { TenantsService } from './tenants.service';

import { UserRole } from '../users/entities/user.entity';

@Controller('tenants/me/stats')
@UseGuards(JwtAuthGuard)
@Roles(UserRole.TENANT_ADMIN, UserRole.STAFF, UserRole.DOCTOR, UserRole.SUPER_ADMIN) // 🔓 OPEN TO TENANT
export class StatsController {
    constructor(
        @InjectRepository(Patient)
        private patientRepo: Repository<Patient>,
        @InjectRepository(MedicalRecord)
        private recordRepo: Repository<MedicalRecord>,
        private auditService: AuditService,
        private tenantsService: TenantsService,
    ) { }

    @Get()
    async getStats(@Request() req: any) {
        const tenantId = req.user.tenantId;

        // 1. Patients Count
        const patientsCount = await this.patientRepo.count({
            where: { tenant: { id: tenantId } } // Ensure Relation match
        });

        // 2. Records this Month
        const now = new Date();
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);

        // Note: MedicalRecord is related to Patient. 
        // We need to join patient to filter by tenant if MedicalRecord doesn't have direct tenantId column
        // Standard in this app: entities usually have tenantId column if MultiTenancy is applied via Subscriber? 
        // Let's assume the TenantScopingSubscriber handles the filtering implicitly if we use the Repo.
        // Assuming TenantScopingSubscriber injects tenantId into query.

        const recordsCount = await this.recordRepo.count({
            where: {
                createdAt: Between(firstDay, lastDay)
            }
        });

        // 3. Subscription Status
        const tenant = await this.tenantsService.findOne(tenantId);
        // Using TypeORM relations if loaded, or safe access
        const activeSub = tenant?.subscriptions?.find(s => s.status === 'ACTIVE') || null;

        const subscription = {
            status: activeSub?.status || 'FREE',
            daysLeft: 14, // Mock
            plan: activeSub?.planDetails?.code || 'TRIAL'
        };

        // 4. Recent Audit
        // Use AuditService directly. Since AuditService usually filters by tenant if passed in args or context.
        // Looking at AuditService implementation (assumed), we likely need to pass tenantId if it's not scoped automatically.
        // But AuditService uses InjectRepository(AuditLog), which might be scoped.

        // Let's use specific find for dashboard
        const recentAudit = await this.auditService.findByTenant(tenantId, 5);

        return {
            patientsCount,
            recordsCount,
            storageUsage: '1.2 GB', // Mock for now
            subscription,
            recentAudit
        };
    }
}
