import { User } from "../entities/User";
import {
  Arg,
  Ctx,
  Field,
  InputType,
  Mutation,
  ObjectType,
  Query,
  Resolver,
} from "type-graphql";
import { MyContext } from "src/types";
import argon from "argon2";

@InputType()
class UserDetails {
  @Field()
  username: string;
  @Field()
  password: string;
}

// Defines a field error type which can be returned for any field(s) with failing validators
@ObjectType()
class FieldError {
  @Field()
  field: string;
  @Field()
  message: string;
}

// Define a user response type which returns a user if successful
// or an array of errors of FieldError type if any
@ObjectType()
class UserResponse {
  @Field(() => [FieldError], { nullable: true })
  errors?: FieldError[];
  @Field(() => User, { nullable: true })
  user?: User;
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

  @Query(() => UserResponse)
  async login(
    @Arg("details") { username, password }: UserDetails,
    @Ctx() { em }: MyContext
  ): Promise<UserResponse> {
		// get user and validate if exists
    const user = await em.findOne(User, { username });
    if (!user) {
      const errors: FieldError[] = [
        {
          field: "username",
          message: "username does not exist.",
        },
      ];
      return { errors };
    }
		// get password and validate hash
    const correctPword = await argon.verify(user.passord, password);
    if (!correctPword) {
      const errors: FieldError[] = [
        {
          field: "password",
          message: `incorrect password for ${username}.`,
        },
      ];
      return { errors };
    }
		// all good, return validated user
    return { user };
  }
}
