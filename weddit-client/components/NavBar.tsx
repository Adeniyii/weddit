import { useMeQuery } from "generated/graphql";
import Link from "next/link";
import React, { useEffect } from "react";
import Wrapper from "./Wrapper";

const NavBar = () => {
  const [{ data, fetching }, fetchMe] = useMeQuery();

  return (
    <header className="sticky top-0 left-0 w-full py-3 bg-gray-400">
      <Wrapper className="flex items-center">
        <Link href="/" passHref>
          <a className="p-3 text-green-900 font-bold mr-auto">Weddit</a>
        </Link>
        {(!data?.me || fetching) && (
          <nav>
            <ul className="flex gap-4">
              <li>
                <Link href="/login" passHref>
                  <a className="p-3 hover:underline">Login</a>
                </Link>
              </li>
              <li>
                <Link href="/register" passHref>
                  <a className="p-3 hover:underline">Register</a>
                </Link>
              </li>
            </ul>
          </nav>
        )}
        {fetching && <p className="ml-3 text-green-800 font-bold">...</p>}
        {data?.me && !fetching && (
          <p className="ml-3 text-yellow-900 font-bold">{data?.me?.username}</p>
        )}
      </Wrapper>
    </header>
  );
};

export default NavBar;
