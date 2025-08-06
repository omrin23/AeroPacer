import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { Activity } from './activity.entity';
import { AnalyticsEvent } from './analytics-event.entity';
import { AuthToken } from './auth-token.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  @Index()
  email: string;

  @Column()
  password: string;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column({ nullable: true })
  @Index()
  stravaId: string;

  @Column({ type: 'jsonb', nullable: true })
  preferences: {
    units?: 'metric' | 'imperial';
    timezone?: string;
    goals?: {
      weeklyDistance?: number;
      weeklyRuns?: number;
      targetRaceTime?: string;
    };
  };

  @Column({ type: 'jsonb', nullable: true })
  profile: {
    age?: number;
    weight?: number;
    height?: number;
    runningExperience?: 'beginner' | 'intermediate' | 'advanced';
    favoriteDistance?: string;
  };

  @Column({ default: true })
  isActive: boolean;

  @Column({ nullable: true })
  lastLoginAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relationships
  @OneToMany(() => Activity, (activity) => activity.user)
  activities: Activity[];

  @OneToMany(() => AnalyticsEvent, (event) => event.user)
  analyticsEvents: AnalyticsEvent[];

  @OneToMany(() => AuthToken, (token) => token.user)
  authTokens: AuthToken[];

  // Virtual fields
  get fullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }
}