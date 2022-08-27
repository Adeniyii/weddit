import gql from 'graphql-tag';
import * as Urql from 'urql';
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: string;
  String: string;
  Boolean: boolean;
  Int: number;
  Float: number;
};

export type FieldError = {
  __typename?: 'FieldError';
  field: Scalars['String'];
  message: Scalars['String'];
};

export type LoginDetails = {
  email: Scalars['String'];
  password: Scalars['String'];
};

export type Mutation = {
  __typename?: 'Mutation';
  addPost: Post;
  changePassword: UserResponse;
  deletePost?: Maybe<Post>;
  forgotPassword: Scalars['Boolean'];
  login: UserResponse;
  logout: Scalars['Boolean'];
  register: UserResponse;
  updatePost?: Maybe<Post>;
  vote: Scalars['Boolean'];
};


export type MutationAddPostArgs = {
  details: PostDetails;
};


export type MutationChangePasswordArgs = {
  newPassword: Scalars['String'];
  token: Scalars['String'];
};


export type MutationDeletePostArgs = {
  id: Scalars['Float'];
};


export type MutationForgotPasswordArgs = {
  email: Scalars['String'];
};


export type MutationLoginArgs = {
  details: LoginDetails;
};


export type MutationRegisterArgs = {
  details: UserDetails;
};


export type MutationUpdatePostArgs = {
  id: Scalars['Float'];
  title: Scalars['String'];
};


export type MutationVoteArgs = {
  postId: Scalars['Float'];
  value: Scalars['Float'];
};

export type PaginatedPosts = {
  __typename?: 'PaginatedPosts';
  next: Scalars['Boolean'];
  posts: Array<Post>;
};

export type Post = {
  __typename?: 'Post';
  createdAt: Scalars['String'];
  creator: User;
  creatorId?: Maybe<Scalars['Int']>;
  id: Scalars['ID'];
  points: Scalars['Float'];
  snippet: Scalars['String'];
  text?: Maybe<Scalars['String']>;
  title: Scalars['String'];
  updatedAt: Scalars['String'];
};

export type PostDetails = {
  text: Scalars['String'];
  title: Scalars['String'];
};

export type Query = {
  __typename?: 'Query';
  me?: Maybe<User>;
  post?: Maybe<Post>;
  posts: PaginatedPosts;
};


export type QueryPostArgs = {
  id: Scalars['Float'];
};


export type QueryPostsArgs = {
  cursor?: InputMaybe<Scalars['String']>;
  limit?: InputMaybe<Scalars['Int']>;
};

export type Updoot = {
  __typename?: 'Updoot';
  userId: Scalars['Float'];
};

export type User = {
  __typename?: 'User';
  createdAt?: Maybe<Scalars['String']>;
  email?: Maybe<Scalars['String']>;
  id: Scalars['ID'];
  updatedAt?: Maybe<Scalars['String']>;
  updoots?: Maybe<Array<Updoot>>;
  username: Scalars['String'];
};

export type UserDetails = {
  email: Scalars['String'];
  password: Scalars['String'];
  username: Scalars['String'];
};

export type UserResponse = {
  __typename?: 'UserResponse';
  errors?: Maybe<Array<FieldError>>;
  user?: Maybe<User>;
};

export type BasicErrorFragment = { __typename?: 'FieldError', field: string, message: string };

export type BasicUserFragment = { __typename?: 'User', id: string, email?: string | null, username: string };

export type BasicUserResponseFragment = { __typename?: 'UserResponse', errors?: Array<{ __typename?: 'FieldError', field: string, message: string }> | null, user?: { __typename?: 'User', id: string, email?: string | null, username: string } | null };

export type ChangePasswordMutationVariables = Exact<{
  newPassword: Scalars['String'];
  token: Scalars['String'];
}>;


export type ChangePasswordMutation = { __typename?: 'Mutation', changePassword: { __typename?: 'UserResponse', errors?: Array<{ __typename?: 'FieldError', field: string, message: string }> | null, user?: { __typename?: 'User', id: string, email?: string | null, username: string } | null } };

export type ForgotPasswordMutationVariables = Exact<{
  email: Scalars['String'];
}>;


export type ForgotPasswordMutation = { __typename?: 'Mutation', forgotPassword: boolean };

export type LoginMutationVariables = Exact<{
  details: LoginDetails;
}>;


export type LoginMutation = { __typename?: 'Mutation', login: { __typename?: 'UserResponse', errors?: Array<{ __typename?: 'FieldError', field: string, message: string }> | null, user?: { __typename?: 'User', id: string, email?: string | null, username: string } | null } };

export type LogoutMutationVariables = Exact<{ [key: string]: never; }>;


export type LogoutMutation = { __typename?: 'Mutation', logout: boolean };

