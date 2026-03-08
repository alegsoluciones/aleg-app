import { IsString, IsNotEmpty, IsEnum, IsNumber, IsOptional, IsBoolean, IsInt, Min } from 'class-validator';
import { ProductType } from '../entities/product.entity';

export class CreateProductDto {
    @IsString()
    @IsNotEmpty()
    name: string;

    @IsEnum(ProductType)
    type: ProductType;

    @IsNumber()
    @Min(0)
    price: number;

    @IsNumber()
    @Min(0)
    @IsOptional()
    cost?: number;

    @IsInt()
    @IsOptional()
    stock?: number;

    @IsString()
    @IsOptional()
    sku?: string;

    @IsInt()
    @Min(0)
    @IsOptional()
    minStock?: number;

    @IsBoolean()
    @IsOptional()
    isActive?: boolean;
}
