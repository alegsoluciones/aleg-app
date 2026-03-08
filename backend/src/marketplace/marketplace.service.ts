import { Injectable, Logger, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tenant } from '../tenants/entities/tenant.entity';
import { AuditService } from '../audit/audit.service';
import { MarketplaceModule as MarketplaceModuleEntity } from './entities/marketplace-module.entity';
import { TenantModule, TenantModuleStatus } from '../tenants/entities/tenant-module.entity';
import { CreateMarketplaceModuleDto } from './dto/create-marketplace-module.dto';
import { ModuleCode } from '../common/enums/modules.enum';

export interface ModuleDefinition {
    code: string;
    name: string;
    description: string;
    price: number;
    icon: string;
}

@Injectable()
export class MarketplaceService {
    private readonly logger = new Logger(MarketplaceService.name);

    constructor(
        @InjectRepository(Tenant)
        private tenantRepo: Repository<Tenant>,
        @InjectRepository(MarketplaceModuleEntity)
        private marketplaceRepo: Repository<MarketplaceModuleEntity>,
        @InjectRepository(TenantModule)
        private tenantModuleRepo: Repository<TenantModule>,
        private auditService: AuditService,
    ) { }

    async getAvailableModules() {
        // Return from DB
        return this.marketplaceRepo.find({ where: { isActive: true } });
    }

    async create(dto: CreateMarketplaceModuleDto) {
        const existing = await this.marketplaceRepo.findOne({ where: { code: dto.code } });
        if (existing) {
            // Update instead of fail? No, seeder handles conflicts usually by strictly creating.
            // But for seed script sake, let's update if exists or just return existing.
            // Let's implement upsert logic for seed script friendliness.
            Object.assign(existing, dto);
            return this.marketplaceRepo.save(existing);
        }
        const module = this.marketplaceRepo.create(dto);
        return this.marketplaceRepo.save(module);
    }

    async subscribeToModule(tenantId: string, moduleCode: string, userEmail: string) {
        try {
            const module = await this.marketplaceRepo.findOne({ where: { code: moduleCode } });
            if (!module) throw new Error('Módulo no encontrado en el catálogo');

            const tenant = await this.tenantRepo.findOne({ where: { id: tenantId } });
            if (!tenant) throw new Error('Tenant no encontrado');

            // 🛡️ SAFE CONFIG INIT & CLONE
            // Force cloned object for TypeORM detection
            let newConfig: any = tenant.config ? JSON.parse(JSON.stringify(tenant.config)) : {};
            if (!newConfig.active_modules) newConfig.active_modules = [];

            // Idempotency check
            if (newConfig.active_modules.includes(moduleCode)) {
                return { message: 'Módulo ya está activo', success: true };
            }

            // Activate Module
            newConfig.active_modules.push(moduleCode);
            tenant.config = newConfig;

            await this.tenantRepo.save(tenant);

            // 🛡️ SECURITY: CREATE / UPDATE TENANT MODULE ENTITY
            // 1. 🕵️♂️ LOOKUP MODULE ENTITY
            const marketModule = await this.marketplaceRepo.findOne({ where: { code: moduleCode } });
            if (!marketModule) {
                throw new Error(`El módulo '${moduleCode}' no existe en el catálogo.`);
            }

            // 2. 🏗️ LOOKUP OR CREATE TENANT MODULE (Using TenantId + ModuleId via relation)
            // Need to join 'module' to check by code, OR check by module ID using the looked-up entity
            let tenantModule = await this.tenantModuleRepo.findOne({
                where: {
                    tenantId: tenant.id,
                    module: { code: marketModule.code }
                },
                relations: ['module']
            });

            if (!tenantModule) {
                tenantModule = this.tenantModuleRepo.create({
                    tenant: tenant,         // Full Entity
                    module: marketModule,   // Full Entity (TypeORM extracts ID)
                    status: TenantModuleStatus.ACTIVE
                });
            } else {
                tenantModule.status = TenantModuleStatus.ACTIVE;
                tenantModule.module = marketModule; // Ensure relation is fresh
            }

            // ONE-SHOT LOGIC: Importer
            if (moduleCode === ModuleCode.UTIL_IMPORTER) {
                const validUntil = new Date();
                validUntil.setDate(validUntil.getDate() + 30); // 30 Days Window

                tenantModule.usage_status = 'ACTIVE';
                tenantModule.valid_until = validUntil;
                this.logger.log(`🛡️ Module ${moduleCode} set to ONE-SHOT mode. Expires: ${validUntil.toISOString()}`);
            } else {
                tenantModule.usage_status = 'ACTIVE';
            }

            await this.tenantModuleRepo.save(tenantModule);

            // 4. 🔄 SINCRONIZAR JSON LEGACY (Para que el Frontend lo vea)
            if (!tenant.config) tenant.config = {};
            // Force deep clone to ensure TypeORM detects change
            const currentConfig = JSON.parse(JSON.stringify(tenant.config));

            if (!currentConfig.active_modules) currentConfig.active_modules = [];

            // Add if not exists using Set for uniqueness
            const modulesSet = new Set(currentConfig.active_modules);
            modulesSet.add(moduleCode);
            currentConfig.active_modules = Array.from(modulesSet);

            tenant.config = currentConfig;
            await this.tenantRepo.save(tenant);

            this.logger.log(`✅ [Sync] Module ${moduleCode} activated for ${tenant.slug} in DB + JSON.`);

            // Audit
            await this.auditService.create({
                tenantId,
                userEmail,
                action: `MARKETPLACE_SUBSCRIBE`,
                metadata: { module: moduleCode, price: module.price, entityId: tenant.id },
            });

            this.logger.log(`Tenant ${tenant.name} subscribed to ${module.name}`);
            return { message: `Suscrito a ${module.name}`, success: true, active_modules: tenant.config.active_modules };
        } catch (error) {
            this.logger.error(`Error subscribing to module: ${error.message}`, error.stack);
            throw new ConflictException(`Error activando módulo: ${error.message}`);
        }
    }

