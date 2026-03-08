import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, JoinColumn } from 'typeorm';
import { Patient } from './patient.entity';

@Entity()
export class MedicalRecord {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'date' })
  date: Date;

  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column('simple-json', { nullable: true })
  steps: string[];

  @Column('simple-json', { nullable: true })
  attachments: string[];

  @Column('simple-json', { nullable: true }) // 👈 New Dynamic Data Column
  data: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ type: 'varchar', length: 36, nullable: true })
  patientId: string;

  @ManyToOne(() => Patient, (patient) => patient.records, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'patientId' })
  patient: Patient;
}