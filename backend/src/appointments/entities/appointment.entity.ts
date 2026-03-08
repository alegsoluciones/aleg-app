import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToOne, JoinColumn, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { Tenant } from '../../tenants/entities/tenant.entity';
import { Patient } from '../../entities/patient.entity';
import { User } from '../../users/entities/user.entity';
import { MedicalRecord } from '../../entities/medical-record.entity';

export enum AppointmentStatus {
    PENDING = 'PENDING',
    CONFIRMED = 'CONFIRMED',
    COMPLETED = 'COMPLETED',
    CANCELLED = 'CANCELLED',
    IN_PROGRESS = 'IN_PROGRESS'
}

export enum AppointmentType {
    CONSULTATION = 'CONSULTATION',
    CONTROL = 'CONTROL',
    SURGERY = 'SURGERY',
    OTHER = 'OTHER'
}

@Entity({ name: 'appointments' })
export class Appointment {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Index()
    @ManyToOne(() => Tenant, { onDelete: 'CASCADE' })
    tenant: Tenant;

    @ManyToOne(() => Patient, { onDelete: 'CASCADE' })
    patient: Patient;

    @ManyToOne(() => User, { nullable: true })
    doctor: User;

    @Column({ type: 'timestamp' })
    start: Date;

    @Column({ type: 'timestamp' })
    end: Date;

    @Column({ nullable: true })
    title: string;

    @Column({ nullable: true })
    reason: string;

    @Column({ type: 'text', nullable: true })
    notes: string;

    @Column('simple-json', { nullable: true })
    notificationStatus: { whatsapp: boolean; email: boolean };

    @Column({
        type: 'enum',
        enum: AppointmentStatus,
        default: AppointmentStatus.PENDING
    })
    status: AppointmentStatus;

    @Column({
        type: 'enum',
        enum: AppointmentType,
        default: AppointmentType.CONSULTATION
    })
    type: AppointmentType;

    @OneToOne(() => MedicalRecord, { nullable: true })
    @JoinColumn()
    medicalRecord: MedicalRecord;

    @Column({ default: false })
    reminderSent: boolean;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
