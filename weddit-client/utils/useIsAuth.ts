import { useMeQuery } from "generated/graphql";
import router from "next/router";
import { useEffect, useRef } from "react";

export const useIsAuth = () => {
  const [{ fetching, data }] = useMeQuery();
  const nextPath = useRef("/")

  useEffect(() => {
    nextPath.current = router.pathname
    if (!fetching && !data?.me) {
      // tag the page we are routing from to the destination url as a query param
      // so that after login, we can grab the query param and redirect back here as a logged in user
      // to continue whatever action we wanted to perform before we logged in.
      router.push(`/login?next=${nextPath.current}`);
    }
  }, [data?.me]);
};
