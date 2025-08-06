import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from './user.entity';

@Entity('activities')
export class Activity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index()
  userId: string;

  @Column({ nullable: true })
  @Index()
  stravaId: string;

  @Column()
  name: string;

  @Column()
  type: string; // 'Run', 'Walk', 'Hike', etc.

  @Column('decimal', { precision: 10, scale: 2 })
  distance: number; // in meters

  @Column()
  duration: number; // in seconds

  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  averagePace: number; // in seconds per km

  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  maxPace: number; // in seconds per km

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  elevationGain: number; // in meters

  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  averageHeartRate: number;

  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  maxHeartRate: number;

  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  averageCadence: number;

  @Column()
  @Index()
  startDate: Date;

  @Column('decimal', { precision: 10, scale: 6, nullable: true })
  startLatitude: number;

  @Column('decimal', { precision: 10, scale: 6, nullable: true })
  startLongitude: number;

  @Column('decimal', { precision: 10, scale: 6, nullable: true })
  endLatitude: number;

  @Column('decimal', { precision: 10, scale: 6, nullable: true })
  endLongitude: number;

  @Column({ type: 'jsonb', nullable: true })
  polyline: {
    summary?: string;
    detailed?: string;
  };

  @Column({ type: 'jsonb', nullable: true })
  splits: {
    distance: number;
    time: number;
    pace: number;
  }[];

  @Column({ type: 'jsonb', nullable: true })
  weather: {
    temperature?: number;
    humidity?: number;
    windSpeed?: number;
    conditions?: string;
  };

  @Column({ type: 'jsonb', nullable: true })
  stravaData: Record<string, any>; // Store raw Strava data for future use

  @Column({ default: false })
  isRace: boolean;

  @Column({ nullable: true })
  raceType: string; // '5K', '10K', 'Half Marathon', 'Marathon', etc.

  @Column({ type: 'text', nullable: true })
  description: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relationships
  @ManyToOne(() => User, (user) => user.activities, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  // Virtual fields
  get pacePerMile(): number {
    if (!this.averagePace) return null;
    return this.averagePace * 1.60934; // Convert pace per km to pace per mile
  }

  get distanceInKm(): number {
    return this.distance / 1000;
  }

  get distanceInMiles(): number {
    return this.distance / 1609.34;
  }

  get durationInMinutes(): number {
    return this.duration / 60;
  }

  get formattedPace(): string {
    if (!this.averagePace) return 'N/A';
    const minutes = Math.floor(this.averagePace / 60);
    const seconds = Math.floor(this.averagePace % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }
}