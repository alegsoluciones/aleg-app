import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Tenant } from '../../tenants/entities/tenant.entity';

// 👇 ACTUALIZADO: Lista completa de Roles
export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  TENANT_ADMIN = 'TENANT_ADMIN',
  STAFF = 'STAFF',
  DOCTOR = 'DOCTOR',
  PATIENT = 'PATIENT',
}

@Entity({ name: 'users' })
export class User {
  @PrimaryGeneratedColumn('uuid') // 👈 CAMBIO CRÍTICO: De auto-increment a UUID
  id: string; // 👈 CAMBIO CRÍTICO: De number a string

  @Column({ unique: true })
  email: string;

  @Column({ select: false })
  password: string;

  @Column({ nullable: true })
  fullName: string;

  @Column({ nullable: true, default: 'General' })
  specialty: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.STAFF,
  })
  role: UserRole;

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'varchar', nullable: true })
  tenantId: string;

  @ManyToOne(() => Tenant, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenantId' })
  tenant: Tenant;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}