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
import { EntityManager } from "@mikro-orm/postgresql";
import { COOKIE_NAME, FORGOT_PASSWORD_PREFIX } from "../constants";
import { sendEmail } from "../utils/sendEmail";
import {v4} from 'uuid'

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
  @Query(() => User, { nullable: true })
  async me(@Ctx() { req, em }: MyContext): Promise<User | null> {
    if (!req.session.userId) {
      return null;
    }
    console.log(req.session);
    const user = await em.findOne(User, { id: req.session.userId });
    return user;
  }

  @Mutation(() => UserResponse)
  async register(
    @Arg("details") { username, email, password }: UserDetails,
    @Ctx() { em, req }: MyContext
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
    let user = em.create(User, { username, email, password });

    try {
      // example using the query builder which bypasses the ORM (for the most part)
      const result = await (em as EntityManager)
        .createQueryBuilder(User)
        .getKnexQuery()
        .insert({
          email,
          username,
          password: hashedPassword,
          created_at: new Date(),
          updated_at: new Date(),
        })
        .returning("*");

      user = result[0];
    } catch (err) {
      if (err.message.includes("username")) {
        return {
          errors: [
            {
              field: "username",
              message: "username already taken",
            },
          ],
        };
      } else if (err.message.includes("email")) {
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
    @Ctx() { em, req }: MyContext
  ): Promise<UserResponse> {
    // get user and validate if exists
    const user = await em.findOne(User, { email });
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
    @Ctx() { redis, em }: MyContext,
    @Arg("email") email: string
  ) {
    const user = await em.findOne(User, { email });

    if (!user){
      return true
    }

    const token = v4()

    redis.set(FORGOT_PASSWORD_PREFIX + token, user.id, "EX", 1000 * 60 * 60 * 24) // 1 day to reset your password

    const body = `<a href="http://localhost:3000/change-password/${token}">reset password</a>`
    sendEmail(email, body)
    return true;
  }
}
