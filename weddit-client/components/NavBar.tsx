import { useLogoutMutation, useMeQuery } from "generated/graphql";
import Link from "next/link";
import React from "react";
import { isServer } from "utils/isServer";
import Button from "./Button";
import Wrapper from "./Wrapper";

const NavBar = () => {
  const [{fetching: loggingOut}, logout] = useLogoutMutation()
  const [{ data, fetching }] = useMeQuery({
    pause: isServer()
  });

  const handleLogout = () => {
    logout({})
  }

  let body;
  if (fetching || isServer()){
    body = <p className="ml-3 text-green-800 font-bold">...</p>;
  }else if (!data?.me){
    body = (
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
    );
  } else {
    body = (
      <div className="flex items-center">
        <p className="mr-3 text-yellow-900 font-bold">{data?.me?.username}</p>
        <Button
          type="button"
          className="bg-red-800 hover:bg-red-700 text-xs py-2 px-3"
          onClick={handleLogout}
        >
          {loggingOut ? "..." : "Logout"}
        </Button>
      </div>
    );
  }

  return (
    <header className="sticky top-0 left-0 w-full py-3 bg-gray-400">
      <Wrapper className="flex items-center">
        <Link href="/" passHref>
          <a className="p-3 text-green-900 font-bold mr-auto">Weddit</a>
        </Link>
        {body}
      </Wrapper>
    </header>
  );
};

export default NavBar;
