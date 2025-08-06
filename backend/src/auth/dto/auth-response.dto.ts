import { User } from '../../entities/user.entity';

export class AuthResponseDto {
  accessToken: string;
  refreshToken?: string;
  user: Partial<User>;
  expiresIn: number;
}