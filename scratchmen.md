# Scratch pad

## Steps

### Initial config stuff

installations and postgreSQL setup

- Create `weddit-server` directory.
- `npm init -y` - initializes npm project with default config.
- `yarn add -D @types/node typescript` - installs typescript and node type-definitions
- `npx tsconfig.json` - initializes boilerplate typescript config for node. (select `node` in the prompt)
- add `"watch": "tsc -w"` to "scripts" in `package.json`.
- Run `yarn watch` in terminal - This watches the `src` folder and spits out a `dist` folder with transpiled javascript files from `src`.
  So whenever a change is made to a ts file in `src`, the changes are reflected in a corresponding js file in `dist`.
- add `"start": "node dist/index.js"` to "scripts" in `package.json`. - A command to execute the generated `index.js` file on demand
- setup postgresql on local machine and start the postgresql service
- create `weddit` database on local db

---

### MicroOrm setup stuff

- install & setup mikroorm and deps using `yarn add @mikro-orm/core @mikro-orm/postgresql @mikro-orm/migrations @mikro-orm/cli pg`
- Initialize mikro-orm client with config options. **Bonus**: used some black magic to match types from the imported MikroOrm config with the `MikroOrm.init()` function.
- create our fist entity `Posts` but not storing in the database yet.
- configure our mikro-orm cli so we can create our entity tables - add a `migrations` property to the MikroOrm config object, which tells the cli where to find the migrations, and which file patterns to match.
- create our first migration - `npx mikro-orm migration:create`
- what are migrations? - [Answer from prisma](https://www.prisma.io/dataguide/types/relational/what-are-database-migrations)
- programmatically execute migrations in code using `await orm.getMigrator().up();` after initializing the MikroOrm instance.
- check for pending migrations `npx micro-orm migration:pending` (should be empty) and executed migrations `npx micro-orm migration:list` (should contain at least 1 migration)
- if an error occurs, ensure your database server is running, and your connection details are correct. Also ensure you have created a database to connect to and included it's name in the MikroOrm config object

### Server setup stuff

- Install express, apollo, and deps - `yarn add express apollo-server-express graphql type-graphql class-validator`
- Initialize an express app
- create a new ApolloServer instance with a config object
- The ApolloServer constructor requires at least one parameter: your schema definition.
- start the apollo server
- Wrap the express server with the apolloServer to define the graphQL routes on the server.
- start listening on a port using the express server.

```ts
//...
const app = express();

const apolloServer = new ApolloServer({
  schema: await buildSchema({
    resolvers: [PostResolver, UserResolver],
  }),
  // Provides an Entity manager instance, and the req and res objects to the resolvers on the context object
  context: ({ req, res }): MyContext => ({ em: orm.em, req, res }),
});

await apolloServer.start();

apolloServer.applyMiddleware({ app });
//...
app.listen(4000, () => {
  console.log("server started on localhost:4000");
});
```

### GraphQl & typeGraphQL stuff

- Hard to document the steps as the setup flow is a bit fragmented. Check code for guiding comments. 👍🏿
- Essentially though, we want to define a schema for our graphQL/apllo server which defines the data structure for client-side queries.
- We define the base types of the schema by adding the `@ObjectType` type-graphQL decorator to the existing entity classes already decorated by MikroOrm. Adding the `@Field` decorator to a field makes the field able to be queried on the client. An entity class must have at least one file decorated with `@Field`, however you can hide fields from the graphQL schema by omitting the `@Field` decorator from it.
- The schema will also contain any resolvers decorated by the `@Query` or `@Mutation` decorators, and any Input types decorated by `@InputType`. Then to finally build the schema and make it available to the GraphQL/apollo server, we pass a call of type-graphql's `buildSchema` function (which accepts a config object) to the `schema` property of apolloServer's config object, then pass an array of resolver classes to the `resolver` property of `buildSchema`'s config object. `buildSchema` returns a promise, so we must await it.
- Next we want to define resolvers for each query -> action flow we want to make available to the graphQL clients on each entity in our schema. e.g we can define a `deletePost` resolver for the `Post` entity which allows a client to execute a delete operation on a Post record in our database. The resolvers are basically functions that execute some requsted side effect and returns the appropriate data to the client.

### Setting up sessions, redis, cookies

- Install and configure redis, express-session, and connect-redis to setup sessions using a redis database as our storage option. Redis is optimal for sessions because it's **FAST**.
- import and configure the session store and redis using the following:

```ts
// ...
import session from "express-session";
import connectRedis from "connect-redis";
import { createClient } from "redis";

const RedisStore = connectRedis(session);
const redisClient = createClient({ legacyMode: true });
redisClient.connect().catch(console.error);
//...
```

- finally, we register, and configure the session middleware with the express app.
- and we add the `RedisStore` as the target storage option for the generated sessions.

```ts
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
```

### Client stuff

- Setup next.js and tailwind as the client stack for the frontend
- Setup URQL client for making graphql requests to our apollo server

```tsx
import { Provider, createClient } from "urql";

const client = createClient({
  url: "http://localhost:4000/graphql",
  fetchOptions: {credentials: "include"},
  // including `credentials` here is mandatory, to enable cookies to get sent along with
  // a mutation/query request.
)}
```

- then wrap the app in an urql provider, which makes the inititlized urql client available to the entire app.

```tsx
function MyApp({ Component, pageProps }: AppProps) {
  return (
    <Provider value={client}>
      <Component {...pageProps} />
    </Provider>
  );
}
```

- Next we want to also setup graphql-code-generator which is insanely useful, and does basically everything you can think of from generating response object types for a graphql query/mutation, generating gql DocumentNode types for use when implementing a normalized cache, and it does all this through the cli, which picks up .graphql documents in a specified location, then makes a request to our graphql server to get all the type information of our Objects, Queries, Mutations, InputTypes, etc, then spits all that info into a specified file from which we can then import types/queries as we need them. Read [here](https://www.graphql-code-generator.com/docs/guides/react) for more info on setup and guides.

- next we implement the login and register pages, and navbar too, simple stuff.

### Caching (Part of the client, but deserves it's own sub-section)

- Finally we get to caching (the fun stuff)
- URQL uses a document cache by default which is a basic caching paradigm where unique keys are generated for every unique query, and stored in a memory cache with the value as the result of the query. Whenever an identical request is made, the result of the previously cached query is returned instead of making a network request to re-fetch the data. This behaviour depends on the request policy being used, but the default is to return from the cache unless the key doesn't exist. This paradigm uses an agressive revalidation techinique to handle mutation to a data Entity already stored in the cache. It checks the `__typename` value for all entities contained in a mutation request, and if it flags an Entity type which currently exists in the cache, it proceeds to invaidate all the cache items with that entity. Read more [here](https://formidable.com/open-source/urql/docs/basics/document-caching/)

- A normalized cache is essentially the re-normalization of our de-normalized query documents, URQL does this by querying the graphql server using the `__typename` field of the entities, and optionally an `id` field, to introspect the shape of the de-normalized entities, then using the result of that to build up a relational database of Entities/Tables of our data in cache memory.
- For our apps normalized caches can enable more sophisticated use-cases, where different API requests update data in other parts of the app and automatically update data in our cache as we query our GraphQL API. Normalized caches can essentially keep the UI of our applications up-to-date when relational data is detected across multiple queries, mutations, or subscriptions. Read more [here](https://formidable.com/open-source/urql/docs/graphcache/normalized-caching/)

### Setting up SSR selectively for better SEO on public pages

- Nothing too specific to talk about here.
- We want SSR enabled only on a few pages, so we use a higher order function `withUrqlClient` from `next-urql` with the `ssr` option enabled to wrap  pages we want to enable ssr for.

```ts
import { withUrqlClient } from 'next-urql';
//...
export default withUrqlClient(createURQLClient, { ssr: true })(Home)
```

- `createURQLClient` is our URQL client provider, with configuration for our caching mechanisms, etc.

## Headaches

- Typescript complains when you try to create a record that has default fields e.g createdAt.

  - Fix **[MicroOrm docs](https://mikro-orm.io/docs/property-validation#properties-with-default-value)**

- Setting up postgreSQL to work with MikroOrm

  - Fix:
  - login to psql as target user, then alter the user's password: `alter user postgres with encrypted password 'postgres';`
  - edit `pg_hba.conf` file and change target user's login method to `md5`
  - restart postgresql service: `sudo /etc/init.d/postgresql restart`
  - check if this works: `psql -U postgres <databasename>`
  - then set correct password, and user in the MikroOrm init config object.

- Currently type-graphql supports only graphql with major version 15 and minor version above (or equal) to 5.

  - Fix: downgrade graphql to v^15.3.0

- error: Property `<property>` does not exist on type `Session & Partial<SessionData>` when setting a new property on the req.session object

  - fix `declare module "express-session" { export interface SessionData { userId: number; } }`

- Working with cors, and allowing specific client origins to include credentials in their request to our apollo server
  - Pretty easy fix, just specify an array of allowed origins, and set `credentials: true` on the cors property of the apolloserver middleware config

- When dealing with hydration errors in NextJS, before trying convoluted methods with useEffects etc, first try to match the initial UI coming from the server with the UI that gets rendered once the page is loaded. The first instinct is always to tinker with what the UI is displaying after rendering, but more often than not, the easiest fix is to change the base state of the UI coming from the server, to match the UI displayed when the page first renders. If all fails, then the final fix can be to use a useEffect to execute the UI-changing action.

```ts
// config to get cookie to be sent in the graphl playground
// the default for origin is "*".
const corsConfig = {
  credentials: true,
  origin: ["https://studio.apollographql.com", "http://localhost:3000"],
};
//...
apolloServer.applyMiddleware({ app, cors: corsConfig });
```

## Nuggets

LOL I randomly got this brilliant (if i say so myself ;D) analogy of reasoning about promises.

- So imagine you want some food, you have two options in this imaginary world - ready-made, or still-cooking. If i asked for a meal that was already ready-made e.g a bar of chocolate, I would get it as soon as I asked for it.
- Alternatively, what would happen if I asked for a meal that needed some time to get prepared? (Say, some rice) I would have to wait. However, in this imaginary world, the pot of rice gets handed to you (assume the pot is using solar energy 🌞).
- Once this pot of rice is handed to you, you would have to wait for the meal to get ready, but there are two possibilities waiting for you at the end of your wait John Snow, the rice would either `cook successfully`, or `the pot would run out of solar energy, and you can't eat rice`. One is a failing case, and the other is a passing case. You would then have corresponding actions for both scenarios:
  - If the rice does successfully get cooked, your action would be to lick your lips, grab a big spoon, and begin eati.. serving your meal.
  - If the pot runs out of power, and you end up with soggy rice, your action would be to dramatically fall to your knees, and curse the pot for being a hater.
- And there you have it, you have successfully modelled a promise mechanism. It consists of a request for a side-effect or data (in our case, rice), which gets returned not as ready-made rice, but as a promise of the rice to come (pot of cooking rice). Then you define `.catch` and `.then` callback methods on the promise - represented by the corresonding actions mentioned earlier - as resolutions to the outcome of the rice promise.
- Now what if we were throwing a party, and we placed a request to a porridge restaurant for a batch of porridges 😂. The restaurant then delivers a truck of porrridge promises (pots of porridges) to our party (The weeknd is on stage btw, performing, yet, secretly anticipating his porridge).
- We would have two main options for resolving the batch of porridge promises:
  - First, we could only wait for the first pot of porridge that gets resolved, then quickly execute our callback action for a successful resolution (getting the weeknd his porridge ASAP), while everyone else starves.
  - Secondly, we could await every pot of porridge to get resolved, and then serve everyone porridge at the same time (Share the gala, share the booze... - excerpt from a classic Naija song). Although this method might take more time than the first, it does provide us with all of the resolved promises.
- The first operation is represented using `Promise.any([Pot1, Pot2, Pot3])` then defining your corresponding action using `.then` or `.catch`.
  - There is also the option to use `Promise.race([Pot1,...])`. The difference between `.any` and `.race` is that: `.any` ignores any rejected promises, and only completes when one Promise of the batch of promises is resolved successfully, `.race` on the other hand returns the first successful or failed promise.
- The second operation is represented using `Promise.all([Pot1, Pot2, Pot3])` then defining your corresponding action using `.then` or `.catch`.
  - There is also the option to use `Promise.allSettled([Pot1,...])`. The difference between `.all` and `.allSettled` is that the former `fails fast` i.e, if one of the promises fails to resolve (One of the Pots runs out of energy), the Promise immediately rejects with the value of the error, and can be accessed with `.catch`, and no other values gets returned. `.allSettled` on the other hand returns a Promise which resolves to an array of the resolved and rejected objects. i.e we get back an array of objects of the form `{status: 'fufilled'|'rejected', value: 'Yummy Porridge!'}`

... TBC
