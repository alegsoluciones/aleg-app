import { Entity, PrimaryGeneratedColumn, Column, OneToMany, CreateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { MedicalRecord } from './medical-record.entity';
// 👇 CORRECCIÓN: Ruta relativa ajustada a la estructura real
import { Tenant } from '../tenants/entities/tenant.entity';

export enum PatientStatus {
  DRAFT = 'DRAFT',
  READY = 'READY',
  ACTIVE = 'ACTIVE',
}

@Entity()
@Index(['tenantId', 'internalId'], { unique: true }) // 👈 Unicidad Compuesta: ID dentro del Tenant
export class Patient {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 36, nullable: true })
  tenantId: string;

  @ManyToOne(() => Tenant)
  @JoinColumn({ name: 'tenantId' })
  tenant: Tenant;

  @Column() // 👈 Quitamos unique: true global
  internalId: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  dni: string;

  @Column({ nullable: true })
  email: string;

  @Column({ nullable: true })
  occupation: string;

  @Column({ nullable: true })
  address: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true })
  insurance: string;

  @Column({ nullable: true })
  ruc: string;

  @Column({ type: 'date', nullable: true })
  birthDate: Date | null;

  @Column({
    type: 'enum',
    enum: PatientStatus,
    default: PatientStatus.DRAFT,
  })
  status: PatientStatus;

  @Column({ type: 'date', nullable: true })
  firstConsultationDate: Date | null;

  @Column({ type: 'text', nullable: true })
  diagnostico: string;

  @Column({ type: 'text', nullable: true })
  tratamiento: string;

  @Column('simple-json', { nullable: true })
  antecedentes: Record<string, any>;

  @Column('simple-json', { nullable: true })
  evaluation: Record<string, any>;

  @Column('simple-json', { nullable: true }) // 👈 New Dynamic Data Column
  data: Record<string, any>;

  @Column('simple-json', { nullable: true })
  other_info: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @OneToMany(() => MedicalRecord, (record) => record.patient, { cascade: true })
  records: MedicalRecord[];
}