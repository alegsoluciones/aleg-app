import { IsEmail, IsNotEmpty, IsString, IsOptional, IsEnum } from 'class-validator';

export class CreateUserDto {
  @IsEmail()
  email: string;

  @IsNotEmpty()
  password: string;

  @IsString()
  @IsOptional()
  fullName?: string;

  @IsString()
  @IsOptional()
  role?: any; // Usamos any o el Enum UserRole para flexibilidad rápida

  @IsString()
  @IsOptional()
  tenantId?: string;

  @IsString()
  @IsOptional()
  specialty?: string;
}