import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TenantsService } from './tenants.service';
import { TenantsController } from './tenants.controller';
import { StatsController } from './stats.controller'; // 👈 Added
import { Tenant } from './entities/tenant.entity';
import { TenantModule as TenantModuleEntity } from './entities/tenant-module.entity';
import { MarketplaceModule } from '../marketplace/entities/marketplace-module.entity';
import { TenantConnectionProvider } from './tenant-connection.provider';
import { TenantScopingSubscriber } from './tenant.subscriber';

import { Subscription } from '../billing/entities/subscription.entity';
import { UsersModule } from '../users/users.module';
import { AuditModule } from '../audit/audit.module';
import { Patient } from '../entities/patient.entity';
import { MedicalRecord } from '../entities/medical-record.entity';
import { SaasModule } from '../saas/saas.module';

@Global()
@Module({
  imports: [
    TypeOrmModule.forFeature([Tenant, TenantModuleEntity, MarketplaceModule, Subscription, Patient, MedicalRecord]), // 👈 Added Patient & Record for Stats
    UsersModule,
    AuditModule, // 👈 Added AuditModule
    SaasModule, // 👈 Added SaasModule for Genesis
  ],
  controllers: [TenantsController, StatsController], // 👈 Added StatsController
  providers: [
    TenantsService,
    TenantConnectionProvider,
    TenantScopingSubscriber
  ],
  exports: [
    TenantsService,
    TenantConnectionProvider
  ],
})
export class TenantsModule { }