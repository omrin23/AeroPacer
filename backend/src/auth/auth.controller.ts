import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() body: any) {
    return { message: 'Registration endpoint - coming soon' };
  }

  @Post('login') 
  async login(@Body() body: any) {
    return { message: 'Login endpoint - coming soon' };
  }
}