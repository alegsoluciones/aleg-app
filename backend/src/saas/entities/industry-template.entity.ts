import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('saas_industry_templates')
export class IndustryTemplate {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ unique: true })
    type: string; // 'CLINICAL' | 'VET' | 'CRAFT' | 'EVENTS'

    @Column()
    name: string;

    @Column('json')
    defaultModules: string[]; // List of module codes enabled by default

    @Column('json')
    defaultSettings: Record<string, any>; // { theme: 'blue', terminology: '...' }

    @Column('json', { nullable: true })
    defaultLayout: any[]; // [{ i: 'stats', x: 0, y: 0, w: 2, h: 1 }]

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
