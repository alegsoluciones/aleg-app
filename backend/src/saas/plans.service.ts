import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Plan } from './entities/plan.entity';

@Injectable()
export class PlansService {
    constructor(
        @InjectRepository(Plan)
        private plansRepository: Repository<Plan>,
    ) { }

    create(createPlanDto: Partial<Plan>) {
        const plan = this.plansRepository.create(createPlanDto);
        return this.plansRepository.save(plan);
    }

    findAll() {
        return this.plansRepository.find({ where: { isActive: true } });
    }

    findAllAdmin() {
        return this.plansRepository.find();
    }

    findOne(id: string) {
        return this.plansRepository.findOneBy({ id });
    }

    async update(id: string, updatePlanDto: Partial<Plan>) {
        await this.plansRepository.update(id, updatePlanDto);
        return this.findOne(id);
    }

    async remove(id: string) {
        const plan = await this.findOne(id);
        if (plan) {
            plan.isActive = false; // Soft delete by deactivating
            return this.plansRepository.save(plan);
        }
    }
}
