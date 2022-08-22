import { Post } from "../entities/Post";
import { Arg, Ctx, Mutation, Query, Resolver } from "type-graphql";
import { MyContext } from "../types";

@Resolver(Post)
export class PostResolver {
  // Defines a resolver to get all posts from our database
  @Query(() => [Post])
  posts(@Ctx() { em }: MyContext): Promise<Post[]> { // The `@Ctx` decorator gives us access to the global context object
    return em.find(Post, {});
  }

  // Defines a resolver to get a post from our database
  @Query(() => Post, { nullable: true })
  post(@Ctx() { em }: MyContext, @Arg("id") id: number): Promise<Post | null> {
    return em.findOne(Post, { id });
  }

  // Defines a resolver to creeate a post in our database
  @Mutation(() => Post)
  async addPost(
    @Ctx() { em }: MyContext,
    @Arg("title") title: string
  ): Promise<Post> {
    const post = em.create(Post, { title });
    await em.persistAndFlush(post);
    return post;
  }

  // Defines a resolver to update a post in our database
  @Mutation(() => Post, { nullable: true })
  async updatePost(
    @Ctx() { em }: MyContext,
    @Arg("id") id: number,
    @Arg("title") title: string
  ): Promise<Post | null> {
    const post = await em.findOne(Post, { id });
    if (!post || !title) return null;
    post.title = title;
    await em.flush();
    return post;
  }

  // Defines a resolver to delete a post from our database
  @Mutation(() => Post, { nullable: true })
  async deletePost(
    @Ctx() { em }: MyContext,
    @Arg("id") id: number
  ): Promise<Post | null> {
    const post = await em.findOne(Post, { id });
    try {
      await em.nativeDelete(Post, { id });
    } catch (error) {
      return null;
    }
    return post;
  }
}
