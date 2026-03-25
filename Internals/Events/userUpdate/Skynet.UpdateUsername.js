const BaseEvent = require("../BaseEvent.js");
const ConfigManager = require("../../../Modules/ConfigManager");

class UsernameUpdater extends BaseEvent {
	async requirements (oldUser, newUser) {
		if (oldUser.id === this.client.user.id || oldUser.bot || oldUser.tag === newUser.tag) return false;
		const isBlocked = await ConfigManager.isUserBlocked(oldUser.id);
		return !isBlocked;
	}

	async handle (oldUser, newUser) {
		let userDocument = await Users.findOne(oldUser.id);
		if (!userDocument) {
			try {
				userDocument = Users.new({ _id: oldUser.id });
				await userDocument.save();
			} catch (err) {
				if (!/duplicate key|1062/.test(err.message)) {
					throw err;
				}
			}
			userDocument = await Users.findOne(oldUser.id);
		}
		userDocument.query.set("username", newUser.tag);
		if (userDocument.past_names && !userDocument.past_names.includes(oldUser.username)) userDocument.query.push("past_names", oldUser.username);
		userDocument.save().catch(err => {
			logger.debug(`Failed to save userDocument ${oldUser.tag} for UpdateUsername.`, { usrid: oldUser.id }, err);
		});
	}
}

module.exports = UsernameUpdater;
