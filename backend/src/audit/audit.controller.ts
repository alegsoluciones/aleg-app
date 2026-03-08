import { Controller, Get, Query, UseGuards, Req, UnauthorizedException } from '@nestjs/common';
import { AuditService } from './audit.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('audit')
@UseGuards(JwtAuthGuard)
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  async getLogs(@Query('limit') limit: number, @Req() req) {
    const user = req.user;

    // 1. Si es Super Admin, ve todo el panorama
    if (user.role === 'SUPER_ADMIN') {
        return this.auditService.findAll(limit || 20);
    }

    // 2. Si es Admin de Empresa, SOLO ve su empresa
    if (user.tenantId) {
        return this.auditService.findByTenant(user.tenantId, limit || 20);
    }

    // 3. Si no tiene rol claro o tenant, denegar
    throw new UnauthorizedException('Acceso a logs denegado');
  }
}