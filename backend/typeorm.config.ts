import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { User } from './src/entities/user.entity';
import { Activity } from './src/entities/activity.entity';
import { AnalyticsEvent } from './src/entities/analytics-event.entity';
import { AuthToken } from './src/entities/auth-token.entity';

config();

export default new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
  database: process.env.DB_NAME || 'aeropacer',
  entities: [User, Activity, AnalyticsEvent, AuthToken],
  migrations: ['src/migrations/*.ts'],
  migrationsTableName: 'migrations',
  synchronize: false, // Never use synchronize in production
});