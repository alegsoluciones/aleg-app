import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { Subscription } from '../../billing/entities/subscription.entity';
import { TenantModule } from './tenant-module.entity';

export enum TenantStatus {
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  DEBT = 'DEBT',
}

@Entity()
export class Tenant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  industry: string; // IndustryType enum but string for flexibility

  @Column({ unique: true })
  slug: string;

  // Configuration Agnostic (Theme, Branding, Industry, Flavor)
  @Column({ type: 'json' })
  config: any; // e.g. { branding: { logoUrl: '...' }, industry: 'CLINICAL' }

  @Column({ type: 'json', nullable: true })
  dashboardLayout: any[]; // Stores the default grid layout for the dashboard

  @Column({
    type: 'enum',
    enum: TenantStatus,
    default: TenantStatus.ACTIVE
  })
  status: TenantStatus;

  @Column({ default: true })
  isActive: boolean;

  @OneToMany(() => Subscription, (sub) => sub.tenant)
  subscriptions: Subscription[];

  @OneToMany(() => TenantModule, (tm) => tm.tenant)
  modules: TenantModule[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}