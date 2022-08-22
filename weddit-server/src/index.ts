import { MikroORM } from "@mikro-orm/core";
import { ApolloServer } from "apollo-server-express";
import express from "express";
import { buildSchema } from "type-graphql";

import { __prod__ } from "./constants";
import microConfig from "./mikro-orm.config";
import { PostResolver } from "./resolvers/post";
import { UserResolver } from "./resolvers/user";
import session from "express-session";
import connectRedis from "connect-redis";
import { createClient } from "redis";
import { MyContext } from "./types";

// hack to fix the error: Property '<property>' does not exist on type 'Session & Partial<SessionData>
// when setting a new property on the req.session object
declare module "express-session" {
  export interface SessionData {
    [string: string]: any;
  }
}

const main = async () => {
  const orm = await MikroORM.init(microConfig);
  await orm.getMigrator().up(); // executes any pending migrations

  const app = express();

  // config to get cookie to be sent in the graphl playground
  const corsConfig = {
    credentials: true,
    origin: "https://studio.apollographql.com",
  };

  const RedisStore = connectRedis(session);
  const redisClient = createClient({ legacyMode: true });
  redisClient.connect().catch(console.error);

  // this session middleware registration should come before the apolloserver middleware registration
  app.use(
    session({
      name: "qid",
      store: new RedisStore({
        client: redisClient,
        disableTouch: true,
        disableTTL: true,
      }),
      saveUninitialized: false,
      secret: "keyboard cat",
      resave: false,
      cookie: {
        secure: __prod__,
        httpOnly: true,
        sameSite: "lax",
        maxAge: 1000 * 60 * 60 * 24 * 365 * 10, // a decade of our cookies
      },
    })
  );

  // Set up the apollo server ontop of the express server,
  // and provide the schema definitions to the server by registering
  // our resolvers with type-graphQL's `buildSchema()` fn
  const apolloServer = new ApolloServer({
    schema: await buildSchema({
      resolvers: [PostResolver, UserResolver],
    }),
    // Provides an Entity manager instance, and the req and res objects to the resolvers on the context object
    context: ({ req, res }): MyContext => ({ em: orm.em, req, res }),
  });

  await apolloServer.start();

  apolloServer.applyMiddleware({ app, cors: corsConfig }); // Defines graphql routes & connects the apollo server to our base express server

  app.listen(4000, () => {
    console.log("server started on localhost:4000");
  });
};

main().catch((err) => {
  console.error(err);
});
