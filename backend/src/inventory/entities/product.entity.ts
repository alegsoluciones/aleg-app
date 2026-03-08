import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { Tenant } from '../../tenants/entities/tenant.entity';

export enum ProductType {
    SERVICE = 'SERVICE',
    PRODUCT = 'PRODUCT'
}

@Entity()
@Index(['tenantId', 'sku'], { unique: true }) // SKU unique per tenant
export class Product {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'varchar', length: 36 })
    tenantId: string;

    @ManyToOne(() => Tenant)
    @JoinColumn({ name: 'tenantId' })
    tenant: Tenant;

    @Column()
    name: string;

    @Column({
        type: 'enum',
        enum: ProductType,
        default: ProductType.PRODUCT
    })
    type: ProductType;

    @Column('decimal', { precision: 10, scale: 2, default: 0 })
    price: number;

    @Column('decimal', { precision: 10, scale: 2, default: 0, select: false }) // Visible only for admin/inventory managers
    cost: number;

    @Column('int', { nullable: true })
    stock: number | null;

    @Column({ nullable: true })
    sku: string;

    @Column('int', { default: 0 })
    minStock: number;

    @Column({ default: true })
    isActive: boolean;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
