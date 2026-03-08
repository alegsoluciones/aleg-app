import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async create(createUserDto: CreateUserDto) {
    const existing = await this.usersRepository.findOne({ where: { email: createUserDto.email } });
    if (existing) throw new ConflictException('El correo ya está registrado');

    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(createUserDto.password, salt);

    const newUser = this.usersRepository.create({
        ...createUserDto,
        password: hashedPassword,
    });

    return this.usersRepository.save(newUser);
  }

  async findAll() {
    return this.usersRepository.find();
  }

  async findByTenant(tenantId: string) {
      return this.usersRepository.find({
          where: { tenantId: tenantId }
      });
  }

  async findOne(email: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { email } });
  }
  
  // 👇 CAMBIO: Recibe string (UUID)
  async findOneById(id: string) {
      return this.usersRepository.findOne({ where: { id } });
  }

  // 👇 CAMBIO: Recibe string (UUID)
  async remove(id: string) {
      const user = await this.findOneById(id);
      if (!user) throw new NotFoundException('Usuario no encontrado');
      return this.usersRepository.remove(user);
  }
}