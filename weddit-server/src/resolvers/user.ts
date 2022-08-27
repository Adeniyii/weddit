import { User } from "../entities/User";
import {
  Arg,
  Ctx,
  Field,
  FieldResolver,
  InputType,
  Mutation,
  ObjectType,
  Query,
  Resolver,
  Root,
} from "type-graphql";
import { MyContext } from "src/types";
import argon from "argon2";
import { COOKIE_NAME, FORGOT_PASSWORD_PREFIX } from "../constants";
import { sendEmail } from "../utils/sendEmail";
import { v4 } from "uuid";

@InputType()
class UserDetails {
  @Field()
  email: string;
  @Field()
  username: string;
  @Field()
  password: string;
}

@InputType()
class LoginDetails {
  @Field()
  email: string;
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
  // a field resolver to prevent the email of a user from being queried by other users
  @FieldResolver()
  email(@Root() root: User, @Ctx() {req}: MyContext) {
    // if email does not belong to current user
    if (root.id !== req.session.userId){
      return ""
    }
    // else
    return root.email
  }

  @Query(() => User, { nullable: true })
  me(@Ctx() { req }: MyContext): Promise<User | null> | null {
    if (!req.session.userId) {
      return null;
    }
    console.log(req.session);
    return User.findOne({ where: { id: req.session.userId } });
  }

  @Mutation(() => UserResponse)
  async register(
    @Arg("details") { username, email, password }: UserDetails,
    @Ctx() { req }: MyContext
  ): Promise<UserResponse> {
    // validate email pattern
    if (!email.includes("@")) {
      return {
        errors: [
          {
            field: "email",
            message: "email must be a valid email",
          },
        ],
      };
    }
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
    let user = null;
    try {
      // example using the query builder
      // equivalent to just doing => User.create({ email, username, password: hashedPassword }).save()
      // but leaving this here as using the queryBuilder can be useful sometimes.. maybe
      const result = await User.createQueryBuilder()
        .insert()
        .values({ email, username, password: hashedPassword })
        .returning("*")
        .execute();

      user = result.raw[0];
    } catch (err) {
      if (err.detail.includes("username")) {
        return {
          errors: [
            {
              field: "username",
              message: "username already taken",
            },
          ],
        };
      } else if (err.detail.includes("email")) {
        return {
          errors: [
            {
              field: "email",
              message: "email already taken",
            },
          ],
        };
      }
    }

    req.session.userId = user.id;

    return { user };
  }

  @Mutation(() => UserResponse)
  async login(
    @Arg("details") { email, password }: LoginDetails,
    @Ctx() { req }: MyContext
  ): Promise<UserResponse> {
    // get user and validate if exists
    const user = await User.findOne({ where: { email } });
    if (!user) {
      const errors: FieldError[] = [
        {
          field: "email",
          message: "email does not exist.",
        },
      ];
      return { errors };
    }
    // get password and validate hash
    const correctPword = await argon.verify(user.password, password);
    if (!correctPword) {
      const errors: FieldError[] = [
        {
          field: "password",
          message: `incorrect password for ${email}.`,
        },
      ];
      return { errors };
    }

    // not storing the entire user as properties because the user info
    // will usually change making the user information on the session stale,
    // so we store the userId instead then use that to query for the current user info.
    // only objects whose value doesn't change should be store on the session.
    req.session.userId = user.id;
    // all good, return validated user
    return { user };
  }

  @Mutation(() => Boolean)
  logout(@Ctx() { req, res }: MyContext) {
    return new Promise((resolve) =>
      req.session.destroy((err) => {
        if (err) {
          console.log(err);
          resolve(false);
          return;
        }
        res.clearCookie(COOKIE_NAME);
        resolve(true);
      })
    );
  }

  @Mutation(() => Boolean)
  async forgotPassword(
    @Ctx() { redis }: MyContext,
    @Arg("email") email: string
  ) {
    const user = await User.findOne({ where: { email } });

    if (!user) {
      return true;
    }

    const token = v4();

    // set user refresh password token in redis database to be looked up when the change password mutation is called
    // key -> prefix + token, value -> userId
    redis.set(
      FORGOT_PASSWORD_PREFIX + token,
      user.id,
      "EX",
      1000 * 60 * 60 * 24
    ); // 1 day to reset your password

    // send an email containing a link embedded with the generated token to the user to be used to change their password.
    const body = `<a href="http://localhost:3000/change-password/${token}">reset password</a>`;
    sendEmail(email, body);
    return true;
  }

  @Mutation(() => UserResponse)
  async changePassword(
    @Arg("token") token: string,
    @Arg("newPassword") newPassword: string,
    @Ctx() { redis, req }: MyContext
  ): Promise<UserResponse> {
    if (newPassword.length <= 3) {
      return {
        errors: [
          {
            field: "newPassword",
            message: "password must be at least 3 characters",
          },
        ],
      };
    }

    const key = FORGOT_PASSWORD_PREFIX + token;
    const userId = await redis.get(key);

    if (!userId) {
      return {
        errors: [
          {
            field: "token",
            message: "invalid token",
          },
        ],
      };
    }

    const idNum = parseInt(userId as string);
    const user = await User.findOne({ where: { id: idNum } });

    if (!user) {
      return {
        errors: [
          {
            field: "token",
            message: "user does not exist anymore",
          },
        ],
      };
    }

    await User.update(
      { id: idNum },
      { password: await argon.hash(newPassword) }
    );

    // remove token from redis db, so a user cannot user that same refresh password token again
    await redis.del(key);

    // log the user in after changing their password // totally optional depending on the required behaviour
    req.session.userId = user.id;

    return {
      user,
    };
  }
}
