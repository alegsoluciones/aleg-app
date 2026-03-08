import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppointmentsService } from './appointments.service';
import { AppointmentsController } from './appointments.controller';
import { Appointment } from './entities/appointment.entity';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([Appointment]),
        NotificationsModule // 👈 Required for AppointmentsService
    ],
    controllers: [AppointmentsController],
    providers: [AppointmentsService],
    exports: [AppointmentsService]
})
export class AppointmentsModule { }
