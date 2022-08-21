---
title: "Building a Full-Stack Reddit Clone (Part 1)"
publishedAt: "2022-08-20"
summary: "How to build a fullstack application using Next.js, TypeScript, and GraphQL."
image: "/static/images/bg-apple-1.jpg"
---

This is a multi-part series on how to build an "appropriately complex" full-stack web application using modern tooling.
Experience with **[React](https://www.react.org)**, and [Typescript](pl) would be optimal, but you'll be able to follow along fine with passable knowledge of both.

There are 2 parts to this tutorial:

1. Server
2. Client

We'll be focussing on the **server** portion in this tutorial.

To get started, you can initialize a git repository if you'd like to open-source your project,
I have an article on [getting started with git](pl), that would get you sorted.

Once that's done (or not- no worries), we'll initialize a npm project. This creates a `package.json` file in our project.

Stoooooooooooooooooop - this is not maintainable

> from here on out I'm treating this as a scratchpad, I'll construct an article from it later. Cool

## Steps

- Create `weddit-server` directory.
- `npm init -y` - initializes npm project with default config.
- `yarn add -D @types/node typescript` - installs typescript and node type-definitions
- `npx tsconfig.json` - initializes boilerplate typescript config for node. (select `node` in the prompt)
- add `"watch": "tsc -w"` to "scripts" in `package.json`.
- Run `yarn watch` in terminal - This watches the `src` folder and spits out a `dist` folder with transpiled javascript files from `src`.
  So whenever a change is made to a ts file in `src`, the changes are reflected in a corresponding js file in `dist`.
- add `"start": "node dist/index.js"` to "scripts" in `package.json`. - A command to execute the generated `index.js` file on demand
- setup postgresql on local machine and start the postgresql service
- setup mikroorm using `yarn add @mikro-orm/core @mikro-orm/postgresql @mikro-orm/migrations @mikro-orm/cli pg`
- create `weddit` database

---

- Initialize mikro-orm client with config options. **Bonus**: used some black magic to activated types from the imported config.
- create our fist entity `Posts` but not storing in the database yet
- configure our mikro-orm cli so we can create our entity tables
- create our first migration
- adjust types, and create a second migration
- what are migrations? - [Answer from prisma](https://www.prisma.io/dataguide/types/relational/what-are-database-migrations)
- programmatically execute migrations in code using `await orm.getMigrator().up();` after initializing MikroOrm instance
- check for pending migrations `npx micro-orm migration:pending` (should be empty) and executed migrations `npx micro-orm migration:list` (should contain at least 1 migration)

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
