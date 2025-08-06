import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from './user.entity';

@Entity('analytics_events')
export class AnalyticsEvent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  @Index()
  userId: string;

  @Column()
  @Index()
  event: string; // 'user_registered', 'strava_connected', 'activity_viewed', etc.

  @Column({ type: 'jsonb', nullable: true })
  properties: Record<string, any>; // Event-specific data

  @Column({ nullable: true })
  sessionId: string;

  @Column({ nullable: true })
  ipAddress: string;

  @Column({ nullable: true })
  userAgent: string;

  @Column({ nullable: true })
  referrer: string;

  @Column({ nullable: true })
  page: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: {
    source?: 'web' | 'mobile' | 'api';
    version?: string;
    platform?: string;
    browser?: string;
    device?: string;
  };

  @CreateDateColumn()
  @Index()
  createdAt: Date;

  // Relationships
  @ManyToOne(() => User, (user) => user.analyticsEvents, { 
    onDelete: 'SET NULL',
    nullable: true 
  })
  @JoinColumn({ name: 'userId' })
  user: User;
}