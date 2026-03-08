
import { IsString, IsNumber, IsArray, ValidateNested, IsOptional, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { PaymentMethod } from '../entities/invoice.entity';

class CreateInvoiceItemDto {
    @IsString()
    serviceId: string;

    @IsString()
    name: string;

    @IsNumber()
    quantity: number;

    @IsNumber()
    price: number;
}

export class CreateInvoiceDto {
    @IsString()
    @IsOptional()
    patientId: string;

    @IsString()
    @IsOptional()
    patientName: string;

    @IsString()
    documentType: 'BOLETA' | 'FACTURA';

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CreateInvoiceItemDto)
    items: CreateInvoiceItemDto[];

    @IsNumber()
    subtotal: number;

    @IsNumber()
    discount: number;

    @IsNumber()
    finalAmount: number;

    @IsEnum(PaymentMethod)
    paymentMethod: PaymentMethod;

    @IsString()
    date: string;
}
