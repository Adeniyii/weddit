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
- Initialize express app
- create an apollo server instance using `const apolloServer = new ApolloServer({...options})`
- The ApolloServer constructor requires two parameters: your schema definition and your set of resolvers.
- start the apollo server using `await apolloServer.start()`
- Wrap the express server with the apolloServer to define the graphQL routes on the server.
- start listening on a port.

### GraphQl & typeGraphQL stuff

- Hard to document the steps as the setup flow is a bit fragmented. Check code for guiding comments. 👍🏿
- Essentially though, we want to define a schema for our graphQL/apllo server which defines the data structure for client-side queries.
- We define the base types of the schema by adding the `@ObjectType` type-graphQL decorator to the existing entity classes already decorated by MikroOrm. Adding the `@Field` decorator to a field makes the field able to be queried on the client. An entity class must have at least one file decorated with `@Field`, however you can hide fields from the graphQL schema by omitting the `@Field` decorator from it.
- The schema will also contain any resolvers decorated by the `@Query` or `@Mutation` decorators, and any Input types decorated by `@InputType`. Then to finally build the schema and make it available to the GraphQL/apollo server, we pass a call of type-graphql's `buildSchema` function (which accepts a config object) to the `schema` property of apolloServer's config object, then pass an array of resolver classes to the `resolver` property of `buildSchema`'s config object. `buildSchema` returns a promise, so we must await it.
- Next we want to define resolvers for each query -> action flow we want to make available to the graphQL clients on each entity in our schema. e.g we can define a `deletePost` resolver for the `Post` entity which allows a client to execute a delete operation on a Post record in our database. The resolvers are basically functions that execute some requsted side effect and returns the appropriate data to the client.

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

## Nuggets

LOL I randomly got this brilliant (if i say so myself ;D) analogy of reasoning about promises (I can imagine myself breaking it out in a mentoring lesson and changing my students' lives forever).

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
