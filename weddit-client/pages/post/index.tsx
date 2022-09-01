import Layout from "components/Layout";
import { Form, Formik } from "formik";
import { useNewPostMutation } from "generated/graphql";
import { useRouter } from "next/router";
import { useIsAuth } from "utils/useIsAuth";
import Button from "../../components/Button";
import InputField from "../../components/InputField";
import Wrapper from "../../components/Wrapper";
import withApolloClient from "utils/createApolloClient"

const post = () => {
  const [createPost, { loading }] = useNewPostMutation();
  const router = useRouter();
  // custom hook to check if there is a current user logged in, and redirects to the login page if no user.
  useIsAuth();

  return (
    <Layout>
      <Wrapper size="medium" className="px-4">
        <h1 className="font-bold text-2xl mb-10">New post</h1>
        <Formik
          initialValues={{ text: "", title: "" }}
          onSubmit={async (details, { setErrors }) => {
            const { errors } = await createPost({ variables: { details }, update: (cache) => {
              cache.evict({fieldName: "posts"})
            } });
            if (!errors) {
              router.push("/");
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
                {loading ? "..." : "post"}
              </Button>
            </Form>
          )}
        </Formik>
      </Wrapper>
    </Layout>
  );
};

export default withApolloClient({ssr: false})(post);
