
import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { BillingService } from './billing.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('billing')
@UseGuards(JwtAuthGuard)
export class BillingController {
    constructor(private readonly billingService: BillingService) { }

    @Post()
    create(@Body() createInvoiceDto: CreateInvoiceDto) {
        return this.billingService.create(createInvoiceDto);
    }

    @Get()
    findAll() {
        return this.billingService.findAll();
    }
}
