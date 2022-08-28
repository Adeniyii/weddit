import { Field, ID, Int, ObjectType } from "type-graphql";
import {
	BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { Updoot } from "./Updoot";
import { User } from "./User";

@ObjectType()
@Entity()
export class Post extends BaseEntity {
  @Field(() => ID)
  @PrimaryGeneratedColumn()
  id!: number;

  @Field()
  @Column()
  title!: string;

  @Field(() => Int)
  @Column({type: "int", default: 0})
  points!: number

  // @Field(() => [Updoot])
  @OneToMany(() => Updoot, (updoot) => updoot.post)
  updoots: Updoot[]

  // this value will be either -1, 1, or 0 to show if a user has voted on this post or not
  // It is a computed value only available as a graphQL query, but not as a column in the database
  // It is computed on the fly for the user making the request for the post data.
  @Field(() => Int, {nullable: true})
  voteStatus: number

  @Field()
  @Column()
  text!: string

  @Field(() => Int)
  @Column({type: "int"})
  creatorId!: number

  @Field(() => User)
  @ManyToOne(() => User, (user) => user.posts)
  creator!: User

  @Field(() => String)
  @CreateDateColumn()
  createdAt!: Date;

  @Field(() => String)
  @UpdateDateColumn()
  updatedAt!: Date;
}

/**
 * Notes:
 * You can omit the @Field decorator to hide a field from the graphql
 * schema, and prevent users from quering the field. Effectively making the field private to the server.
 *
 * Always add types for @Fields that are not scalars e.g dates, objects, etc.
 * Adding the @ObjectType decorator is mandatory to use the Post class as a type for resolvers referencing a Post type.
 */
