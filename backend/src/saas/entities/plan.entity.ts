import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('saas_plans')
export class Plan {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    name: string;

    @Column({ unique: true })
    slug: string;

    @Column({ nullable: true })
    rubric: string; // 'CLINICAL', 'VET', 'EVENTS', 'CRAFT'

    @Column('decimal', { precision: 10, scale: 2 })
    price: number;

    @Column({ default: 'USD' })
    currency: string;

    @Column({ type: 'enum', enum: ['MONTHLY', 'YEARLY'], default: 'MONTHLY' })
    billingCycle: string;

    @Column('json', { nullable: true })
    features: string[];

    @Column({ default: true })
    isActive: boolean;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
