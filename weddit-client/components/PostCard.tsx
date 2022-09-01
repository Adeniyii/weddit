import {
  PostSnippetFragment,
  useDeletePostMutation,
  useMeQuery,
  useVoteMutation,
  VoteMutation,
} from "generated/graphql";
import React, { FC, useState } from "react";
import cn from "classnames";
import Link from "next/link";
import Button from "./Button";
import { ApolloCache, gql } from "@apollo/client";

interface IPost {
  post: PostSnippetFragment;
}

type LoadingState = "not-loading" | "upvoot-loading" | "downvoot-loading";

const updateAfterVote = (postId: number, voteValue: number, cache: ApolloCache<VoteMutation>) => {
  let newPoints = 1;
  let newVoteStatus = 1;
  const cachedPost = cache.readFragment<{
    id: number;
    points: number;
    voteStatus: number | null;
  }>({
    id: "Post" + postId,
    fragment: gql`
      fragment _ on Post {
        id
        points
        voteStatus
      }
    `,
  });
  if (!cachedPost) return;
  if (cachedPost.voteStatus === voteValue) {
    newPoints = cachedPost.points - voteValue;
  } else if (!cachedPost.voteStatus) {
    newPoints = cachedPost.points + voteValue;
  } else {
    newPoints = cachedPost.points + (2 * voteValue);
  }
  // write fragment to cache
  cache.writeFragment<{
    points: number;
    voteStatus: number | null;
  }>({
    id: "Post" + postId,
    fragment: gql`
      fragment _ on Post {
        points
        voteStatus
      }
    `,
    data: { points: newPoints, voteStatus: newVoteStatus },
  });
}


const PostCard: FC<IPost> = ({ post }) => {
  const [loading, setLoading] = useState<LoadingState>("not-loading");
  const [vote] = useVoteMutation();
  const { data } = useMeQuery();
  const [deletePost] = useDeletePostMutation();
  return (
    <article className="w-full flex items-center border border-gray-300 rounded-md min-h-[150px] p-4">
      <div className="flex flex-col self-stretch justify-between items-center mr-4">
        <button
          className={cn(
            "bg-gray-200 hover:bg-green-300 flex justify-center items-center h-5 w-5 pb-1 rounded",
            { "bg-green-400 ": post?.voteStatus === 1 }
          )}
          onClick={async () => {
            setLoading("upvoot-loading");
            await vote({
              variables: { postId: parseInt(post.id), value: 1 },
              update: (cache) => updateAfterVote(parseInt(post.id), 1, cache),
            });
            setLoading("not-loading");
          }}
        >
          {loading === "upvoot-loading" ? " " : "+"}
        </button>
        <p className="text-sm text-gray-700 font-medium">{post.points}</p>
        <button
          className={cn(
            "bg-gray-200 hover:bg-orange-300 flex justify-center items-center h-5 w-5 pb-1 rounded",
            { "bg-orange-400 ": post?.voteStatus === -1 }
          )}
          onClick={async () => {
            setLoading("downvoot-loading");
            await vote({
              variables: { postId: parseInt(post.id), value: -1 },
              update: (cache) => updateAfterVote(parseInt(post.id), -1, cache),
            });
            setLoading("not-loading");
          }}
        >
          {loading === "downvoot-loading" ? " " : "-"}
        </button>
      </div>
      <div className="flex flex-col w-full">
        <div className="flex">
          <Link href={`/post/${post.id}`} passHref>
            <a className="font-bold text-md mr-auto mb-2 w-fit hover:underline">
              {post.title}
            </a>
          </Link>
          {data?.me?.id === post.creator.id ? (
            <div className="flex flex-col gap-4">
              <Button
                className="bg-red-400 hover:bg-red-500 px-2 py-1 text-sm"
                onClick={() =>
                  deletePost({ variables: { id: parseInt(post.id) }, update: (cache) => {
                    cache.evict({id: 'Post:' + post.id})
                  } })
                }
              >
                Delete
              </Button>
              <Link href={`post/edit/${post.id}`} passHref>
                <a className="bg-gray-400 hover:bg-gray-500 px-2 py-1 text-white text-sm rounded">
                  Update
                </a>
              </Link>
            </div>
          ) : (
            ""
          )}
        </div>

        <p className="text-gray-300 font-bold text-sm">
          Authored by: {post.creator.username}
        </p>
        <p className="text-gray-500">{post.snippet}</p>
      </div>
    </article>
  );
};

export default PostCard;
