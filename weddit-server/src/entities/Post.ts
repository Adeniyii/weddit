import { Entity, OptionalProps, PrimaryKey, Property } from "@mikro-orm/core";

@Entity()
export class Post {
	// Tells typescript to shut up about default fields.. sheeshh
	[OptionalProps]?: 'updatedAt' | 'createdAt';

	@PrimaryKey()
	id!: number;

	@Property({ type: "date" })
	createdAt = new Date();

	@Property({ type: "date", onUpdate: () => new Date() })
	updatedAt = new Date();

  @Property({ type: "text" })
  title!: string;

}
