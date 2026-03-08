import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product, ProductType } from './entities/product.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { ClsService } from 'nestjs-cls';

@Injectable()
export class InventoryService {
    constructor(
        @InjectRepository(Product)
        private productRepository: Repository<Product>,
        private readonly cls: ClsService,
    ) { }

    async create(createProductDto: CreateProductDto): Promise<Product> {
        const tenantId = this.cls.get('tenantId');
        const product = this.productRepository.create({
            ...createProductDto,
            tenantId,
        });

        // Logic: specific defaults based on type
        if (product.type === ProductType.SERVICE) {
            product.stock = null;
        } else {
            product.stock = product.stock ?? 0;
        }

        return this.productRepository.save(product);
    }

    async findAll(type?: ProductType): Promise<Product[]> {
        const tenantId = this.cls.get('tenantId');
        const where: any = { tenantId, isActive: true };
        if (type) {
            where.type = type;
        }
        return this.productRepository.find({ where, order: { name: 'ASC' } });
    }

    async findOne(id: string): Promise<Product> {
        const tenantId = this.cls.get('tenantId');
        const product = await this.productRepository.findOne({ where: { id, tenantId } });
        if (!product) throw new NotFoundException(`Product ${id} not found`);
        return product;
    }

    async adjustStock(id: string, quantity: number): Promise<Product> {
        const product = await this.findOne(id);
        if (product.type === ProductType.SERVICE) {
            return product; // Services don't track stock
        }

        // quantity can be negative (sale) or positive (restock)
        const newStock = (product.stock || 0) + quantity;
        product.stock = newStock;
        return this.productRepository.save(product);
    }
}
