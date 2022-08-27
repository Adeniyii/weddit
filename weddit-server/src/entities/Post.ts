import { Field, ID, ObjectType } from "type-graphql";
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

  @Field()
  @Column({type: "int", default: 0})
  points!: number

  // @Field(() => [Updoot])
  @OneToMany(() => Updoot, (updoot) => updoot.post)
  updoots: Updoot[]

  @Field()
  @Column()
  text!: string

  @Field()
  @Column({type: "int"})
  creatorId!: number

  @Field(() => User)
  @ManyToOne(() => User, (user) => user.posts)
  creator!: User

  @Field(() => String)
  @CreateDateColumn()
  createdAt: Date;

  @Field(() => String)
  @UpdateDateColumn()
  updatedAt: Date;
}

/**
 * Notes:
 * You can omit the @Field decorator to hide a field from the graphql
 * schema, and prevent users from quering the field. Effectively making the field private to the server.
 *
 * Always add types for @Fields that are not scalars e.g dates, objects, etc.
 * Adding the @ObjectType decorator is mandatory to use the Post class as a type for resolvers referencing a Post type.
 */
