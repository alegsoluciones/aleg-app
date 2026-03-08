import { Controller, Get, Post, Body, Patch, Param, Delete, NotFoundException, UseGuards } from '@nestjs/common';
import { TenantsService } from './tenants.service';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { UpdateTenantConfigDto } from './dto/update-tenant-config.dto';
import { ClsService } from 'nestjs-cls';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Public } from '../auth/public.decorator';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

@ApiTags('Tenants')
@ApiBearerAuth()
@Controller('tenants')
export class TenantsController {
  constructor(
    private readonly tenantsService: TenantsService,
    private readonly cls: ClsService
  ) { }

  @Public() // 👈 Allow access without token
  @Get('config')
  async myConfig() {
    // Retorna la config del Tenant Actual ("El Camaleón")
    const tenantContext = this.cls.get('TENANT');
    if (!tenantContext) {
      throw new NotFoundException('No se identificó el Tenant en el contexto del request.');
    }

    // Recuperamos la entidad completa para tener el JSON fresco
    const tenant = await this.tenantsService.findOne(tenantContext.id);

    if (!tenant) {
      throw new NotFoundException('Tenant no encontrado en BD.');
    }

    // 3. Obtener módulos activos REALES (Relacional + Seed Fallback)
    let activeModules: string[] = [];
    try {
      const relationalModules = await this.tenantsService.getActiveModules(tenant.id);
      // Force Safe Access
      const rawConfig = tenant.config as any;
      const configModules = (rawConfig && Array.isArray(rawConfig.active_modules))
        ? rawConfig.active_modules
        : [];

      // MERGE: Evitar duplicados y respetar SEED data
      activeModules = Array.from(new Set([...configModules, ...relationalModules]));
    } catch (e) {
      console.error("⚠️ Critical Error merging modules:", e);
      // Fallback to empty if everything explodes
      activeModules = [];
    }

    return {
      id: tenant.id,
      name: tenant.name,
      slug: tenant.slug,
      industry: tenant.industry, // 👈 Explicit source of truth
      ...(tenant.config || {}), // Fallback properties
      active_modules: activeModules
    };
  }

  @Patch('me/config')
  async updateMyConfig(@Body() updateConfigDto: UpdateTenantConfigDto) {
    const tenantContext = this.cls.get('TENANT');
    if (!tenantContext) throw new NotFoundException('Context missing');
    return this.tenantsService.updateConfig(tenantContext.id, updateConfigDto);
  }

  @Patch('me/layout')
  @Roles(UserRole.TENANT_ADMIN, UserRole.SUPER_ADMIN)
  async updateMyLayout(@Body() body: { dashboardLayout: any[] }) {
    const tenantContext = this.cls.get('TENANT');
    if (!tenantContext) throw new NotFoundException('Context missing');
    return this.tenantsService.updateLayout(tenantContext.id, body.dashboardLayout);
  }

  @Get('me/stats')
  @Roles(UserRole.TENANT_ADMIN, UserRole.DOCTOR, UserRole.STAFF)
  async getStats() {
    const tenantContext = this.cls.get('TENANT');
    if (!tenantContext) throw new NotFoundException('Context missing');
    return this.tenantsService.getStats(tenantContext.id);
  }

  // --- MAINTENANCE ---
  @Post('admin/sync-all')
  @Roles(UserRole.SUPER_ADMIN)
  async syncAllModules() {
    return this.tenantsService.syncAllModules();
  }

  @Get('admin/all')
  @Roles(UserRole.SUPER_ADMIN)
  async findAllForAdmin() {
    return this.tenantsService.findAllForAdmin();
  }

  // --- MARKETPLACE ---
  @Post('subscribe')
  async subscribe(@Body('moduleCode') moduleCode: string) {
    const tenantContext = this.cls.get('TENANT');
    if (!tenantContext) throw new NotFoundException('Tenant Context Required');

    await this.tenantsService.subscribe(tenantContext.id, moduleCode);
    return { success: true, message: `Module ${moduleCode} activated.` };
  }

  @Post()
  create(@Body() createTenantDto: CreateTenantDto) {
    return this.tenantsService.create(createTenantDto);
  }

  @Get()
  findAll() {
    return this.tenantsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.tenantsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateTenantDto: UpdateTenantDto) {
    return this.tenantsService.update(id, updateTenantDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.tenantsService.remove(id);
  }
}