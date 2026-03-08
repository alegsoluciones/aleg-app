import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { Tenant } from '../../tenants/entities/tenant.entity';
import { MarketplaceModule } from './marketplace-module.entity';

@Entity('tenant_addons')
export class TenantAddon {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'varchar', length: 36 })
    tenantId: string;

    @ManyToOne(() => Tenant)
    @JoinColumn({ name: 'tenantId' })
    tenant: Tenant;

    @Column({ type: 'varchar', length: 255 })
    moduleCode: string;

    @ManyToOne(() => MarketplaceModule)
    @JoinColumn({ name: 'moduleCode' })
    module: MarketplaceModule;

    @Column({ type: 'decimal', precision: 10, scale: 2 })
    price_snapshot: number;

    @Column({ type: 'timestamp' })
    accepted_at: Date;

    @Column({ type: 'varchar', length: 36, nullable: true })
    accepted_by: string; // User ID

    @Column({ type: 'text', nullable: true })
    contract_signature: string; // Hash/Token

    @Column({ type: 'timestamp', nullable: true })
    expires_at: Date;

    @CreateDateColumn()
    createdAt: Date;
}
