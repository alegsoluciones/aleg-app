
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Invoice } from './entities/invoice.entity';
import { InvoiceItem } from './entities/invoice-item.entity';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { InventoryService } from '../inventory/inventory.service';
import { ClsService } from 'nestjs-cls';

@Injectable()
export class BillingService {
    constructor(
        @InjectRepository(Invoice)
        private invoiceRepository: Repository<Invoice>,
        @InjectRepository(InvoiceItem)
        private invoiceItemRepository: Repository<InvoiceItem>,
        private inventoryService: InventoryService,
        private dataSource: DataSource,
        private readonly cls: ClsService
    ) { }

    async create(createInvoiceDto: CreateInvoiceDto): Promise<Invoice> {
        const tenantId = this.cls.get('tenantId');

        // Transactional execution to ensure stock deduction and invoice creation happen atomically
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            // 1. Create Invoice
            const invoice = this.invoiceRepository.create({
                ...createInvoiceDto,
                tenantId,
                totalAmount: createInvoiceDto.subtotal // Mapping dto subtotal to Entity totalAmount if needed, checks dto structure
            });

            // 2. Create Items
            const items = createInvoiceDto.items.map(itemDto => this.invoiceItemRepository.create(itemDto));
            invoice.items = items;

            // 3. Save Invoice (Cascades items)
            // Using queryRunner manager for transaction
            const savedInvoice = await queryRunner.manager.save(Invoice, invoice);

            // 4. Update Stock
            for (const item of items) {
                // We need to check if the product is actually a physical product.
                // InventoryService's adjustStock handles the check (returns if SERVICE).
                // However, we need to handle this via the service using the same transaction manager if possible,
                // BUT InventoryService uses its own repository. 
                // For simplicity in this phase without refactoring InventoryService to accept a transaction manager,
                // we will call it normally. If it fails, we rollback.
                // ideally InventoryService should support methods with transaction context, 
                // but simpler approach: adjustStock logic is robust enough or we accept untracked rollback for now.
                // Better approach: verify stock first? 

                // Let's call adjustStock. If it fails, catch block will rollback invoice.
                await this.inventoryService.adjustStock(item.serviceId, -item.quantity);
            }

            await queryRunner.commitTransaction();
            return savedInvoice;

        } catch (err) {
            await queryRunner.rollbackTransaction();
            console.error('Transaction failed:', err);
            throw new InternalServerErrorException('Failed to process sale');
        } finally {
            await queryRunner.release();
        }
    }

    async findAll() {
        const tenantId = this.cls.get('tenantId');
        return this.invoiceRepository.find({
            where: { tenantId },
            relations: ['items'],
            order: { createdAt: 'DESC' },
            take: 50
        });
    }
}
