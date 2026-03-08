
import { Injectable, OnApplicationBootstrap, Logger } from '@nestjs/common';
import { InjectEntityManager } from '@nestjs/typeorm';
import { EntityManager } from 'typeorm';
import { Tenant, TenantStatus } from '../../tenants/entities/tenant.entity';
import { User, UserRole } from '../../users/entities/user.entity';
import { MarketplaceModule } from '../../marketplace/entities/marketplace-module.entity';
import { BusinessProfile } from '../../marketplace/entities/business-profile.entity';
import { SubscriptionPlan } from '../../marketplace/entities/subscription-plan.entity';
import { Subscription, SubscriptionStatus } from '../../billing/entities/subscription.entity';
import * as bcrypt from 'bcrypt';
import { ModuleCode } from '../enums/modules.enum';
import { IndustryType } from '../enums/industry.enum';

@Injectable()
export class SeedService implements OnApplicationBootstrap {
    private readonly logger = new Logger(SeedService.name);

    constructor(
        @InjectEntityManager() private readonly entityManager: EntityManager,
    ) { }

    async onApplicationBootstrap() {
        await this.seed();
    }

    private async seed() {
        this.logger.log('🌱 Checking / Seeding Initial Data...');

        // 1. Tenants (Check Existence First)
        let systemTenant = await this.entityManager.findOne(Tenant, { where: { id: '00000000-0000-0000-0000-000000000000' } });
        if (!systemTenant) {
            systemTenant = this.entityManager.create(Tenant, {
                id: '00000000-0000-0000-0000-000000000000',
                name: 'SYSTEM ADMIN GLOBAL',
                slug: 'global-admin',
                industry: IndustryType.SYSTEM,
                status: TenantStatus.ACTIVE,
                isActive: true,
                config: {},
            });
            await this.entityManager.save(Tenant, systemTenant);
            this.logger.log('✅ System Tenant Created');

            // 1.1 Create Initial Subscription for System Tenant (LIFETIME)
            const systemSubscription = this.entityManager.create(Subscription, {
                tenant: systemTenant,
                status: SubscriptionStatus.ACTIVE,
                startDate: new Date(),
                endDate: new Date('2099-12-31'),
                planDetails: { name: 'SYSTEM_LIFETIME', features: ['ALL'] }
            });
            await this.entityManager.save(Subscription, systemSubscription);
            this.logger.log('✅ System Subscription Created');
        }

        // 1.5 & 1.6 Removed: Tenant creation logic moved to 'npm run seed' (seed.js)
        // to comply with "Single Source of Truth" architecture.

        // 2. Users (Check Exisitence)
        const adminEmail = 'superadmin@alegapp.com';
        let adminUser = await this.entityManager.findOne(User, { where: { email: adminEmail } });
        if (!adminUser) {
            const password = await bcrypt.hash('123456', 10);
            adminUser = this.entityManager.create(User, {
                id: '00000000-0000-0000-0000-000000000001',
                email: adminEmail,
                password: password,
                fullName: 'Super Admin',
                role: UserRole.SUPER_ADMIN,
                isActive: true,
                tenant: systemTenant,
            });
            await this.entityManager.save(User, adminUser);
            this.logger.log('✅ Admin User Created');
        }

        // 3. Marketplace Modules (Upsert or Ignore)
        const modules = [
            { code: ModuleCode.CORE_STD, name: 'Standard Core', category: 'CORE', price: 0, isActive: true, description: 'Pacientes, Citas, Dashboard Base.', dependencies: [] },
            { code: ModuleCode.MOD_LOGISTICS, name: 'Logística Avanzada', category: 'ADDON', price: 29.99, isActive: true, description: 'Inventario, Proveedores y Entradas/Salidas.', dependencies: [ModuleCode.CORE_STD] },
            { code: ModuleCode.UTIL_IMPORTER, name: 'Importador Excel', category: 'PLUGIN', price: 50.00, isActive: true, description: 'Herramienta de carga masiva de datos.', dependencies: [ModuleCode.CORE_STD] },
            { code: ModuleCode.MOD_FINANCIAL, name: 'Finanzas', category: 'ADDON', price: 29.99, isActive: true, description: 'Facturación, Caja Chica, Reportes Financieros.', dependencies: [ModuleCode.CORE_STD] },
            { code: ModuleCode.MOD_MARKETING, name: 'Marketing CRM', category: 'ADDON', price: 19.99, isActive: true, description: 'Campañas Email/WhatsApp y Lead Scoring.', dependencies: [ModuleCode.CORE_STD] },
            { code: ModuleCode.MOD_VET, name: 'Pack Veterinario', category: 'CORE', price: 0, isActive: true, description: 'Historia Clínica Vet, Razas y Vacunas.', dependencies: [ModuleCode.CORE_STD] }
        ];

        for (const mod of modules) {
            const exists = await this.entityManager.findOne(MarketplaceModule, { where: { code: mod.code } });
            if (!exists) {
                // @ts-ignore
                await this.entityManager.save(MarketplaceModule, mod);
                this.logger.log(`✅ Module ${mod.code} Created`);
            }
        }

        // 4. Business Profiles
        const profiles = [
            { code: 'PROFILE_CLINIC', name: 'Clínica Médica', description: 'Para centros de salud humana' },
            { code: 'PROFILE_VET', name: 'Clínica Veterinaria', description: 'Para centros de salud animal' },
            { code: 'PROFILE_EVENTS', name: 'Gestión de Eventos', description: 'Para control de accesos y stands' },
            { code: 'PROFILE_CRAFT', name: 'Emprendimiento', description: 'Para negocios pequeños' }
        ];

        for (const p of profiles) {
            const exists = await this.entityManager.findOne(BusinessProfile, { where: { code: p.code } });
            if (!exists) {
                await this.entityManager.save(BusinessProfile, p);
                this.logger.log(`✅ Profile ${p.code} Created`);
            }
        }

        // 5. Subscription Plans
        const plans = [
            { code: 'PLAN_DERMA_PRO', name: 'Derma Pro', price_monthly: 99.00, price_annual: 990.00, profileCode: 'PROFILE_CLINIC' },
            { code: 'PLAN_VET_BASIC', name: 'Vet Basic', price_monthly: 49.00, price_annual: 490.00, profileCode: 'PROFILE_VET' },
            { code: 'PLAN_EMPRENDEDOR', name: 'Emprendedor', price_monthly: 19.00, price_annual: 190.00, profileCode: 'PROFILE_CRAFT' }
        ];

        for (const p of plans) {
            const exists = await this.entityManager.findOne(SubscriptionPlan, { where: { code: p.code } });
            if (!exists) {
                const profile = await this.entityManager.findOne(BusinessProfile, { where: { code: p.profileCode } });
                if (profile) {
                    const plan = this.entityManager.create(SubscriptionPlan, { ...p, profile });
                    await this.entityManager.save(SubscriptionPlan, plan);
                    this.logger.log(`✅ Plan ${p.code} Created`);
                }
            }
        }

        this.logger.log('✨ Database Seeding Verified/Complete!');
    }
}
