import { Entity, PrimaryColumn, Column, OneToMany } from 'typeorm';
import { SubscriptionPlan } from './subscription-plan.entity';

@Entity('business_profiles')
export class BusinessProfile {
    @PrimaryColumn()
    code: string; // e.g., 'CLINIC', 'VET', 'CRAFT', 'EVENTS'

    @Column()
    name: string;

    @Column({ type: 'text', nullable: true })
    description: string;

    @OneToMany(() => SubscriptionPlan, (plan) => plan.profile)
    plans: SubscriptionPlan[];
}
