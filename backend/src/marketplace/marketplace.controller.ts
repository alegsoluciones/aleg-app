import { Controller, Get, Post, Param, UseGuards, Request, Body, Headers, BadRequestException, NotFoundException } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { MarketplaceService } from './marketplace.service';
import { TenantsService } from '../tenants/tenants.service';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CreateMarketplaceModuleDto } from './dto/create-marketplace-module.dto';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { RolesGuard } from '../auth/guards/roles.guard';

@ApiTags('Marketplace')
@ApiBearerAuth()
@Controller('marketplace')
@UseGuards(JwtAuthGuard)
export class MarketplaceController {
    constructor(
        private readonly marketplaceService: MarketplaceService,
        private readonly tenantsService: TenantsService
    ) { }

    @Get('modules')
    getModules() {
        return this.marketplaceService.getAvailableModules();
    }

    // 🛡️ ADMIN MIRROR ENDPOINT
    @Get('admin/modules')
    getAdminModules() {
        return this.marketplaceService.getAvailableModules();
    }

    @Post('subscribe/:code')
    async subscribe(
        @Request() req: any,
        @Param('code') code: string,
        @Headers('x-tenant-slug') targetSlug?: string
    ) {
        let tenantId = req.user.tenantId;

        // 👑 SUPER ADMIN OVERRIDE
        // Allows managing other tenants via header
        if (req.user.role === 'SUPER_ADMIN' || !tenantId) {
            if (targetSlug) {
                const t = await this.tenantsService.findOneBySlug(targetSlug);
                if (!t) throw new NotFoundException(`Target tenant '${targetSlug}' not found`);
                tenantId = t.id;
            }
        }

        if (!tenantId) {
            throw new BadRequestException('Tenant Context or x-tenant-slug header required for this action.');
        }

        return this.marketplaceService.subscribeToModule(
            tenantId,
            code,
            req.user.email
        );
    }

    @Post('unsubscribe/:code')
    async unsubscribe(
        @Request() req: any,
        @Param('code') code: string,
        @Headers('x-tenant-slug') targetSlug?: string
    ) {
        let tenantId = req.user.tenantId;

        // 👑 SUPER ADMIN OVERRIDE
        if (req.user.role === 'SUPER_ADMIN' || !tenantId) {
            if (targetSlug) {
                const t = await this.tenantsService.findOneBySlug(targetSlug);
                if (!t) throw new NotFoundException(`Target tenant '${targetSlug}' not found`);
                tenantId = t.id;
            }
        }

        if (!tenantId) {
            throw new BadRequestException('Tenant Context or x-tenant-slug header required for this action.');
        }

        return this.marketplaceService.unsubscribeFromModule(
            tenantId,
            code,
            req.user.email
        );
    }

    @Post('modules')
    @Roles(UserRole.SUPER_ADMIN)
    @UseGuards(RolesGuard)
    @ApiOperation({ summary: 'Seed or create a marketplace module (Super Admin only)' })
    async createModule(@Request() req: any, @Body() dto: CreateMarketplaceModuleDto) {
        return this.marketplaceService.create(dto);
    }
}
