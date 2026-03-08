
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BillingService } from './billing.service';
import { BillingController } from './billing.controller';
import { Invoice } from './entities/invoice.entity';
import { InvoiceItem } from './entities/invoice-item.entity';
import { InventoryModule } from '../inventory/inventory.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([Invoice, InvoiceItem]),
        InventoryModule
    ],
    controllers: [BillingController],
    providers: [BillingService],
    exports: [BillingService]
})
export class BillingModule { }
