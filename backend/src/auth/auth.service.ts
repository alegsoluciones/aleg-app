import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
// 👇 CORRECCIÓN: Ruta apuntando a la carpeta 'entities'
import { User, UserRole } from '../users/entities/user.entity';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private jwtService: JwtService,
  ) { }

  // 1. LOGIN
  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    // Buscar usuario (incluyendo password para comparar)
    const user = await this.userRepository.findOne({
      where: { email },
      select: ['id', 'email', 'password', 'role', 'fullName', 'tenantId', 'isActive'], // Importante: traer isActive
      relations: ['tenant']
    });

    console.log(`[AuthService] Login Attempt: ${email}`);
    if (!user) {
      console.error('[AuthService] User not found');
      throw new UnauthorizedException('Credenciales inválidas');
    }

    // Verificar Password
    const isMatch = await bcrypt.compare(password, user.password);
    console.log(`[AuthService] Password Match: ${isMatch} (Provided len: ${password.length}, Hash len: ${user.password.length})`);

    if (!isMatch) {
      console.error('[AuthService] Password validation failed');
      throw new UnauthorizedException('Credenciales inválidas');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Usuario desactivado. Contacte al administrador.');
    }

    // Generar Token
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId
    };

    const token = this.jwtService.sign(payload);

    return {
      access_token: token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        tenant: user.tenant
      }
    };
  }

  // 2. REGISTRO
  async register(data: Partial<User>) {
    if (!data.password || !data.email) {
      throw new Error('Email y Password son obligatorios.');
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(data.password, salt);

    const newUser = this.userRepository.create({
      email: data.email,
      password: hashedPassword,
      fullName: data.fullName,
      role: data.role,
      isActive: data.isActive ?? true,
      tenantId: data.tenantId,
    });

    return await this.userRepository.save(newUser);
  }

  // 3. SEED LOGIC MOVED TO SEED SERVICE
}