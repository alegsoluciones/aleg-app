import { Controller, Get, Res, UseGuards, NotFoundException } from '@nestjs/common';
import type { Response } from 'express';
import { BackupService } from './backup.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { User } from '../users/user.decorator';
import { ClsService } from 'nestjs-cls';

@Controller('backup')
@UseGuards(JwtAuthGuard, RolesGuard)
export class BackupController {
    constructor(
        private readonly backupService: BackupService,
        private readonly cls: ClsService
    ) {

    }

    @Get('download/full')
    @Roles(UserRole.SUPER_ADMIN, UserRole.TENANT_ADMIN)
    async downloadFullBackup(@Res() res: Response, @User() user: any) {
        // Resolve Tenant
        const tenant = this.cls.get('TENANT');
        const tenantSlug = tenant?.slug || user.tenantSlug; // Fallback if CLS missing (shouldn't happen with middleware)

        if (!tenantSlug) {
            throw new NotFoundException('Tenant context not found.');
        }

        const date = new Date().toISOString().split('T')[0];
        const filename = `RESPALDO_${tenantSlug.toUpperCase().replace(/-/g, '_')}_${date}.zip`;

        // Set Headers
        res.set({
            'Content-Type': 'application/zip',
            'Content-Disposition': `attachment; filename="${filename}"`,
        });

        // Stream
        return this.backupService.streamClientExitPackage(tenantSlug, res);
    }
}
