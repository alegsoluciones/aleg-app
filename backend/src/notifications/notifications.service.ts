import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, Not } from 'typeorm';
import * as nodemailer from 'nodemailer';
import { Appointment, AppointmentStatus } from '../appointments/entities/appointment.entity';

@Injectable()
export class NotificationsService {
    private readonly logger = new Logger(NotificationsService.name);
    private transporter;

    constructor(
        @InjectRepository(Appointment)
        private appointmentRepo: Repository<Appointment>,
    ) {
        // Dev Mode: JSON Transport to console
        this.transporter = nodemailer.createTransport({
            jsonTransport: true
        });
    }

    async sendConfirmation(appointment: Appointment) {
        const email = appointment.patient?.email;
        if (!email) {
            this.logger.warn(`No email for patient ${appointment.patient?.id}`);
            return;
        }

        const info = await this.transporter.sendMail({
            from: '"ALEG Health" <no-reply@aleg.app>',
            to: email,
            subject: `Confirmación de Cita - ${appointment.tenant?.name}`,
            html: `
                <p>Hola, <strong>${appointment.patient.name}</strong>.</p>
                <p>Tu cita en <strong>${appointment.tenant?.name}</strong> está agendada:</p>
                <ul>
                    <li>Fecha: ${appointment.start}</li>
                    <li>Tipo: ${appointment.type}</li>
                </ul>
                <p>¡Te esperamos!</p>
            `
        });

        this.logger.log(`[Hermes] 📧 Confirmation sent to ${email}: ${JSON.stringify(info.message)}`);
    }

    async sendReminder(appointment: Appointment) {
        const email = appointment.patient?.email;
        if (!email) return;

        const info = await this.transporter.sendMail({
            from: '"ALEG Health" <no-reply@aleg.app>',
            to: email,
            subject: `Recordatorio de Cita Mañana - ${appointment.tenant?.name}`,
            text: `No olvides tu cita mañana a las ${appointment.start}.`
        });

        this.logger.log(`[Hermes] ⏰ Reminder sent to ${email}: ${JSON.stringify(info.message)}`);
    }

    // Cron Job: Every Hour
    @Cron(CronExpression.EVERY_HOUR)
    async handleReminders() {
        this.logger.debug('Checking for appointments to remind...');

        const now = new Date();
        const startWindow = new Date(now.getTime() + 23 * 60 * 60 * 1000); // Now + 23h
        const endWindow = new Date(now.getTime() + 25 * 60 * 60 * 1000);   // Now + 25h

        const appointments = await this.appointmentRepo.find({
            where: {
                start: Between(startWindow, endWindow),
                status: AppointmentStatus.CONFIRMED,
                reminderSent: false
            },
            relations: ['patient', 'tenant']
        });

        for (const appt of appointments) {
            try {
                await this.sendReminder(appt);
                appt.reminderSent = true;
                await this.appointmentRepo.save(appt);
            } catch (e) {
                this.logger.error(`Failed to remind appointment ${appt.id}`, e);
            }
        }
    }
}
