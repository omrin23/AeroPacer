import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { MlController } from './ml.controller';
import { MlService } from './ml.service';
import { Activity } from '../entities/activity.entity';
import { User } from '../entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Activity, User]),
    ConfigModule,
  ],
  controllers: [MlController],
  providers: [MlService],
  exports: [MlService],
})
export class MlModule {}