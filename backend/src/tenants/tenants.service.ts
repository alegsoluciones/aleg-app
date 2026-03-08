import { Injectable, ConflictException, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { Tenant, TenantStatus } from './entities/tenant.entity';
import { TenantModule, TenantModuleStatus } from './entities/tenant-module.entity';
import { MarketplaceModule } from '../marketplace/entities/marketplace-module.entity';
import { Subscription, SubscriptionStatus } from '../billing/entities/subscription.entity';
import { UsersService } from '../users/users.service';
import { UserRole } from '../users/entities/user.entity'; // Need Role enum

import { DataSource } from 'typeorm'; // 👈 Import DataSource
import * as bcrypt from 'bcrypt';
import { User } from '../users/entities/user.entity';
import { ModuleCode } from '../common/enums/modules.enum';
import { IndustryTemplate } from '../saas/entities/industry-template.entity';
import { IndustryService } from '../saas/industry.service';

@Injectable()
export class TenantsService {
  private readonly logger = new Logger(TenantsService.name);

  constructor(
    @InjectRepository(Tenant)
    private readonly tenantRepository: Repository<Tenant>,
    @InjectRepository(TenantModule)
    private readonly tenantModuleRepository: Repository<TenantModule>,
    @InjectRepository(MarketplaceModule)
    private readonly moduleRepository: Repository<MarketplaceModule>,
    @InjectRepository(Subscription)
    private readonly subscriptionRepository: Repository<Subscription>,
    private readonly usersService: UsersService,
    private readonly dataSource: DataSource,
    private readonly industryService: IndustryService, // 👈 Inject IndustryService
  ) { }

  // ... (create, findAll, findOne, update, remove, findOneBySlug methods remain the same) ...

  async create(createTenantDto: CreateTenantDto) {
    const { name, slug, industry, adminEmail } = createTenantDto;
    const existing = await this.findOneBySlug(slug);
    if (existing) throw new ConflictException('El código (slug) de la empresa ya existe.');

    // Validar si el email ya existe antes de la transacción (optimización)
    const existingUser = await this.usersService.findOne(adminEmail);
    if (existingUser) throw new ConflictException('El correo ya está registrado');

    let cleanName = name.toUpperCase().trim().replace(/[^A-Z0-9Ñ\s.-]/g, '');

    // 1. Build Config (SaaS Genesis Logic)
    // Fetch Template
    const industryType = industry || 'CLINICAL';
    let template: IndustryTemplate | null = null;
    try {
      template = await this.industryService.findByType(industryType);
    } catch (e) {
      this.logger.warn(`Industry Template not found for ${industryType}, using defaults.`);
    }

    const defaultModules = template?.defaultModules || ['core-std'];
    const defaultSettings = template?.defaultSettings || { currency: 'USD', timezone: 'UTC' };
    const defaultLayout = template?.defaultLayout || [];

    const config = {
      industry: industryType,
      branding: { theme: defaultSettings.theme || 'default', logoUrl: null },
      settings: { ...defaultSettings },
      active_modules: defaultModules, // Initial JSON state
      ...(createTenantDto.config || {})
    };

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 2. Create Tenant
      const newTenant = queryRunner.manager.create(Tenant, {
        name: cleanName,
        slug: slug,
        isActive: true,
        config: config,
        industry: industryType,
        dashboardLayout: defaultLayout, // 👈 Save Layout
        status: TenantStatus.ACTIVE
      });
      const savedTenant = await queryRunner.manager.save(newTenant);
      this.logger.log(`Creating new SaaS Tenant: ${cleanName} (${industryType})`);

      // 2.5 Activate Default Modules (SQL)
      // Fetch actual Module entities from DB based on template codes
      if (defaultModules.length > 0) {
        const modulesToActivate = await this.moduleRepository.createQueryBuilder("m")
          .where("m.code IN (:...codes)", { codes: defaultModules })
          .getMany();

        for (const mod of modulesToActivate) {
          const tm = queryRunner.manager.create(TenantModule, {
            tenant: savedTenant,
            module: mod,
            status: TenantModuleStatus.ACTIVE,
            usage_status: 'ACTIVE',
            expires_at: '2030-01-01' // Perpetual for now/trial
          });
          await queryRunner.manager.save(tm);
        }
      }

      // 3. Create Trial Subscription (Genesis)
      const trialSub = queryRunner.manager.create(Subscription, {
        status: SubscriptionStatus.TRIAL,
        startDate: new Date(),
        endDate: new Date(new Date().setDate(new Date().getDate() + 30)), // 30 days trial
        planDetails: { name: 'TRIAL', price: 0, limits: { users: 5 } },
        tenant: savedTenant
      });
      await queryRunner.manager.save(trialSub);
      this.logger.log(`Subscription TRIAL created for ${savedTenant.slug}`);

      // 4. Create Admin User (Manually inside transaction)
      const salt = await bcrypt.genSalt();
      const hashedPassword = await bcrypt.hash('123456', salt); // Default password as per seed.js

      const newUser = queryRunner.manager.create(User, {
        email: adminEmail,
        password: hashedPassword,
        fullName: 'Admin ' + cleanName,
        role: UserRole.TENANT_ADMIN,
        tenantId: savedTenant.id
      });
      await queryRunner.manager.save(newUser);
      this.logger.log(`Admin User created: ${adminEmail} for tenant ${savedTenant.id}`);

      await queryRunner.commitTransaction();
      return savedTenant;

    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(`Error creating tenant: ${error.message}`, error.stack);
      if (error.code === 'ER_DUP_ENTRY' || error.message.includes('Duplicate')) {
        throw new ConflictException('Datos duplicados (email o slug).');
      }
      throw new InternalServerErrorException('Error al registrar la empresa.');
    } finally {
      await queryRunner.release();
    }
  }

  async findAll() {
    return await this.tenantRepository.find({ order: { createdAt: 'DESC' } });
  }

  async findAllForAdmin() {
    const tenants = await this.tenantRepository.find({
      relations: ['modules', 'modules.module'], // Join the relation inside tenant modules
      order: { createdAt: 'DESC' }
    });
    return tenants.map(t => {
      const relationalModules = t.modules
        ?.filter(m => m.status === TenantModuleStatus.ACTIVE)
        .map(m => m.module?.code).filter(Boolean) || []; // Map from relation

      const legacyModules = (t.config && Array.isArray(t.config.active_modules))
        ? t.config.active_modules
        : [];

      return {
        id: t.id,
        name: t.name,
        slug: t.slug,
        industry: t.industry || (t.config?.industry) || 'CLINICAL',
        status: t.status,
        plan: 'TRIAL',
        active_modules: Array.from(new Set([...relationalModules, ...legacyModules]))
      };
    });
  }

  async findOne(id: string) {
    return await this.tenantRepository.findOneBy({ id });
  }

  async update(id: string, updateTenantDto: UpdateTenantDto) {
    try {
      if (updateTenantDto.name) {
        updateTenantDto.name = updateTenantDto.name.toUpperCase().replace(/[^A-Z0-9Ñ\s.-]/g, '');
      }
      await this.tenantRepository.update(id, updateTenantDto);
      return this.findOne(id);
    } catch (error) {
      this.logger.error(`Error updating tenant ${id}: ${error.message} \nStack: ${error.stack}`);
      throw new InternalServerErrorException(error.message);
    }
  }

  async updateConfig(id: string, partialConfig: any) {
    const tenant = await this.tenantRepository.findOne({ where: { id } });
    if (!tenant) throw new NotFoundException('Tenant not found');

    // Deep Merge Safe Logic
    // We preserve existing keys like 'industry', 'modules', 'schema' if they exist in config
    const currentConfig = tenant.config || {};

    const newConfig = {
      ...currentConfig,
      branding: {
        ...(currentConfig.branding || {}),
        ...(partialConfig.branding || {})
      },
      contact: {
        ...(currentConfig.contact || {}),
        ...(partialConfig.contact || {})
      }
    };

    tenant.config = newConfig;
    return this.tenantRepository.save(tenant);
  }

  async updateLayout(id: string, layout: any[]) {
    return this.tenantRepository.update(id, { dashboardLayout: layout });
  }

  async remove(id: string) {
    return await this.tenantRepository.delete(id);
  }

  async findOneBySlug(slug: string) {
    return await this.tenantRepository.findOne({ where: { slug } });
  }

  // --- MARKETPLACE METHODS ---

  async getActiveModules(tenantId: string): Promise<string[]> {
    // 1. Relational Source
    const activeSubs = await this.tenantModuleRepository.find({
      where: {
        tenantId: tenantId,
        status: TenantModuleStatus.ACTIVE
      },
      relations: ['module'] // 👈 Join required to get the code string
    });
    const relationalModules = activeSubs.map(s => s.module?.code).filter(Boolean); // Safe map

    // 2. JSON Source (Legacy)
    const tenant = await this.tenantRepository.findOne({ where: { id: tenantId } });
    const legacyModules = (tenant?.config && Array.isArray(tenant.config.active_modules))
      ? tenant.config.active_modules
      : [];

    // 3. Merge
    return Array.from(new Set([...relationalModules, ...legacyModules]));
  }

  async subscribe(tenantId: string, moduleCode: string) {
    // 1. Validar que el módulo exista
    const marketModule = await this.moduleRepository.findOneBy({ code: moduleCode });
    if (!marketModule) {
      throw new NotFoundException(`El módulo '${moduleCode}' no existe en el catálogo.`);
    }

    // 2. Verificar si ya existe la suscripción
    const existing = await this.tenantModuleRepository.findOne({
      where: {
        tenantId: tenantId,
        module: { code: marketModule.code } // Chequeo por ID real
      },
      relations: ['module']
    });

    if (existing) {
      if (existing.status !== TenantModuleStatus.ACTIVE) {
        existing.status = TenantModuleStatus.ACTIVE;
        await this.tenantModuleRepository.save(existing);
      }
      return;
    }

    // 3. Crear nueva suscripción
    const newSub = this.tenantModuleRepository.create({
      tenantId: tenantId,
      module: marketModule,
      status: TenantModuleStatus.ACTIVE,
      expires_at: '2030-01-01'
    });

    await this.tenantModuleRepository.save(newSub);

    // 4. SYNC JSON (CRITICAL for Middleware/Guards)
    const tenant = await this.tenantRepository.findOne({ where: { id: tenantId } });
    if (tenant) {
      const config = tenant.config || {};
      const activeModules = new Set(config.active_modules || []);
      activeModules.add(marketModule.code);
      config.active_modules = Array.from(activeModules);
      tenant.config = config;
      await this.tenantRepository.save(tenant);
    }
  }

  // --- STATS METHOD ---
  async getStats(tenantId: string) {
    // 1. Counts via Raw SQL for performance & decoupling
    const patientsCount = await this.dataSource.query(
      `SELECT COUNT(*) as count FROM patient WHERE "tenantId" = $1 AND status != 'DELETED'`,
      [tenantId]
    ).catch(() => [{ count: 0 }]);

    // Monthly Records
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const recordsCount = await this.dataSource.query(
      `SELECT COUNT(*) as count FROM medical_record mr 
       JOIN patient p ON p.id = mr."patientId" 
       WHERE p."tenantId" = $1 AND mr.date >= $2`,
      [tenantId, startOfMonth]
    ).catch(() => [{ count: 0 }]);

    // 2. Subscription
    const subscription = await this.subscriptionRepository.findOne({
      where: { tenant: { id: tenantId } },
      order: { endDate: 'DESC' }
    });

    const daysLeft = subscription
      ? Math.ceil((new Date(subscription.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
      : 0;

    // 3. Recent Audit
    let recentAudit = [];
    try {
      recentAudit = await this.dataSource.query(
        `SELECT * FROM audit_logs WHERE "tenantId" = $1 ORDER BY "createdAt" DESC LIMIT 5`,
        [tenantId]
      );
    } catch (e) {
      recentAudit = [];
    }

    return {
      patientsCount: parseInt(patientsCount[0]?.count || '0'),
      recordsCount: parseInt(recordsCount[0]?.count || '0'),
      subscription: {
        status: subscription?.status || 'FREE',
        plan: subscription?.planDetails?.name || 'BASIC',
        daysLeft: daysLeft > 0 ? daysLeft : 0
      },
      recentAudit: recentAudit
    };
  }

  // --- MAINTENANCE / SYNC ---

  async syncAllModules() {
    this.logger.log("🔄 Starting Global Module Synchronization (SQL <-> JSON)...");

    // 1. Load Catalog Map
    const allModules = await this.moduleRepository.find();
    const moduleMap = new Map(allModules.map(m => [m.code, m]));
    const coreModule = moduleMap.get(ModuleCode.CORE_STD);

    if (!coreModule) throw new InternalServerErrorException("Critical: 'core-std' module not found in Catalog DB.");

    // 2. Load all Tenants with Relations
    const tenants = await this.tenantRepository.find({
      relations: ['modules', 'modules.module']
    });

    const results: string[] = [];

    for (const tenant of tenants) {
      const logs: string[] = []; // Explicit typing
      let jsonChanged = false;

      // Ensure Config Arrays exist
      if (!tenant.config) tenant.config = {};
      const currentConfig = JSON.parse(JSON.stringify(tenant.config)); // Clone
      if (!currentConfig.active_modules) currentConfig.active_modules = [];
      const jsonModulesSet = new Set<string>(currentConfig.active_modules);

      // Map SQL Modules directly for easy lookup
      // Note: tenant.modules contains TenantModule entities
      const activeSqlModules = tenant.modules?.filter(m => m.status === TenantModuleStatus.ACTIVE) || [];
      const activeSqlCodes = new Set(activeSqlModules.map(tm => tm.module.code));

      // A. GUARANTEE CORE-STD
      if (!activeSqlCodes.has(ModuleCode.CORE_STD)) {
        // Create SQL
        const newTm = this.tenantModuleRepository.create({
          tenant,
          module: coreModule,
          status: TenantModuleStatus.ACTIVE,
          usage_status: 'ACTIVE'
        });
        await this.tenantModuleRepository.save(newTm);
        activeSqlCodes.add(ModuleCode.CORE_STD); // Update Set
        logs.push("Fixed Missing CORE SQL");
      }

      if (!jsonModulesSet.has(ModuleCode.CORE_STD)) {
        jsonModulesSet.add(ModuleCode.CORE_STD);
        jsonChanged = true;
        logs.push("Fixed Missing CORE JSON");
      }

      // B. JSON -> SQL (If in JSON but not SQL, create SQL)
      for (const code of jsonModulesSet) {
        if (!activeSqlCodes.has(code)) {
          const modEntity = moduleMap.get(code);
          if (modEntity) {
            const newTm = this.tenantModuleRepository.create({
              tenant,
              module: modEntity,
              status: TenantModuleStatus.ACTIVE,
              usage_status: 'ACTIVE'
            });
            await this.tenantModuleRepository.save(newTm);
            activeSqlCodes.add(code);
            logs.push(`Restored SQL for ${code}`);
          } else {
            logs.push(`Warning: Module ${code} in JSON but not in Catalog. Unknown module.`);
          }
        }
      }

      // C. SQL -> JSON (If in SQL but not JSON, add to JSON)
      for (const code of activeSqlCodes) {
        if (!jsonModulesSet.has(code)) {
          jsonModulesSet.add(code);
          jsonChanged = true;
          logs.push(`Restored JSON for ${code}`);
        }
      }

      // D. SAVE JSON IF CHANGED
      if (jsonChanged) {
        currentConfig.active_modules = Array.from(jsonModulesSet);
        tenant.config = currentConfig;
        await this.tenantRepository.save(tenant);
      }

      const status = logs.length > 0 ? `FIXED: ${logs.join(', ')}` : 'OK';
      results.push(`${tenant.slug}: ${status}`);
      this.logger.log(`Tenant ${tenant.slug} Sync: ${status}`);
    }

    return {
      total: tenants.length,
      details: results
    };
  }
}