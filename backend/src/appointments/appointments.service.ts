import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, MoreThan, Not, Between } from 'typeorm';
import { Appointment, AppointmentStatus } from './entities/appointment.entity';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { User } from '../users/entities/user.entity';
import { NotificationsService } from '../notifications/notifications.service'; // 👈 Import NotificationService

@Injectable()
export class AppointmentsService {
    constructor(
        @InjectRepository(Appointment)
        private appointmentRepo: Repository<Appointment>,
        private notificationsService: NotificationsService, // 👈 Inject
    ) { }

    async create(tenantId: string, data: any, user: User) {
        // 1. Conflict Detection
        // Overlap Logic: (StartA < EndB) and (EndA > StartB)
        const overlap = await this.appointmentRepo.findOne({
            where: {
                tenant: { id: tenantId },
                doctor: { id: user.id }, // Assuming user creating is the doctor, or pass doctorId
                start: LessThan(data.end),
                end: MoreThan(data.start),
                status: Not(AppointmentStatus.CANCELLED)
            }
        });

        if (overlap) {
            throw new ConflictException('El horario seleccionado ya está ocupado por otra cita.');
        }

        // 2. Create
        const appointment = this.appointmentRepo.create({
            ...data,
            tenant: { id: tenantId },
            doctor: { id: user.id } // For now assign to creator
        }) as unknown as Appointment;

        const saved = await this.appointmentRepo.save(appointment);

        // 3. Send Notification (Fire & Forget)
        try {
            // Need to reload relations for email
            const fullAppt = await this.appointmentRepo.findOne({
                where: { id: saved.id },
                relations: ['patient', 'tenant']
            });
            if (fullAppt) this.notificationsService.sendConfirmation(fullAppt);
        } catch (e) {
            console.error('Failed to send confirmation email', e);
        }

        return saved;
    }

    async findAll(tenantId: string, start: Date, end: Date) {
        return await this.appointmentRepo.find({
            where: {
                tenant: { id: tenantId },
                start: Between(start, end),
                status: Not(AppointmentStatus.CANCELLED)
            },
            relations: ['patient', 'doctor']
        });
    }

    async updateStatus(id: string, status: AppointmentStatus) {
        const appointment = await this.appointmentRepo.findOne({ where: { id } });
        if (!appointment) throw new NotFoundException('Cita no encontrada');

        appointment.status = status;
        return this.appointmentRepo.save(appointment);
    }
}
