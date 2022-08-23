import { Migration } from '@mikro-orm/migrations';

export class Migration20220823145459 extends Migration {

  async up(): Promise<void> {
    this.addSql('alter table "user" rename column "passord" to "password";');
  }

  async down(): Promise<void> {
    this.addSql('alter table "user" rename column "password" to "passord";');
  }

}
