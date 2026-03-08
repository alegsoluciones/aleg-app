import { Entity, PrimaryColumn, Column } from 'typeorm';

export enum ModuleCategory {
    CORE = 'CORE',
    ADDON = 'ADDON',
    PLUGIN = 'PLUGIN'
}

@Entity('marketplace_modules')
export class MarketplaceModule {
    @PrimaryColumn()
    code: string; // e.g., 'core-std' (Overwrites existing ID-based entity if compatible or I will align)

    @Column()
    name: string;

    @Column({
        type: 'enum',
        enum: ModuleCategory,
        default: ModuleCategory.ADDON
    })
    category: ModuleCategory;

    @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
    price: number;

    @Column({ type: 'text', nullable: true })
    description: string;

    @Column({ type: 'json', nullable: true })
    dependencies: string[];

    @Column({ nullable: true })
    terms_url: string;

    @Column({ default: true })
    isActive: boolean;
}
