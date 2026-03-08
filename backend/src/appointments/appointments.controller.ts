import { Controller, Get, Post, Body, Patch, Param, Query, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { FeatureGuard } from '../auth/guards/feature.guard';
import { AppointmentsService } from './appointments.service';
import { AppointmentStatus } from './entities/appointment.entity';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { CreateAppointmentDto } from './dto/create-appointment.dto';

@ApiTags('Appointments')
@ApiBearerAuth()
@Controller('appointments')
@UseGuards(JwtAuthGuard, FeatureGuard('mod_appointments'))
export class AppointmentsController {
    constructor(private readonly appointmentsService: AppointmentsService) { }

    @Post()
    @ApiOperation({ summary: 'Agendar cita' })
    @ApiBody({ type: CreateAppointmentDto })
    create(@Request() req: any, @Body() body: CreateAppointmentDto) {
        return this.appointmentsService.create(req.user.tenantId, body, req.user);
    }

    @Get()
    findAll(@Request() req: any, @Query('start') start: string, @Query('end') end: string) {
        return this.appointmentsService.findAll(
            req.user.tenantId,
            new Date(start),
            new Date(end)
        );
    }

    @Patch(':id/status')
    updateStatus(@Param('id') id: string, @Body('status') status: AppointmentStatus) {
        return this.appointmentsService.updateStatus(id, status);
    }
}
