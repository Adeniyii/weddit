import { PostSnippetFragment, useVoteMutation } from "generated/graphql";
import React, { FC, useState } from "react";

interface IPost {
  post: PostSnippetFragment;
}

type LoadingState = "not-loading" | "upvoot-loading" | "downvoot-loading";

const PostCard: FC<IPost> = ({ post }) => {
  const [loading, setLoading] = useState<LoadingState>("not-loading")
  const [, vote] = useVoteMutation()
  return (
    <article className="w-full flex items-center border border-gray-300 rounded-md p-4">
      <div className="flex flex-col self-stretch justify-between items-center mr-4">
        <button
          className="bg-gray-200 hover:bg-green-200 flex justify-center items-center h-5 w-5 pb-1 rounded"
          onClick={async () => {
            setLoading("upvoot-loading");
            await vote({ postId: parseInt(post.id), value: 1 });
            setLoading("not-loading");
          }}
        >
          {loading === "upvoot-loading" ? ".." : "+"}
        </button>
        <p className="text-sm text-gray-700 font-medium">{post.points}</p>
        <button
          className="bg-gray-200 hover:bg-orange-200 flex justify-center items-center h-5 w-5 pb-1 rounded"
          onClick={async () => {
            setLoading("downvoot-loading");
            await vote({ postId: parseInt(post.id), value: -1 });
            setLoading("not-loading");
          }}
        >
          {loading === "downvoot-loading" ? ".." : "-"}
        </button>
      </div>
      <div className="flex flex-col w-full">
        <h2 className="font-bold text-md mb-2">{post.title}</h2>
        <p className="text-gray-300 font-bold text-sm">
          Authored by: {post.creator.username}
        </p>
        <p className="text-gray-500">{post.snippet}</p>
      </div>
    </article>
  );
};

export default PostCard;