export type NewPostMutationVariables = Exact<{
  details: PostDetails;
}>;


export type NewPostMutation = { __typename?: 'Mutation', addPost: { __typename?: 'Post', id: string, title: string, points: number, text?: string | null, creatorId?: number | null } };

export type RegisterMutationVariables = Exact<{
  details: UserDetails;
}>;


export type RegisterMutation = { __typename?: 'Mutation', register: { __typename?: 'UserResponse', errors?: Array<{ __typename?: 'FieldError', field: string, message: string }> | null, user?: { __typename?: 'User', id: string, email?: string | null, username: string } | null } };

export type MeQueryVariables = Exact<{ [key: string]: never; }>;


export type MeQuery = { __typename?: 'Query', me?: { __typename?: 'User', id: string, email?: string | null, username: string } | null };

export type PostsQueryVariables = Exact<{
  limit?: InputMaybe<Scalars['Int']>;
  cursor?: InputMaybe<Scalars['String']>;
}>;


export type PostsQuery = { __typename?: 'Query', posts: { __typename?: 'PaginatedPosts', next: boolean, posts: Array<{ __typename?: 'Post', id: string, text?: string | null, title: string, points: number, snippet: string, creatorId?: number | null, updatedAt: string, createdAt: string, creator: { __typename?: 'User', id: string, username: string } }> } };

export const BasicErrorFragmentDoc = gql`
    fragment BasicError on FieldError {
  field
  message
}
    `;
export const BasicUserFragmentDoc = gql`
    fragment BasicUser on User {
  id
  email
  username
}
    `;
export const BasicUserResponseFragmentDoc = gql`
    fragment BasicUserResponse on UserResponse {
  errors {
    ...BasicError
  }
  user {
    ...BasicUser
  }
}
    ${BasicErrorFragmentDoc}
${BasicUserFragmentDoc}`;
export const ChangePasswordDocument = gql`
    mutation ChangePassword($newPassword: String!, $token: String!) {
  changePassword(newPassword: $newPassword, token: $token) {
    ...BasicUserResponse
  }
}
    ${BasicUserResponseFragmentDoc}`;

export function useChangePasswordMutation() {
  return Urql.useMutation<ChangePasswordMutation, ChangePasswordMutationVariables>(ChangePasswordDocument);
};
export const ForgotPasswordDocument = gql`
    mutation ForgotPassword($email: String!) {
  forgotPassword(email: $email)
}
    `;

export function useForgotPasswordMutation() {
  return Urql.useMutation<ForgotPasswordMutation, ForgotPasswordMutationVariables>(ForgotPasswordDocument);
};
export const LoginDocument = gql`
    mutation Login($details: LoginDetails!) {
  login(details: $details) {
    ...BasicUserResponse
  }
}
    ${BasicUserResponseFragmentDoc}`;

export function useLoginMutation() {
  return Urql.useMutation<LoginMutation, LoginMutationVariables>(LoginDocument);
};
export const LogoutDocument = gql`
    mutation Logout {
  logout
}
    `;

export function useLogoutMutation() {
  return Urql.useMutation<LogoutMutation, LogoutMutationVariables>(LogoutDocument);
};
export const NewPostDocument = gql`
    mutation NewPost($details: PostDetails!) {
  addPost(details: $details) {
    id
    title
    points
    text
    creatorId
  }
}
    `;

export function useNewPostMutation() {
  return Urql.useMutation<NewPostMutation, NewPostMutationVariables>(NewPostDocument);
};
export const RegisterDocument = gql`
    mutation register($details: UserDetails!) {
  register(details: $details) {
    ...BasicUserResponse
  }
}
    ${BasicUserResponseFragmentDoc}`;

export function useRegisterMutation() {
  return Urql.useMutation<RegisterMutation, RegisterMutationVariables>(RegisterDocument);
};
export const MeDocument = gql`
    query Me {
  me {
    ...BasicUser
  }
}
    ${BasicUserFragmentDoc}`;

export function useMeQuery(options?: Omit<Urql.UseQueryArgs<MeQueryVariables>, 'query'>) {
  return Urql.useQuery<MeQuery, MeQueryVariables>({ query: MeDocument, ...options });
};
export const PostsDocument = gql`
    query Posts($limit: Int, $cursor: String) {
  posts(limit: $limit, cursor: $cursor) {
    next
    posts {
      id
      text
      title
      points
      snippet
      creatorId
      updatedAt
      createdAt
      creator {
        id
        username
      }
    }
  }
}
    `;

export function usePostsQuery(options?: Omit<Urql.UseQueryArgs<PostsQueryVariables>, 'query'>) {
  return Urql.useQuery<PostsQuery, PostsQueryVariables>({ query: PostsDocument, ...options });
};