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
import { User } from "../entities/User";

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

  // Field resolver for the computed votestatus field.
  @FieldResolver(() => Int, {nullable: true})
  async voteStatus(@Root() post: Post, @Ctx() {req, updootLoader}: MyContext){
    if (!req.session.userId){
      return null
    }
    const updoot = await updootLoader.load({userId: req.session.userId, postId: post.id})
    return updoot?.vibe || null
  }

  @FieldResolver(() => User)
  async creator(@Root() post: Post, @Ctx() {userLoader}: MyContext){
    return userLoader.load(post.creatorId)
  }

  @Mutation(() => Post)
  @UseMiddleware(isAuth)
  async vote(
    @Arg("postId", () => Int) postId: number,
    @Arg("value", () => Int) value: number,
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

    return Post.findOne({where: {id: postId}, relations: {creator: true}})
  }

  // Defines a resolver to get all posts from our database
  @Query(() => PaginatedPosts)
  async posts(
    @Arg("limit", () => Int, { defaultValue: 10, nullable: true })
    limit: number,
    @Arg("cursor", () => String, { nullable: true }) cursor: string | null
  ): Promise<PaginatedPosts> {
    // To cap the posts queried by the client at 50 items
    const realLimit = Math.min(50, limit);
    const queryParams: any[] = [realLimit + 1];

    if (cursor) {
      queryParams.push(new Date(parseInt(cursor)));
    }

    /* json_build_object(
      'id', u.id,
      'username', u.username,
      'email', u.email,
      'createdAt', u."createdAt",
      'updatedAt', u."updatedAt"
    ) creator */
    const result = await Post.query(
      `
      SELECT p.*
      FROM post p
      INNER JOIN public.user u
      ON u.id = p."creatorId"
      ${cursor ? `WHERE p."createdAt" < $2` : ""}
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
  post(@Arg("id", () => Int) id: number): Promise<Post | null> {
    // return Post.findOne({ where: { id }, relations: {creator: true} });
    return Post.findOne({ where: { id } });
  }

  // Defines a resolver to creeate a post in our database.
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
  @UseMiddleware(isAuth)
  async updatePost(
    @Arg("id", () => Int) id: number,
    @Arg("title") title: string,
    @Arg("text") text: string,
    @Ctx() {req}: MyContext
  ): Promise<Post | null> {
    const post = await Post.findOne({ where: { id } });
    if (post && title && text) {
      const updatedPost = await Post.createQueryBuilder()
        .update(Post)
        .set({ title, text })
        .where({ id, creatorId: req.session.userId })
        .returning("*")
        .execute();

      return updatedPost.raw[0]
    }
    return null;
  }

  // Defines a resolver to delete a post from our database
  @Mutation(() => Boolean, { nullable: true })
  @UseMiddleware(isAuth)
  async deletePost(@Arg("id", () => Int) id: number, @Ctx() {req}: MyContext) {
    try {
      await Post.delete({id, creatorId: req.session.userId});
    } catch (error) {
      return null;
    }
    return true;
  }
}
