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
  // the cascade option on delete tells the updoot object to be deleted if its linked post is deleted.
  @ManyToOne(() => Post, (post) => post.updoots, {onDelete: "CASCADE"})
  post!: Post;

  @Column({ type: "int" })
	@Field()
  vibe!: number;
}
