import { MyContext } from "../types";
import { MiddlewareFn } from "type-graphql";

// Checks if there is a currently authenticated user, by checking the session oject for a userId
export const isAuth:MiddlewareFn<MyContext> = ({ context }, next) => {
	if (!context.req.session.userId){
		throw new Error("User not authenticated")
	}
	return next()
}
