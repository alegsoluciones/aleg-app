import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, Index } from 'typeorm';

@Entity({ name: 'audit_logs' })
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ nullable: true })
  tenantId: string;

  @Column({ nullable: true })
  userId: string;

  @Column({ nullable: true })
  userEmail: string;

  @Column()
  action: string; // e.g. "CREATE PATIENT" or "POST /patients"

  @Column({ nullable: true })
  method: string; // POST, PUT, DELETE

  @Column({ nullable: true })
  path: string; // /api/patients

  @Column({ nullable: true })
  resource: string; // patients

  @Column({ type: 'json', nullable: true })
  metadata: any; // The diff or body

  @Column({ nullable: true })
  ip: string;

  @Column({ nullable: true })
  userAgent: string;

  @Column({ type: 'enum', enum: ['INFO', 'WARNING', 'CRITICAL'], default: 'INFO' })
  level: string;

  @CreateDateColumn()
  createdAt: Date;
}