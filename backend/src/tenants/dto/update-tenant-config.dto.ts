import { IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

class BrandingDto {
    @ApiPropertyOptional({ example: '#ff0000' })
    @IsOptional()
    @IsString()
    color?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    logoUrl?: string; // We just save the path/url here
}

class ContactDto {
    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    address?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    phone?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    website?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    email?: string;
}

export class UpdateTenantConfigDto {
    @ApiPropertyOptional()
    @IsOptional()
    @ValidateNested()
    @Type(() => BrandingDto)
    branding?: BrandingDto;

    @ApiPropertyOptional()
    @IsOptional()
    @ValidateNested()
    @Type(() => ContactDto)
    contact?: ContactDto;
}
