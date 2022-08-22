import { Entity, OptionalProps, PrimaryKey, Property } from "@mikro-orm/core";
import { Field, ID, ObjectType } from "type-graphql";

@ObjectType()
@Entity()
export class Post {
	// Tells typescript to shut up about default fields.. sheeshh
	[OptionalProps]?: 'updatedAt' | 'createdAt';

	@Field(() => ID)
	@PrimaryKey()
	id!: number;

	@Field(() => String)
	@Property({ type: "date" })
	createdAt = new Date();

	@Field(() => String)
	@Property({ type: "date", onUpdate: () => new Date() })
	updatedAt = new Date();

	@Field()
  @Property({ type: "text" })
  title!: string;

}

/**
 * Notes:
 * You can omit the @Field decorator to hide a field from the graphql
 * schema, and prevent users from quering the field. Effectively making the field private to the server.
 *
 * Always add types for @Fields that are not scalars e.g dates, objects, etc.
 * Adding the @ObjectType decorator is mandatory to use the Post class as a type for resolvers referencing a Post type.
 */
