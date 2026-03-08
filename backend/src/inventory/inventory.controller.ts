import { Controller, Get, Post, Body, Param, Query, UseGuards, Patch } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { CreateProductDto } from './dto/create-product.dto';
import { ProductType } from './entities/product.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('inventory')
@UseGuards(JwtAuthGuard)
export class InventoryController {
    constructor(private readonly inventoryService: InventoryService) { }

    @Post()
    create(@Body() createProductDto: CreateProductDto) {
        return this.inventoryService.create(createProductDto);
    }

    @Get()
    findAll(@Query('type') type?: ProductType) {
        return this.inventoryService.findAll(type);
    }

    @Patch(':id/stock')
    adjustStock(@Param('id') id: string, @Body('quantity') quantity: number) {
        return this.inventoryService.adjustStock(id, quantity);
    }
}
