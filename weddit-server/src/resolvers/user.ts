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
	@Query(() => User, {nullable: true})
	async me(@Ctx() {req, em}: MyContext): Promise<User | null>{
		if (!req.session.userId){
			return null
		}
		console.log(req.session)
		const user = await em.findOne(User, {id: req.session.userId})
		return user
	}

  @Mutation(() => UserResponse)
  async register(
    @Arg("details") { username, password }: UserDetails,
    @Ctx() { em, req }: MyContext
  ): Promise<UserResponse> {
    // validate username length
    if (username.length <= 2) {
      return {
        errors: [
          {
            field: "username",
            message: "username must be longer than 2 characters",
          },
        ],
      };
    }
    // validate password length
    if (password.length <= 3) {
      return {
        errors: [
          {
            field: "password",
            message: "password must be longer than 3 characters",
          },
        ],
      };
    }
    const hashedPassword = await argon.hash(password);
    const user = em.create(User, { username, passord: hashedPassword });
		try{
			await em.persistAndFlush(user);
		} catch (err){
			if (err.code === "23505"){
				return {errors: [{
					field: "username",
					message: "username already taken"
				}]}
			}
		}

		req.session.userId = user.id

    return { user };
  }

  @Query(() => UserResponse)
  async login(
    @Arg("details") { username, password }: UserDetails,
    @Ctx() { em, req }: MyContext
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

		// not storing the entire user as properties because the user info
		// will usually change making the user information on the session stale,
		// so we store the userId instead then use that to query for the current user info.
		// only objects whose value doesn't change should be store on the session.
		req.session.userId = user.id
    // all good, return validated user
    return { user };
  }
}
