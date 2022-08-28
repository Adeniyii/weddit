import { Field, ObjectType } from "type-graphql";
import { BaseEntity, Column, Entity, ManyToOne, PrimaryColumn } from "typeorm";
import { User } from "./User";
import { Post } from "./Post";

@ObjectType()
@Entity()
export class Updoot extends BaseEntity {
  // Many -> Many table joining User and Post entities
  @PrimaryColumn()
  @Field()
  userId!: number;

  // setting two primary keys in an entity generates a composite key
  // so uniquness is checked based on the combination of both keys.
  @PrimaryColumn()
  @Field()
  postId!: number;

  // many updoots to one user
  @ManyToOne(() => User, (user) => user.updoots)
  user!: User;

  // many updoots to one post
  @ManyToOne(() => Post, (post) => post.updoots)
  post!: Post;

  @Column({ type: "int" })
	@Field()
  vibe!: number;
}
