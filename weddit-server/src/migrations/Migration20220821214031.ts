import { Migration } from '@mikro-orm/migrations';

export class Migration20220821214031 extends Migration {

  async up(): Promise<void> {
    this.addSql('create table "user" ("id" serial primary key, "username" text not null, "created_at" timestamptz(0) not null, "updated_at" timestamptz(0) not null, "passord" text not null);');
    this.addSql('alter table "user" add constraint "user_username_unique" unique ("username");');
  }

  async down(): Promise<void> {
    this.addSql('drop table if exists "user" cascade;');
  }

}
