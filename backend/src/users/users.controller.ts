import { Controller, Get, Param } from '@nestjs/common';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('profile/:id')
  async getProfile(@Param('id') id: string) {
    return { message: `User profile for ${id} - coming soon` };
  }
}