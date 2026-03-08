// backend/src/tenants/entities/tenant-module.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Tenant } from './tenant.entity';
import { MarketplaceModule } from '../../marketplace/entities/marketplace-module.entity';

export enum TenantModuleStatus {
  ACTIVE = 'ACTIVE',
  CANCELLED = 'CANCELLED',
  PAST_DUE = 'PAST_DUE'
}

@Entity({ name: 'tenant_modules' })
export class TenantModule {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  tenantId: string; // Fixed: UUID

  // @Column() <-- REMOVED: Managed by Relation
  // moduleCode: string;

  @Column({
    type: 'enum',
    enum: TenantModuleStatus,
    default: TenantModuleStatus.ACTIVE
  })
  status: TenantModuleStatus;

  // 🛡️ SECURITY: ONE-SHOT & EXPIRATION ARCHITECTURE
  @Column({
    type: 'enum',
    enum: ['ACTIVE', 'CONSUMED', 'EXPIRED'],
    default: 'ACTIVE'
  })
  usage_status: 'ACTIVE' | 'CONSUMED' | 'EXPIRED';

  @Column({ type: 'timestamp', nullable: true })
  valid_until: Date;

  @Column({ type: 'date', nullable: true })
  expires_at: string;

  // Legacy/Compatibility
  @Column({ type: 'date', nullable: true })
  trialEndsAt: string;

  @ManyToOne(() => Tenant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenantId' })
  tenant: Tenant;

  @ManyToOne(() => MarketplaceModule)
  @JoinColumn({ name: 'moduleCode' }) // FK to ID by default
  module: MarketplaceModule;
}