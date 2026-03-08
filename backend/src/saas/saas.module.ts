import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PlansService } from './plans.service';
import { PlansController } from './plans.controller';
import { Plan } from './entities/plan.entity';

import { IndustryTemplate } from './entities/industry-template.entity';
import { IndustryService } from './industry.service';
import { IndustryController } from './industry.controller';

@Module({
    imports: [TypeOrmModule.forFeature([Plan, IndustryTemplate])],
    controllers: [PlansController, IndustryController],
    providers: [PlansService, IndustryService],
    exports: [PlansService, IndustryService],
})
export class SaasModule { }
