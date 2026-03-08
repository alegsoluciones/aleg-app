import { IsString, IsNumber, IsOptional, IsArray, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateMarketplaceModuleDto {
    @ApiProperty()
    @IsString()
    code: string;

    @ApiProperty()
    @IsString()
    name: string;

    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    description?: string;

    @ApiProperty()
    @IsNumber()
    price: number;

    @ApiProperty({ required: false })
    @IsArray()
    @IsOptional()
    dependencies?: string[];

    @ApiProperty({ required: false })
    @IsBoolean()
    @IsOptional()
    isActive?: boolean;
}
