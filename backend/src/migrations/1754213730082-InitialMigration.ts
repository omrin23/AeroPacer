import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialMigration1754213730082 implements MigrationInterface {
    name = 'InitialMigration1754213730082'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create users table
        await queryRunner.query(`
            CREATE TABLE "users" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "email" character varying NOT NULL,
                "password" character varying NOT NULL,
                "firstName" character varying NOT NULL,
                "lastName" character varying NOT NULL,
                "stravaId" character varying,
                "preferences" jsonb,
                "profile" jsonb,
                "isActive" boolean NOT NULL DEFAULT true,
                "lastLoginAt" TIMESTAMP,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "UQ_users_email" UNIQUE ("email"),
                CONSTRAINT "PK_users" PRIMARY KEY ("id")
            )
        `);

        // Create indexes for users
        await queryRunner.query(`CREATE INDEX "IDX_users_email" ON "users" ("email")`);
        await queryRunner.query(`CREATE INDEX "IDX_users_stravaId" ON "users" ("stravaId")`);

        // Create activities table
        await queryRunner.query(`
            CREATE TABLE "activities" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "userId" uuid NOT NULL,
                "stravaId" character varying,
                "name" character varying NOT NULL,
                "type" character varying NOT NULL,
                "distance" numeric(10,2) NOT NULL,
                "duration" integer NOT NULL,
                "averagePace" numeric(5,2),
                "maxPace" numeric(5,2),
                "elevationGain" numeric(10,2),
                "averageHeartRate" numeric(5,2),
                "maxHeartRate" numeric(5,2),
                "averageCadence" numeric(5,2),
                "startDate" TIMESTAMP NOT NULL,
                "startLatitude" double precision,
                "startLongitude" double precision,
                "endLatitude" double precision,
                "endLongitude" double precision,
                "polyline" jsonb,
                "splits" jsonb,
                "weather" jsonb,
                "stravaData" jsonb,
                "isRace" boolean NOT NULL DEFAULT false,
                "raceType" character varying,
                "description" text,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_activities" PRIMARY KEY ("id")
            )
        `);

        // Create indexes for activities
        await queryRunner.query(`CREATE INDEX "IDX_activities_userId" ON "activities" ("userId")`);
        await queryRunner.query(`CREATE INDEX "IDX_activities_stravaId" ON "activities" ("stravaId")`);
        await queryRunner.query(`CREATE INDEX "IDX_activities_startDate" ON "activities" ("startDate")`);

        // Create analytics_events table
        await queryRunner.query(`
            CREATE TABLE "analytics_events" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "userId" uuid,
                "event" character varying NOT NULL,
                "properties" jsonb,
                "sessionId" character varying,
                "ipAddress" character varying,
                "userAgent" character varying,
                "referrer" character varying,
                "page" character varying,
                "metadata" jsonb,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_analytics_events" PRIMARY KEY ("id")
            )
        `);

        // Create indexes for analytics_events
        await queryRunner.query(`CREATE INDEX "IDX_analytics_events_userId" ON "analytics_events" ("userId")`);
        await queryRunner.query(`CREATE INDEX "IDX_analytics_events_event" ON "analytics_events" ("event")`);
        await queryRunner.query(`CREATE INDEX "IDX_analytics_events_createdAt" ON "analytics_events" ("createdAt")`);

        // Create auth_tokens table
        await queryRunner.query(`
            CREATE TABLE "auth_tokens" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "userId" uuid NOT NULL,
                "provider" character varying NOT NULL,
                "accessToken" text NOT NULL,
                "refreshToken" text,
                "tokenType" character varying,
                "scope" character varying,
                "expiresAt" TIMESTAMP,
                "providerData" jsonb,
                "isActive" boolean NOT NULL DEFAULT true,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_auth_tokens" PRIMARY KEY ("id")
            )
        `);

        // Create indexes for auth_tokens
        await queryRunner.query(`CREATE INDEX "IDX_auth_tokens_userId" ON "auth_tokens" ("userId")`);
        await queryRunner.query(`CREATE INDEX "IDX_auth_tokens_provider" ON "auth_tokens" ("provider")`);

        // Add foreign key constraints
        await queryRunner.query(`
            ALTER TABLE "activities" 
            ADD CONSTRAINT "FK_activities_userId" 
            FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
        `);

        await queryRunner.query(`
            ALTER TABLE "analytics_events" 
            ADD CONSTRAINT "FK_analytics_events_userId" 
            FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL
        `);

        await queryRunner.query(`
            ALTER TABLE "auth_tokens" 
            ADD CONSTRAINT "FK_auth_tokens_userId" 
            FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop foreign key constraints
        await queryRunner.query(`ALTER TABLE "auth_tokens" DROP CONSTRAINT "FK_auth_tokens_userId"`);
        await queryRunner.query(`ALTER TABLE "analytics_events" DROP CONSTRAINT "FK_analytics_events_userId"`);
        await queryRunner.query(`ALTER TABLE "activities" DROP CONSTRAINT "FK_activities_userId"`);
        
        // Drop tables
        await queryRunner.query(`DROP TABLE "auth_tokens"`);
        await queryRunner.query(`DROP TABLE "analytics_events"`);
        await queryRunner.query(`DROP TABLE "activities"`);
        await queryRunner.query(`DROP TABLE "users"`);
    }

}
