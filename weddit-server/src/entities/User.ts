import { Field, ID, ObjectType } from "type-graphql";
import { BaseEntity, Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { Post } from "./Post";
import { Updoot } from "./Updoot";

@ObjectType() // defining graphql schema
@Entity()
export class User extends BaseEntity {
  @Field(() => ID)
  @PrimaryGeneratedColumn()
  id!: number;

  @Field()
  @Column({ unique: true })
  username!: string;

  @Field(() => String, {nullable: true})
  @Column({ unique: true })
  email!: string;

  @Column() // omit the `@Field` decorator here to hide it from the graphql schema, making it unqueryable by the client.
  password!: string;

  @OneToMany(() => Post, (post) => post.creator)
  posts!: Post[]

  @Field(() => [Updoot], {nullable: true})
  @OneToMany(() => Updoot, (updoot) => updoot.user)
  updoots: Updoot[]

  @Field(() => String, {nullable: true})
  @CreateDateColumn()
  createdAt: Date;

  @Field(() => String, {nullable: true})
  @UpdateDateColumn()
  updatedAt: Date;
}
