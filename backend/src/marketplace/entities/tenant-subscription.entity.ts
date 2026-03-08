import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Tenant } from '../../tenants/entities/tenant.entity';
import { SubscriptionPlan } from './subscription-plan.entity';

export enum SubscriptionStatus {
    ACTIVE = 'ACTIVE',
    PAST_DUE = 'PAST_DUE',
    CANCELLED = 'CANCELLED',
    TRIAL = 'TRIAL'
}

@Entity('tenant_subscriptions')
export class TenantSubscription {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'varchar', length: 36 })
    tenantId: string;

    @ManyToOne(() => Tenant)
    @JoinColumn({ name: 'tenantId' })
    tenant: Tenant;

    @Column({ type: 'varchar', length: 255 })
    planCode: string;

    @ManyToOne(() => SubscriptionPlan)
    @JoinColumn({ name: 'planCode' })
    plan: SubscriptionPlan;

    @Column({
        type: 'enum',
        enum: SubscriptionStatus,
        default: SubscriptionStatus.ACTIVE
    })
    status: SubscriptionStatus;

    @Column({ type: 'timestamp', nullable: true })
    renews_at: Date;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
