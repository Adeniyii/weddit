import Button from "components/Button";
import InputField from "components/InputField";
import Layout from "components/Layout";
import Wrapper from "components/Wrapper";
import { Formik, Form } from "formik";
import { usePostQuery, useUpdatePostMutation } from "generated/graphql";
import { useRouter } from "next/router";
import React from "react";
import withApolloClient from "utils/createApolloClient";

const EditPost = () => {
  const router = useRouter();
  const [updatePost, { data, loading: updating }] = useUpdatePostMutation();
  const { data: post, loading } = usePostQuery({
    variables: { id: parseInt(router.query.id as string) },
  });

  if (loading) {
    return (
      <Layout>
        <p>Loading...</p>
      </Layout>
    );
  }

  if (!router.query.id) {
    return (
      <Layout>
        <p>No post was found</p>
      </Layout>
    );
  }

  return (
    <Layout>
      <Wrapper size="medium" className="px-4">
        <h1 className="font-bold text-2xl mb-10">Update post</h1>
        <Formik
          initialValues={{
            text: post?.post?.text || "",
            title: post?.post?.title || "",
          }}
          onSubmit={async (details, { setErrors }) => {
            const { errors } = await updatePost({
              variables: {
                ...details,
                id: parseInt(router.query.id as string),
              },
            });
            if (!errors) {
              router.back();
            }
          }}
        >
          {({}) => (
            <Form>
              <InputField
                name="title"
                type="text"
                variant="small"
                placeholder="title"
                className="mb-4"
              />
              <InputField
                name="text"
                variant="small"
                placeholder="text"
                textArea
              />
              <Button type="submit" className="mt-5">
                {updating ? "..." : "post"}
              </Button>
            </Form>
          )}
        </Formik>
      </Wrapper>
    </Layout>
  );
};

export default withApolloClient({ssr: false})(EditPost);
