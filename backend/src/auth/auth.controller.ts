import { Controller, Post, Body, Get, UseGuards, Request } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { AuthGuard } from '@nestjs/passport';
import { Public } from './public.decorator';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) { }

  @Public()
  @Post('login')
  @ApiOperation({ summary: 'Iniciar sesión (Obtener JWT)' })
  @ApiResponse({ status: 200, description: 'Login exitoso' })
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  // Endpoint de prueba para ver si el token funciona
  @UseGuards(AuthGuard('jwt'))
  @Get('profile')
  getProfile(@Request() req) {
    return req.user;
  }
}