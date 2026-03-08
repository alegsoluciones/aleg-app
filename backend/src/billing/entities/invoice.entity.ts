
import { Entity, PrimaryGeneratedColumn, Column, OneToMany, CreateDateColumn, Index } from 'typeorm';
import { InvoiceItem } from './invoice-item.entity';

export enum PaymentMethod {
    CASH = 'CASH',
    YAPE = 'YAPE',
    POS = 'POS'
}

export enum InvoiceStatus {
    PAID = 'PAID',
    PENDING = 'PENDING',
    CANCELLED = 'CANCELLED'
}

@Entity()
@Index(['tenantId', 'date'])
export class Invoice {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'varchar', length: 36 })
    tenantId: string;

    @Column({ type: 'varchar', nullable: true })
    patientId: string;

    @Column({ type: 'varchar', nullable: true })
    patientName: string;

    @Column({ type: 'date' })
    date: string;

    @Column({ type: 'enum', enum: ['BOLETA', 'FACTURA'], default: 'BOLETA' })
    documentType: string;

    @Column({ type: 'decimal', precision: 10, scale: 2 })
    totalAmount: number;

    @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
    discount: number;

    @Column({ type: 'decimal', precision: 10, scale: 2 })
    finalAmount: number;

    @Column({ type: 'enum', enum: InvoiceStatus, default: InvoiceStatus.PAID })
    status: InvoiceStatus;

    @Column({ type: 'enum', enum: PaymentMethod, default: PaymentMethod.CASH })
    paymentMethod: PaymentMethod;

    @OneToMany(() => InvoiceItem, item => item.invoice, { cascade: true })
    items: InvoiceItem[];

    @CreateDateColumn()
    createdAt: Date;
}
