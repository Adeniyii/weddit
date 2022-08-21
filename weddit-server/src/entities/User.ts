import { Entity, PrimaryKey, Property } from "@mikro-orm/core";
import { Field, ObjectType } from "type-graphql";

@ObjectType() // defining graphql schema
@Entity()
export class User {
	@Field()
	@PrimaryKey()
	id!: number;

	@Field()
	@Property({ type: "text", unique: true })
	username!: string

	@Field(() => String)
	@Property({type: "date"})
	createdAt = new Date()

	@Field(() => String)
	@Property({type: "date", onUpdate: () => new Date()})
	updatedAt = new Date()

	@Property({type: "text"}) // omitting the `@Field` decorator here to hide it from the graphql schema, making it unqueryable by the client.
	passord!: string
}
