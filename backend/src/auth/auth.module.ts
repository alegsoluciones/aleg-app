import { Module, OnModuleInit } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
// 👇 CORRECCIÓN: Ruta apuntando a la carpeta 'entities'
import { User } from '../users/entities/user.entity';
import { JwtStrategy } from './jwt.strategy';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]), // Acceso a tabla users
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET') || 'CLAVE_SECRETA_SUPER_SEGURA_DEV',
        signOptions: { expiresIn: '8h' }, // Token dura 8 horas
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService],
})
// export class AuthModule implements OnModuleInit {
//   constructor(private authService: AuthService) {}

//   // Al arrancar el módulo, verificamos si existe el Admin
//   // async onModuleInit() {
//   //   await this.authService.seedSuperAdmin();
//   // }
// }
export class AuthModule { }