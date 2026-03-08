import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MarketplaceService } from './marketplace.service';
import { MarketplaceController } from './marketplace.controller';
import { Tenant } from '../tenants/entities/tenant.entity';
import { AuditModule } from '../audit/audit.module';
import { MarketplaceModule as MarketplaceModuleEntity } from './entities/marketplace-module.entity';

import { TenantModule } from '../tenants/entities/tenant-module.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([Tenant, MarketplaceModuleEntity, TenantModule]),
        AuditModule
    ],
    controllers: [MarketplaceController],
    providers: [MarketplaceService],
    exports: [MarketplaceService] // Export if needed elsewhere
})
export class MarketplaceModule { }
