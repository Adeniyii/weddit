import { useMeQuery } from "generated/graphql";
import router from "next/router";
import { useEffect } from "react";

export const useIsAuth = () => {
  const [{ fetching: loadingMe, data }] = useMeQuery();

  useEffect(() => {
    console.log(router);
    if (!loadingMe && !data?.me) {
      // tag the page we are routing from to the destination url as a query param
      // so that after login, we can grab the query param and redirect back here as a logged in user
      // to continue whatever action we wanted to perform before we logged in.
      router.replace("/login" + `?next=${router.pathname}`);
    }
  }, [loadingMe, data]);
};
