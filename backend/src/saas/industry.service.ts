import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IndustryTemplate } from './entities/industry-template.entity';

@Injectable()
export class IndustryService implements OnModuleInit {
    private readonly logger = new Logger(IndustryService.name);

    constructor(
        @InjectRepository(IndustryTemplate)
        private repo: Repository<IndustryTemplate>,
    ) { }

    async onModuleInit() {
        await this.seedDefaults();
    }

    async seedDefaults() {
        const count = await this.repo.count();
        if (count > 0) return;

        this.logger.log('Seeding default Industry Templates...');

        const templates = [
            {
                type: 'CLINICAL',
                name: 'Clinical / Medical Standard',
                defaultModules: ['core-std', 'mod_appointments', 'mod_patients', 'mod_financial'],
                defaultSettings: { theme: 'blue', terminology: 'human' }
            },
            {
                type: 'VET',
                name: 'Veterinary Clinic',
                defaultModules: ['core-std', 'mod_appointments', 'mod_vet', 'mod_search_patients'],
                defaultSettings: { theme: 'orange', terminology: 'pet' }
            },
            {
                type: 'CRAFT',
                name: 'Creative Workshop (Craft)',
                defaultModules: ['core-std', 'mod_logistics', 'mod_marketing'],
                defaultSettings: { theme: 'purple', terminology: 'student' }
            },
            {
                type: 'EVENTS',
                name: 'Events & Ticketing',
                defaultModules: ['core-std', 'mod_marketing', 'mod_financial'],
                defaultSettings: { theme: 'dark', terminology: 'guest' }
            }
        ];

        for (const t of templates) {
            await this.repo.save(this.repo.create(t));
        }
        this.logger.log('Industry Templates seeded successfully.');
    }

    findAll() {
        return this.repo.find();
    }

    findByType(type: string) {
        return this.repo.findOneBy({ type });
    }

    async update(type: string, data: Partial<IndustryTemplate>) {
        await this.repo.update({ type }, data);
        return this.findByType(type);
    }
}
