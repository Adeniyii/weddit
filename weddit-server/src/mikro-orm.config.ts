import { MikroORM } from "@mikro-orm/core";
import path from "path";
import { __prod__ } from "./constants";
import { Post } from "./entities/Post";
import { User } from "./entities/User";

export default {
  migrations: {
    path: path.join(__dirname, "./migrations"), // path to the folder with migrations
    pathTs: path.join(__dirname, "../src/migrations"), // path to the folder with TS migrations (if used, we should put path to compiled files in `path`)
    glob: "!(*.d).{js,ts}", // how to match migration files (all .js and .ts files, but not .d.ts)
  },
  entities: [Post, User],
  dbName: "weddit",
  user: "postgres",
  password: "postgres",
  type: "postgresql",
  debug: !__prod__,
  allowGlobalContext: true, // Patch Error: Using global EntityManager instance methods for context specific actions is disallowed.
} as Parameters<typeof MikroORM.init>[0]; // Just some casual black magic ;) ..
// basically, `Parameters` is a typescript spell that returns the parameters of a function type.
// Parameters always returns an array, so we picked the first item.

