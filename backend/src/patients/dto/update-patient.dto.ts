import { PartialType } from '@nestjs/mapped-types';
import { CreatePatientDto } from './create-patient.dto';
import { IsOptional, IsString, IsDateString, IsEnum } from 'class-validator';
import { PatientStatus } from '../../entities/patient.entity';

export class UpdatePatientDto extends PartialType(CreatePatientDto) {
    @IsOptional()
    @IsString()
    name?: string;

    @IsOptional()
    @IsString()
    occupation?: string;

    @IsOptional()
    @IsString()
    address?: string;

    @IsOptional()
    @IsString()
    phone?: string;

    @IsOptional()
    @IsString()
    insurance?: string;

    @IsOptional()
    @IsString()
    ruc?: string;

    @IsOptional()
    @IsDateString()
    birthDate?: Date;

    @IsOptional()
    antecedentes?: any;

    @IsOptional()
    evaluation?: any;

    @IsOptional()
    other_info?: any;

    @IsOptional()
    @IsEnum(PatientStatus)
    status?: PatientStatus;

    @IsOptional()
    data?: any;
}