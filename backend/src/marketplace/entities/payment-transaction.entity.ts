import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

export enum PaymentStatus {
    PENDING = 'PENDING',
    COMPLETED = 'COMPLETED',
    FAILED = 'FAILED',
    REFUNDED = 'REFUNDED'
}

@Entity('payment_transactions')
export class PaymentTransaction {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'varchar', length: 36 })
    tenantId: string;

    @Column({ type: 'decimal', precision: 10, scale: 2 })
    amount: number;

    @Column()
    method: string; // 'CARD', 'TRANSFER', 'STRIPE', etc.

    @Column({ nullable: true })
    reference_id: string; // External ID

    @Column({
        type: 'enum',
        enum: PaymentStatus,
        default: PaymentStatus.PENDING
    })
    status: PaymentStatus;

    @CreateDateColumn()
    createdAt: Date;
}
