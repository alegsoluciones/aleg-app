import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { PlansService } from './plans.service';
import { Plan } from './entities/plan.entity';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UserRole } from '../users/entities/user.entity';

@Controller('saas/plans')
export class PlansController {
    constructor(private readonly plansService: PlansService) { }

    @Post()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.SUPER_ADMIN, UserRole.TENANT_ADMIN)
    create(@Body() createPlanDto: Partial<Plan>) {
        return this.plansService.create(createPlanDto);
    }

    @Get()
    findAll() {
        return this.plansService.findAll();
    }

    @Get('admin')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.SUPER_ADMIN, UserRole.TENANT_ADMIN)
    findAllAdmin() {
        return this.plansService.findAllAdmin();
    }

    @Patch(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.SUPER_ADMIN, UserRole.TENANT_ADMIN)
    update(@Param('id') id: string, @Body() updatePlanDto: Partial<Plan>) {
        return this.plansService.update(id, updatePlanDto);
    }

    @Delete(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.SUPER_ADMIN, UserRole.TENANT_ADMIN)
    remove(@Param('id') id: string) {
        return this.plansService.remove(id);
    }
}
