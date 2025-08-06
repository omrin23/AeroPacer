import { MigrationInterface, QueryRunner } from "typeorm";

export class FixLatitudeLongitudeColumns1754481298154 implements MigrationInterface {
    name = 'FixLatitudeLongitudeColumns1754481298154'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "activities" DROP COLUMN "startLatitude"`);
        await queryRunner.query(`ALTER TABLE "activities" ADD "startLatitude" numeric(10,6)`);
        await queryRunner.query(`ALTER TABLE "activities" DROP COLUMN "startLongitude"`);
        await queryRunner.query(`ALTER TABLE "activities" ADD "startLongitude" numeric(10,6)`);
        await queryRunner.query(`ALTER TABLE "activities" DROP COLUMN "endLatitude"`);
        await queryRunner.query(`ALTER TABLE "activities" ADD "endLatitude" numeric(10,6)`);
        await queryRunner.query(`ALTER TABLE "activities" DROP COLUMN "endLongitude"`);
        await queryRunner.query(`ALTER TABLE "activities" ADD "endLongitude" numeric(10,6)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "activities" DROP COLUMN "endLongitude"`);
        await queryRunner.query(`ALTER TABLE "activities" ADD "endLongitude" integer`);
        await queryRunner.query(`ALTER TABLE "activities" DROP COLUMN "endLatitude"`);
        await queryRunner.query(`ALTER TABLE "activities" ADD "endLatitude" integer`);
        await queryRunner.query(`ALTER TABLE "activities" DROP COLUMN "startLongitude"`);
        await queryRunner.query(`ALTER TABLE "activities" ADD "startLongitude" integer`);
        await queryRunner.query(`ALTER TABLE "activities" DROP COLUMN "startLatitude"`);
        await queryRunner.query(`ALTER TABLE "activities" ADD "startLatitude" integer`);
    }

}
