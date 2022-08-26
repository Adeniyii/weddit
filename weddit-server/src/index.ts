import { ApolloServer } from "apollo-server-express";
import express from "express";
import { buildSchema } from "type-graphql";

import { COOKIE_NAME, __prod__ } from "./constants";
import { PostResolver } from "./resolvers/post";
import { UserResolver } from "./resolvers/user";
import session from "express-session";
import connectRedis from "connect-redis";
import Redis from "ioredis"
import { MyContext } from "./types";
import {DataSource} from 'typeorm'
import { Post } from "./entities/Post";
import { User } from "./entities/User";
import path from "path";

// hack to fix the error: Property '<property>' does not exist on type 'Session & Partial<SessionData> when setting a new property on the req.session object
declare module "express-session" {
  export interface SessionData {
    [string: string]: any;
  }
}

const main = async () => {
  // Typeorm setup
  const conn = await new DataSource({
    entities: [Post, User],
    database: "weddit2",
    username: "postgres",
    password: "postgres",
    type: "postgres",
    synchronize: true, // creates tables automatically from new entities without having to run migrations like in mikroorm
    logging: true,
    migrations: [path.join(__dirname, "migrations/*.js")]
  }).initialize()

  // conn.runMigrations()

  const app = express();
  // to enable apollo playground to send cookies to this server
  // app.set('trust proxy', !__prod__)

  // config to get cookie to be sent in the graphl playground
  // the default for origin is "*".
  const corsConfig = {
    credentials: true,
    origin: ["https://studio.apollographql.com", "http://localhost:3000"],
  };

  const RedisStore = connectRedis(session);
  const redisClient = new Redis()
  redisClient.connect().catch(console.error);

  // this session middleware registration should come before the apolloserver middleware registration
  app.use(
    session({
      name: COOKIE_NAME,
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

  // Set up the apollo server on top of the express server,
  // and provide the schema definitions to the server by registering
  // our resolvers with type-graphQL's `buildSchema()` fn
  const apolloServer = new ApolloServer({
    schema: await buildSchema({
      resolvers: [PostResolver, UserResolver],
    }),
    // Provides an Entity manager instance, and the req and res objects to the resolvers on the context object
    context: ({ req, res }): MyContext => ({ req, res, redis: redisClient }),
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
