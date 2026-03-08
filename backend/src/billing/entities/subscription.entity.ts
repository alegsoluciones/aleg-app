import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne } from 'typeorm';
import { Tenant } from '../../tenants/entities/tenant.entity';

export enum SubscriptionStatus {
    TRIAL = 'TRIAL',
    ACTIVE = 'ACTIVE',
    CANCELLED = 'CANCELLED',
    PAST_DUE = 'PAST_DUE',
}

@Entity({ name: 'subscriptions' })
export class Subscription {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({
        type: 'enum',
        enum: SubscriptionStatus,
        default: SubscriptionStatus.TRIAL
    })
    status: SubscriptionStatus;

    @Column({ type: 'datetime', nullable: true })
    startDate: Date;

    @Column({ type: 'datetime', nullable: true })
    endDate: Date;

    @Column({ type: 'json' })
    planDetails: any; // Snapshot of the plan at the time of subscription

    @ManyToOne(() => Tenant, (tenant) => tenant.subscriptions, { onDelete: 'CASCADE' })
    tenant: Tenant;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
