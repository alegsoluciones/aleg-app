import { Controller, Get, Put, Body, Param, UseGuards } from '@nestjs/common';
import { IndustryService } from './industry.service';
import { IndustryTemplate } from './entities/industry-template.entity';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UserRole } from '../users/entities/user.entity';

@Controller('saas/industries')
export class IndustryController {
    constructor(private readonly industryService: IndustryService) { }

    @Get()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.SUPER_ADMIN, UserRole.TENANT_ADMIN)
    findAll() {
        return this.industryService.findAll();
    }

    @Get(':type')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.SUPER_ADMIN, UserRole.TENANT_ADMIN)
    findByType(@Param('type') type: string) {
        return this.industryService.findByType(type);
    }

    @Put(':type')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.SUPER_ADMIN, UserRole.TENANT_ADMIN)
    update(@Param('type') type: string, @Body() data: Partial<IndustryTemplate>) {
        return this.industryService.update(type, data);
    }
}
