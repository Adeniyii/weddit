import { Post } from "generated/graphql";
import React, { FC } from "react";

interface IPost {
  post: Post;
}

const PostCard: FC<IPost> = ({ post }) => {
  return (
	<article className="w-full flex flex-col border border-gray-300 rounded-md p-4">
		<h2 className="font-bold text-md mb-2">{post.title}</h2>
		<p className="text-gray-300 font-bold text-sm">Authored by: {post.creator.username}</p>
		<p className="text-gray-500">{post.snippet}</p>
	</article>)
};

export default PostCard;
