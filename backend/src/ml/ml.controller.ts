import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { IsArray, IsDateString, IsIn, IsInt, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { MlService } from './ml.service';

class PerformancePredictionDto {
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  race_distance: number;

  @IsOptional()
  @IsString()
  race_type?: string;
}

class RaceStrategyDto {
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  race_distance: number;

  @IsString()
  @IsDateString()
  race_date: string;
}

class TrainingPlanDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  weeks?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  goals?: string[];
}

class NextWorkoutDto {
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  goals?: string[];
}

@Controller('ml')
@UseGuards(JwtAuthGuard)
export class MlController {
  constructor(private readonly mlService: MlService) {}

  @Get('coaching/recommendations')
  async getCoachingRecommendations(
    @Request() req,
    @Query('goals') goals?: string,
    @Query('limit') limit?: string,
  ) {
    try {
      const goalsList = goals ? goals.split(',').map(g => g.trim()) : [];
      const activityLimit = limit ? parseInt(limit, 10) : 30;
      
      const recommendations = await this.mlService.getCoachingRecommendations(
        req.user.id,
        goalsList,
        activityLimit
      );

      return {
        success: true,
        data: recommendations,
        meta: {
          user_id: req.user.id,
          recommendations_count: recommendations.length,
          goals: goalsList
        }
      };
    } catch (error) {
      throw new HttpException(
        `Failed to get coaching recommendations: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('performance/predict')
  async predictPerformance(
    @Request() req,
    @Body() body: PerformancePredictionDto,
  ) {
    try {
      if (!body.race_distance || body.race_distance <= 0) {
        throw new HttpException('Valid race distance is required', HttpStatus.BAD_REQUEST);
      }

      const prediction = await this.mlService.predictPerformance(
        req.user.id,
        body.race_distance,
        body.race_type
      );

      return {
        success: true,
        data: prediction,
        meta: {
          user_id: req.user.id,
          race_distance: body.race_distance,
          race_type: body.race_type
        }
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        `Failed to predict performance: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('fatigue/analyze')
  async analyzeFatigue(@Request() req) {
    try {
      const analysis = await this.mlService.analyzeFatigue(req.user.id);

      return {
        success: true,
        data: analysis,
        meta: {
          user_id: req.user.id,
          analysis_timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      throw new HttpException(
        `Failed to analyze fatigue: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('training/load')
  async getTrainingLoad(@Request() req) {
    try {
      const trainingLoad = await this.mlService.getTrainingLoad(req.user.id);

      return {
        success: true,
        data: trainingLoad,
        meta: {
          user_id: req.user.id,
          calculation_timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      throw new HttpException(
        `Failed to get training load: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('race/strategy')
  async getRaceStrategy(
    @Request() req,
    @Body() body: RaceStrategyDto,
  ) {
    try {
      if (!body.race_distance || body.race_distance <= 0) {
        throw new HttpException('Valid race distance is required', HttpStatus.BAD_REQUEST);
      }

      if (!body.race_date) {
        throw new HttpException('Race date is required', HttpStatus.BAD_REQUEST);
      }

      const raceDate = new Date(body.race_date);
      if (isNaN(raceDate.getTime())) {
        throw new HttpException('Invalid race date format', HttpStatus.BAD_REQUEST);
      }

      const strategy = await this.mlService.getRaceStrategy(
        req.user.id,
        body.race_distance,
        raceDate
      );

      return {
        success: true,
        data: strategy,
        meta: {
          user_id: req.user.id,
          race_distance: body.race_distance,
          race_date: body.race_date
        }
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        `Failed to generate race strategy: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('training/plan')
  async generateTrainingPlan(
    @Request() req,
    @Body() body: TrainingPlanDto,
  ) {
    try {
      const plan = await this.mlService.generateTrainingPlan(
        req.user.id,
        body.weeks ?? 4,
        body.goals ?? []
      );

      return {
        success: true,
        data: plan,
        meta: {
          user_id: req.user.id,
          weeks: body.weeks ?? 4,
          goals: body.goals ?? []
        }
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        `Failed to generate training plan: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('workout/next')
  async suggestNextWorkout(
    @Request() req,
    @Body() body: NextWorkoutDto,
  ) {
    try {
      const workout = await this.mlService.suggestNextWorkout(
        req.user.id,
        body.goals ?? []
      );

      return {
        success: true,
        data: workout,
        meta: {
          user_id: req.user.id,
          goals: body.goals ?? []
        }
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        `Failed to suggest next workout: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('health')
  async checkHealth(@Request() req) {
    try {
      const isHealthy = await this.mlService.checkMLServiceHealth();
      
      return {
        success: true,
        data: {
          ml_service_healthy: isHealthy,
          backend_healthy: true,
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      return {
        success: false,
        data: {
          ml_service_healthy: false,
          backend_healthy: true,
          error: error.message,
          timestamp: new Date().toISOString()
        }
      };
    }
  }

  @Get('status')
  async getStatus() {
    try {
      const isHealthy = await this.mlService.checkMLServiceHealth();
      
      return {
        success: true,
        data: {
          service: 'AeroPacer ML Integration',
          status: isHealthy ? 'healthy' : 'degraded',
          ml_service_connected: isHealthy,
          features: [
            'coaching_recommendations',
            'performance_prediction',
            'fatigue_analysis',
            'training_load_analysis',
            'race_strategy'
          ],
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
}