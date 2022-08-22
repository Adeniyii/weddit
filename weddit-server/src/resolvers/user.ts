import { User } from "../entities/User";
import { Arg, Ctx, Field, InputType, Mutation, Resolver } from "type-graphql";
import { MyContext } from "src/types";
import argon from "argon2";

@InputType()
class UserDetails {
  @Field()
  username: string;
  @Field()
  password: string;
}

@Resolver(User)
export class UserResolver {
  @Mutation(() => User)
  async register(
    @Arg("details") { username, password }: UserDetails,
    @Ctx() { em }: MyContext
  ): Promise<User> {
    const hashedPassword = await argon.hash(password);
    const user = em.create(User, { username, passord: hashedPassword });
    await em.persistAndFlush(user);
    return user;
  }
}
