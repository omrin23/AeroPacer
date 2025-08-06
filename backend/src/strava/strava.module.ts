import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StravaService } from './strava.service';
import { StravaController } from './strava.controller';
import { AuthToken } from '../entities/auth-token.entity';
import { Activity } from '../entities/activity.entity';
import { User } from '../entities/user.entity';
import { UsersModule } from '../users/users.module';
import { ActivitiesModule } from '../activities/activities.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([AuthToken, Activity, User]),
    UsersModule,
    ActivitiesModule,
  ],
  controllers: [StravaController],
  providers: [StravaService],
  exports: [StravaService],
})
export class StravaModule {}