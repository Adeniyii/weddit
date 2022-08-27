import { Updoot } from "../entities/Updoot";
import {
  Arg,
  Ctx,
  Field,
  FieldResolver,
  InputType,
  Int,
  Mutation,
  ObjectType,
  Query,
  Resolver,
  Root,
  UseMiddleware,
} from "type-graphql";
import { Post } from "../entities/Post";
import { isAuth } from "../middleware/isAuth";
import { MyContext } from "../types";

@InputType()
class PostDetails {
  @Field()
  title!: string;
  @Field()
  text!: string;
}

@ObjectType()
class PaginatedPosts {
  @Field(() => [Post])
  posts: Post[];
  @Field()
  next: boolean;
}

@Resolver(Post)
export class PostResolver {
  // This field resolver can also be placed in the entity class as an extra field
  @FieldResolver(() => String)
  async snippet(@Root() post: Post) {
    return post.text.slice(0, 150);
  }

  @Mutation(() => Boolean)
  @UseMiddleware(isAuth)
  async vote(
    @Arg("postId") postId: number,
    @Arg("value") value: number,
    @Ctx() { req }: MyContext
  ) {
    const { userId } = req.session
    const vibe = value !== -1 ? 1 : -1

    // await Updoot.insert({
    //   userId,
    //   postId,
    //   vibe
    // })

    // using taplate strings to insert parameters into a raw sql query is generally bad practice,
    // as there is no string escaping happening and SQL injection can occur.
    // using the arguments array runs string escaping on the args. Use that where possible.
    await Post.query(
      `
      START TRANSACTION;

      INSERT INTO updoot ("userId", "postId", "vibe")
      VALUES (${userId}, ${postId}, ${vibe});

      UPDATE post
      set points = points + ${vibe}
      WHERE id = ${postId};

      COMMIT;
    `
    );

    return true
  }

  // Defines a resolver to get all posts from our database
  @Query(() => PaginatedPosts)
  async posts(
    @Arg("limit", () => Int, { defaultValue: 10, nullable: true })
    limit: number,
    @Arg("cursor", () => String, { nullable: true }) cursor: string
  ): Promise<PaginatedPosts> {
    // To cap the posts queried by the client at 50 items
    const realLimit = Math.min(50, limit);
    const queryParams: any = [realLimit + 1];

    if (cursor) {
      queryParams.push(new Date(parseInt(cursor)));
    }

    const result = await Post.query(
      `
      SELECT p.*,
      json_build_object(
        'id', u.id,
        'username', u.username,
        'email', u.email,
        'createdAt', u."createdAt",
        'updatedAt', u."updatedAt"
      ) creator
      FROM post p
      INNER JOIN public.user u
      ON u.id = p."creatorId"
      ${cursor ? `WHERE p."createdAt" < $2` : ""}
      ORDER BY p."createdAt" DESC
      LIMIT $1;
    `,
      queryParams
    );

    console.log("results: ", result);

    const fetchedMore = result.length > realLimit;
    return {
      posts: fetchedMore ? result.slice(0, result.length - 1) : result,
      next: fetchedMore,
    };
  }

  // Defines a resolver to get a post from our database
  @Query(() => Post, { nullable: true })
  post(@Arg("id") id: number): Promise<Post | null> {
    return Post.findOne({ where: { id } });
  }

  // Defines a resolver to creeate a post in our database
  @Mutation(() => Post)
  // middleware that runs before the resolvers. Use to apply auth checks, validation, etc.
  @UseMiddleware(isAuth)
  async addPost(
    @Ctx() { req }: MyContext,
    @Arg("details") details: PostDetails
  ): Promise<Post> {
    return Post.create({ ...details, creatorId: req.session.userId }).save();
  }

  // Defines a resolver to update a post in our database
  @Mutation(() => Post, { nullable: true })
  async updatePost(
    @Arg("id") id: number,
    @Arg("title") title: string
  ): Promise<Post | null> {
    const post = await Post.findOne({ where: { id } });
    if (post && title) {
      await Post.update({ id }, { title });
    }
    return post;
  }

  // Defines a resolver to delete a post from our database
  @Mutation(() => Post, { nullable: true })
  async deletePost(@Arg("id") id: number): Promise<Post | null> {
    const post = await Post.findOne({ where: { id } });
    try {
      await Post.delete(id);
    } catch (error) {
      return null;
    }
    return post;
  }
}
