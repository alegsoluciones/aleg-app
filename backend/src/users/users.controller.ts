import { Controller, Get, Post, Body, Param, Delete, UseGuards, Req, UnauthorizedException } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
    constructor(private readonly usersService: UsersService) { }

    @Get()
    async findAll(@Req() req) {
        const user = req.user;

        // 1. Si es Super Admin, ve todo
        if (user.role === 'SUPER_ADMIN') {
            return this.usersService.findAll();
        }

        // 2. Si es usuario de empresa, ve solo su empresa
        if (user.tenantId) {
            return this.usersService.findByTenant(user.tenantId);
        }

        return [];
    }

    @Post()
    async create(@Body() createUserDto: CreateUserDto, @Req() req) {
        const user = req.user;


        // --- LÓGICA DE PERMISOS ---

        // 1. Validar si es Super Admin (texto exacto para evitar errores de Enum)
        const isSuperAdmin = user.role === 'SUPER_ADMIN';

        if (isSuperAdmin) {
            // El Super Admin tiene permiso total.
            // El tenantId debe venir dentro del DTO (el script lo envía).
            return this.usersService.create(createUserDto);
        }

        // 2. Si NO es Super Admin, debe tener una empresa asignada
        if (!user.tenantId) {
            throw new UnauthorizedException('No tienes empresa asignada y no eres Super Admin.');
        }

        // 3. Forzamos que el usuario se cree vinculado a la empresa del creador
        createUserDto.tenantId = user.tenantId;

        return this.usersService.create(createUserDto);
    }

    @Delete(':id')
    async remove(@Param('id') id: string, @Req() req) {
        const user = req.user;

        // Solo permite borrar si es Super Admin O si tiene una empresa asignada
        if (user.role !== 'SUPER_ADMIN' && !user.tenantId) {
            throw new UnauthorizedException('No tienes permisos para eliminar usuarios.');
        }

        // 👇 CAMBIO CRÍTICO: Eliminado el '+' para pasar el UUID como string
        return this.usersService.remove(id);
    }
}