import { useLogoutMutation, useMeQuery } from "generated/graphql";
import Link from "next/link";
import React from "react";
import Button from "./Button";
import Wrapper from "./Wrapper";

const NavBar = () => {
  const [{ data, fetching }] = useMeQuery();
  const [{fetching: loggingOut}, logout] = useLogoutMutation()

  const handleLogout = () => {
    logout({})
  }

  return (
    <header className="sticky top-0 left-0 w-full py-3 bg-gray-400">
      <Wrapper className="flex items-center">
        <Link href="/" passHref>
          <a className="p-3 text-green-900 font-bold mr-auto">Weddit</a>
        </Link>
        {!data?.me && !fetching && (
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
          <div className="flex items-center">
            <p className="mr-3 text-yellow-900 font-bold">
              {data?.me?.username}
            </p>
            <Button
              type="button"
              className="bg-red-800 hover:bg-red-700 text-xs py-2 px-3"
              onClick={handleLogout}
            >
              {loggingOut ? "..." : "Logout"}
            </Button>
          </div>
        )}
      </Wrapper>
    </header>
  );
};

export default NavBar;
