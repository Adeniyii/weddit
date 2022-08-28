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

  @Mutation(() => Post)
  @UseMiddleware(isAuth)
  async vote(
    @Arg("postId") postId: number,
    @Arg("value") value: number,
    @Ctx() { req }: MyContext
  ): Promise<Post | null> {
    const { userId } = req.session
    const vibe = value !== -1 ? 1 : -1

    const foundDoot = await Updoot.findOne({where: {postId, userId}})

    // if a user has voted before, and tries to vote again with the same vibe, then undo the previous vote
    // e.g, I've upvoted before, if I click `upvote` again, my previous upvote should be removed.
    if (foundDoot && foundDoot.vibe === vibe){
      await Post.getRepository().manager.transaction(async (tm) => {
        // delete my upvote entry
        await tm.query(
          `
          DELETE FROM updoot
          WHERE "userId" = $1 AND "postId" = $2;
        `,
          [userId, postId]
        );

        // subtract my upvote/downvote from post points
        await tm.query(
          `
          UPDATE post
          set points = points - $1
          WHERE id = $2
        `,
          [vibe, postId]
        );
      });
      // if a user has voted before, and tries to vote again with a different vibe, then update vibe to the new vibe
      // e.g, I've upvoted before, if I click `downvote`, my previous upvote should be replaced with a downvote.
    } else if (foundDoot && foundDoot.vibe !== vibe) {
      await Post.getRepository().manager.transaction(async (tm) => {
        // change the vibe of my previous upvote entry
        await tm.query(
          `
          UPDATE updoot
          set vibe = $1
          WHERE "userId" = $2 AND "postId" = $3;
        `,
          [vibe, userId, postId]
        );

        // update the post points by twice the value of my new vibe to remove the previous vibe point and add a new vibe point
        await tm.query(
          `
          UPDATE post
          set points = points + $1
          WHERE id = $2
        `,
          [vibe * 2, postId]
        );
      });
    } else {
      // using template strings to insert parameters into a raw sql query is generally bad practice,
      // as there is no string escaping happening and SQL injection can occur.
      // using the arguments array runs string escaping on the args. Use that where possible.
      /* await Post.query(
        `
      START TRANSACTION;

      INSERT INTO updoot ("userId", "postId", "vibe")
      VALUES (${userId}, ${postId}, ${vibe});

      UPDATE post
      set points = points + ${vibe}
      WHERE id = ${postId};

      COMMIT;
    `
      ); */

      await Post.getRepository().manager.transaction(async (tm) => {
        // change the vibe of my previous upvote entry
        await tm.query(
          `
          INSERT INTO updoot (vibe, "userId", "postId")
          VALUES ($1, $2, $3)
        `,
          [vibe, userId, postId]
        );

        // update the post points by twice the value of my new vibe to remove the previous vibe point and add a new vibe point
        await tm.query(
          `
          UPDATE post
          set points = points + $1
          WHERE id = $2
        `,
          [vibe, postId]
        );
      });
    }

    const queryParams: any[] = [postId, postId];

    if (userId) {
      queryParams.push(userId);
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
      ) creator,
      ${
        req.session.userId
          ? '(SELECT vibe FROM updoot WHERE "userId" = $3 AND "postId" = $2) "voteStatus"'
          : 'null as "voteStatus"'
      }
      FROM post p
      INNER JOIN public.user u
      ON u.id = p."creatorId"
      WHERE p.id = $1
    `,
      queryParams
    );

    return result[0]
  }

  // Defines a resolver to get all posts from our database
  @Query(() => PaginatedPosts)
  async posts(
    @Arg("limit", () => Int, { defaultValue: 10, nullable: true })
    limit: number,
    @Arg("cursor", () => String, { nullable: true }) cursor: string | null,
    @Ctx() {req}: MyContext
  ): Promise<PaginatedPosts> {
    // To cap the posts queried by the client at 50 items
    const realLimit = Math.min(50, limit);
    const queryParams: any[] = [realLimit + 1];

    if (req.session.userId){
      queryParams.push(req.session.userId);
    }

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
      ) creator,
      ${
        req.session.userId
          ? '(SELECT vibe FROM updoot WHERE "userId" = $2 AND "postId" = p.id) "voteStatus"'
          : 'null as "voteStatus"'
      }
      FROM post p
      INNER JOIN public.user u
      ON u.id = p."creatorId"
      ${cursor ? `WHERE p."createdAt" < $3` : ""}
      ORDER BY p."createdAt" DESC
      LIMIT $1;
    `,
      queryParams
    );

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
