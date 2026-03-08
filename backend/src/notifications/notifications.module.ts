import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationsService } from './notifications.service';
import { Appointment } from '../appointments/entities/appointment.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([Appointment])
    ],
    providers: [NotificationsService],
    exports: [NotificationsService]
})
export class NotificationsModule { }
