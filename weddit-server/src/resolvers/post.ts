import { Post } from "../entities/Post";
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
import { MyContext } from "../types";
import { isAuth } from "../middleware/isAuth";

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
  posts: Post[]
  @Field()
  next: boolean
}

@Resolver(Post)
export class PostResolver {
  // This field resolver can also be placed in the entity class as an extra field
  @FieldResolver(() => String)
  async snippet(@Root() post: Post){
    return post.text.slice(0, 150)
  }

  // Defines a resolver to get all posts from our database
  @Query(() => PaginatedPosts)
  async posts(
    @Arg("limit", () => Int, {defaultValue: 10, nullable: true}) limit: number,
    @Arg("cursor", () => String, { nullable: true }) cursor: string
  ): Promise<PaginatedPosts> {
    // To cap the posts queried by the client at 50 items
    const realLimit = Math.min(50, limit)
    // Using the querybuilder to implement custom pagination logic using a limit and cursor strategy.
    const qb = Post.createQueryBuilder("P")
      .orderBy('"createdAt"', "DESC") // adding two quotes to createdAt to persist the capital cased `At`, else it throws an error

    if (cursor){
      qb.where('"createdAt" < :cursor', { cursor: new Date(parseInt(cursor)) });
    }
    // using + 1 to fetch more than the user requested, as a way to check if there are any more posts after what was requested
    const result = await qb.take(realLimit + 1).getMany();
    // check if fetched more than the user requested
    const fetchedMore = result.length > realLimit
    return {posts: fetchedMore ? result.slice(0, result.length - 1) : result, next: fetchedMore}
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
