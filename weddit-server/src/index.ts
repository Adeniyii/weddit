import { MikroORM } from "@mikro-orm/core";
// import { EntityManager } from "@mikro-orm/postgresql";
import { __prod__ } from "./constants";
// import { Post } from "./entities/Post";
import microConfig from "./mikro-orm.config";

/**
 * Initialize mikrorm instance with config options.
 *
 * Debug prints executed queries to the console, we only want this feature in development though
 *
 * Entities is an array of all our database tables
 */
const main = async () => {
  const orm = await MikroORM.init(microConfig);
	await orm.getMigrator().up(); // executes any pending migrations
  // Using global EntityManager (orm.em) instance methods for context specific actions is disallowed,
	// So use this driver specific version instead of using the global orm.em directly.
  /* const em = orm.em as EntityManager;
	const posts = await em.find(Post, {});
	*/

  // This only creates a post object, but does not update the database.
  /* const post = em.create(Post, { title: "First post" }); */

	// think of persist() as making the entity manager aware of the new entity/object
	// and think of flush() as inserting all subscribed instances to the database finally
	// persistAndFlush() combines both.
  /* await em.persistAndFlush(post);
	await orm.close(true) */
};

main().catch((err)=> {
	console.error(err);
});
