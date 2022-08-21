import { MikroORM } from "@mikro-orm/core";
import { ApolloServer } from "apollo-server-express";
import express from "express";
import { buildSchema } from "type-graphql";

import { __prod__ } from "./constants";
import microConfig from "./mikro-orm.config";
import { PostResolver } from "./resolvers/post";

const main = async () => {
  const orm = await MikroORM.init(microConfig);
  await orm.getMigrator().up(); // executes any pending migrations

  const app = express();

  // Set up the apollo server ontop of the express server,
  // and provide the schema definitions to the server by registering
  // our resolvers with type-graphQL's `buildSchema()` fn
  const apolloServer = new ApolloServer({
    schema: await buildSchema({
      resolvers: [PostResolver],
    }),
		context: () => ({em: orm.em}) // Provides an Entity manager instance to the resolvers on the context object
  });

	await apolloServer.start()

  apolloServer.applyMiddleware({ app }); // Defines graphql routes

  app.listen(4000, () => {
    console.log("server started on localhost:4000");
  });
};

main().catch((err) => {
  console.error(err);
});