    async unsubscribeFromModule(tenantId: string, moduleCode: string, userEmail: string) {
        try {
            if (moduleCode === ModuleCode.CORE_STD) {
                throw new ConflictException('No se puede desactivar el módulo Core Standard.');
            }

            const tenant = await this.tenantRepo.findOne({ where: { id: tenantId } });
            if (!tenant) throw new Error('Tenant no encontrado');

            // 🛡️ SAFE CONFIG INIT & CLONE
            let newConfig: any = tenant.config ? JSON.parse(JSON.stringify(tenant.config)) : {};
            if (!newConfig.active_modules) newConfig.active_modules = [];

            // Filter out the module
            const originalLength = newConfig.active_modules.length;
            newConfig.active_modules = newConfig.active_modules.filter(
                (m: string) => m !== moduleCode
            );

            // Save JSON config
            tenant.config = newConfig;
            await this.tenantRepo.save(tenant);

            // 🗑️ SYNC: REMOVE FROM NEW TABLE TOO
            // Lookup Module ID first to be safe
            const marketModule = await this.marketplaceRepo.findOne({ where: { code: moduleCode } });

            if (marketModule) {
                const activeModule = await this.tenantModuleRepo.findOne({
                    where: {
                        tenantId: tenant.id,
                        module: { code: marketModule.code }
                    }
                });

                if (activeModule) {
                    await this.tenantModuleRepo.remove(activeModule);
                    this.logger.log(`🗑️ Removed TenantModule entity for ${moduleCode} in tenant ${tenant.slug}`);
                }
            }

            // Audit
            await this.auditService.create({
                tenantId,
                userEmail,
                action: `MARKETPLACE_UNSUBSCRIBE`,
                metadata: { module: moduleCode, entityId: tenant.id },
            });

            this.logger.log(`Tenant ${tenant.name} unsubscribed from ${moduleCode}`);
            return { message: `Suscripción cancelada para ${moduleCode}`, success: true };
        } catch (error) {
            this.logger.error(`Error unsubscribing module: ${error.message}`, error.stack);
            throw new ConflictException(`Error desactivando módulo: ${error.message}`);
        }
    }
}
