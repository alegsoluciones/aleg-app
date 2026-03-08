import { Injectable, NestMiddleware, NotFoundException, ForbiddenException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { TenantsService } from './tenants.service';
import { ClsService } from 'nestjs-cls';

@Injectable()
export class TenancyMiddleware implements NestMiddleware {
  // 🔒 Whitelist de rutas públicas (Zero Trust)
  // Added '/saas' for global admin access (Plans, Industries)
  private readonly WHITELIST = ['/auth', '/health', '/docs', '/media', '/saas'];

  constructor(
    private readonly tenantsService: TenantsService,
    private readonly cls: ClsService
  ) { }

  async use(req: Request, res: Response, next: NextFunction) {
    // 2. Leer Header
    const tenantSlug = req.headers['x-tenant-slug'] || req.query.tenant;

    console.log(`[TenancyMiddleware] Checking access to: ${req.url}. Header slug: ${tenantSlug}`);

    if (this.isWhitelisted(req.baseUrl) || this.isWhitelisted(req.path)) {
      console.log(`[TenancyMiddleware] Whitelisted path. PASS.`);
      return next();
    }

    if (!tenantSlug) {
      console.error(`[TenancyMiddleware] Missing tenant slug. FAIL.`);
      throw new ForbiddenException('Acceso Denegado: Tenant ID requerido (x-tenant-slug)');
    }

    // 3. Buscar ID real en BD
    const tenant = await this.tenantsService.findOneBySlug(tenantSlug.toString());

    if (!tenant) {
      throw new ForbiddenException(`Acceso Denegado: Empresa no encontrada o inactiva`); // Seguridad: No decir "NotFound"
    }

    // 4. Inyectar en Contexto Seguro (CLS)
    this.cls.set('TENANT', {
      id: tenant.id,
      slug: tenant.slug,
      name: tenant.name,
      config: tenant.config,
      status: tenant.status // 👈 Critical for SubscriptionGuard
    });

    // Retro-compatibilidad
    req['tenant'] = {
      id: tenant.id,
      slug: tenant.slug,
      name: tenant.name,
      status: tenant.status // 👈 Critical
    };

    next();
  }

  private isWhitelisted(path: string): boolean {
    return this.WHITELIST.some(prefix => path.startsWith(prefix));
  }
}