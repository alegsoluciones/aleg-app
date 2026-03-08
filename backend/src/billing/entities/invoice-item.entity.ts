
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Invoice } from './invoice.entity';

@Entity()
export class InvoiceItem {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    serviceId: string; // Product/Service ID

    @Column()
    name: string;

    @Column({ type: 'int' })
    quantity: number;

    @Column({ type: 'decimal', precision: 10, scale: 2 })
    price: number;

    @ManyToOne(() => Invoice, invoice => invoice.items)
    invoice: Invoice;
}
