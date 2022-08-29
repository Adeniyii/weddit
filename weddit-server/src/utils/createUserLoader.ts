import DataLoader from "dataloader";
import { In } from "typeorm";
import { User } from "../entities/User";

export const createUserLoader = () => new DataLoader<number, User>(async (userIds) => {
	const users = await User.findBy({id: In(userIds as number[])})
	const userToIdMap: Record<number, User> = {}
	users.forEach(u => {
		userToIdMap[u.id] = u
	})

	return userIds.map(id => {
		return userToIdMap[id]
	})
})
