import { IsString, IsOptional, IsDateString, IsEnum } from 'class-validator';
import { PatientStatus } from '../../entities/patient.entity';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePatientDto {
  @ApiProperty({ example: 'Firulais' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: '12345678' })
  @IsOptional()
  @IsString()
  dni?: string;

  @ApiPropertyOptional({ example: 'Mascota' })
  @IsOptional()
  @IsString()
  occupation?: string;

  @ApiPropertyOptional({ example: 'Calle 123' })
  @IsOptional()
  @ApiPropertyOptional({ example: 'Calle 123' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ example: '999999999' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ example: 'PACÍFICO' })
  @IsOptional()
  @IsString()
  insurance?: string;

  @ApiPropertyOptional({ example: '10999999999' })
  @IsOptional()
  @IsString()
  ruc?: string;

  @ApiPropertyOptional({ example: '2020-01-01' })
  @IsOptional()
  @IsDateString()
  birthDate?: Date;

  // Los campos JSON pueden venir como cualquier objeto
  @IsOptional()
  antecedentes?: any;

  @IsOptional()
  evaluation?: any;

  @IsOptional()
  other_info?: any;

  @ApiPropertyOptional({ enum: PatientStatus })
  @IsOptional()
  @IsEnum(PatientStatus)
  status?: PatientStatus;

  @ApiPropertyOptional({
    example: { raza: 'Persa', peso: '5kg' },
    type: 'object',
    additionalProperties: true
  })
  @IsOptional()
  data?: any; // 👈 Dynamic Data Payload
}