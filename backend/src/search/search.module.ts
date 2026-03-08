import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SearchService } from './search.service';
import { SearchController } from './search.controller';
import { Patient } from '../entities/patient.entity';
import { Appointment } from '../appointments/entities/appointment.entity';

@Module({
    imports: [TypeOrmModule.forFeature([Patient, Appointment])],
    controllers: [SearchController],
    providers: [SearchService],
})
export class SearchModule { }
