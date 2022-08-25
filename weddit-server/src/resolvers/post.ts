import { Post } from "../entities/Post";
import { Arg, Mutation, Query, Resolver } from "type-graphql";

@Resolver(Post)
export class PostResolver {
  // Defines a resolver to get all posts from our database
  @Query(() => [Post])
  posts(): Promise<Post[]> {
    return Post.find();
  }

  // Defines a resolver to get a post from our database
  @Query(() => Post, { nullable: true })
  post(@Arg("id") id: number): Promise<Post | null> {
    return Post.findOne({where: { id }});
  }

  // Defines a resolver to creeate a post in our database
  @Mutation(() => Post)
  async addPost(
    @Arg("title") title: string
  ): Promise<Post> {
    return Post.create({ title }).save();
  }

  // Defines a resolver to update a post in our database
  @Mutation(() => Post, { nullable: true })
  async updatePost(
    @Arg("id") id: number,
    @Arg("title") title: string
  ): Promise<Post | null> {
    const post = await Post.findOne({where: { id }});
    if (post && title){
      await Post.update({id}, {title})
    }
    return post;
  }

  // Defines a resolver to delete a post from our database
  @Mutation(() => Post, { nullable: true })
  async deletePost(
    @Arg("id") id: number
  ): Promise<Post | null> {
    const post = await Post.findOne({where: { id }});
    try {
      await Post.delete(id)
    } catch (error) {
      return null;
    }
    return post;
  }
}
