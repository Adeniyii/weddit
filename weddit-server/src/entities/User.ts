import { Entity, OptionalProps, PrimaryKey, Property } from "@mikro-orm/core";
import { Field, ID, ObjectType } from "type-graphql";

@ObjectType() // defining graphql schema
@Entity()
export class User {
  [OptionalProps]: "createdAt" | "updatedAt";

  @Field(() => ID)
  @PrimaryKey()
  id!: number;

  @Field()
  @Property({ type: "text", unique: true })
  username!: string;

  @Field()
  @Property({ type: "text", unique: true })
  email!: string;

  @Property({ type: "text" }) // omit the `@Field` decorator here to hide it from the graphql schema, making it unqueryable by the client.
  password!: string;

  @Field(() => String)
  @Property({ type: "date" })
  createdAt = new Date();

  @Field(() => String)
  @Property({ type: "date", onUpdate: () => new Date() })
  updatedAt = new Date();
}
