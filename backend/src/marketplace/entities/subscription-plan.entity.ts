import { Entity, PrimaryColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BusinessProfile } from './business-profile.entity';

@Entity('subscription_plans')
export class SubscriptionPlan {
    @PrimaryColumn()
    code: string; // e.g., 'PLAN_DERMA_PRO'

    @Column()
    name: string;

    @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
    price_monthly: number;

    @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
    price_annual: number;

    @Column()
    profileCode: string;

    @ManyToOne(() => BusinessProfile, (profile) => profile.plans)
    @JoinColumn({ name: 'profileCode' })
    profile: BusinessProfile;
}
