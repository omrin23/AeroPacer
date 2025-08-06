import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';

export interface UpdateProfileDto {
  firstName?: string;
  lastName?: string;
  preferences?: {
    units?: 'metric' | 'imperial';
    timezone?: string;
    goals?: {
      weeklyDistance?: number;
      weeklyRuns?: number;
      targetRaceTime?: string;
    };
  };
  profile?: {
    age?: number;
    weight?: number;
    height?: number;
    runningExperience?: 'beginner' | 'intermediate' | 'advanced';
    favoriteDistance?: string;
  };
}

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async findById(userId: string): Promise<Partial<User>> {
    const user = await this.userRepository.findOne({
      where: { id: userId, isActive: true },
      select: [
        'id',
        'email',
        'firstName',
        'lastName',
        'stravaId',
        'preferences',
        'profile',
        'createdAt',
        'lastLoginAt',
      ],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async updateProfile(userId: string, updateData: UpdateProfileDto): Promise<Partial<User>> {
    const user = await this.userRepository.findOne({
      where: { id: userId, isActive: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Merge preferences and profile
    const updatedUser = {
      ...updateData,
      preferences: {
        ...user.preferences,
        ...updateData.preferences,
      },
      profile: {
        ...user.profile,
        ...updateData.profile,
      },
    };

    await this.userRepository.update(userId, updatedUser);

    return this.findById(userId);
  }

  async getUserById(userId: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id: userId, isActive: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async getUserByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { email, isActive: true },
    });
  }

  async updateStravaConnection(userId: string, stravaId: string): Promise<void> {
    await this.userRepository.update(userId, { stravaId });
  }
}