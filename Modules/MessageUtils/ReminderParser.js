const { SetReminder } = require("../Utils/");
const ObjectId = require("../../Database/ObjectID");

// Lazy-load ESM module
let parseDuration;
const loadParseDuration = async () => {
	if (!parseDuration) {
		const module = await import("parse-duration");
		parseDuration = module.default;
	}
	return parseDuration;
};

// Set a reminder from a remindme command suffix
module.exports = async (client, userDocument, userQueryDocument, str) => {
	const parse = await loadParseDuration();

	let timestr, remind;
	const args = str.split("|").trimAll();
	if (args.length === 2) {
		// Easy parse
		[remind, timestr] = args;
	} else {
		// Parse with assumption "remind me to ... in ..."
		timestr = str.substring(str.toLowerCase().lastIndexOf(" in ") + 4);
		remind = str.indexOf("to ") === 0 ? str.substring(3, str.toLowerCase().lastIndexOf(" in ")) : str.substring(0, str.toLowerCase().lastIndexOf(" in "));
	}
	const time = parse(timestr);
	if (time > 0 && remind) {
		userQueryDocument.push("reminders", {
			_id: ObjectId().toString(),
			name: remind,
			expiry_timestamp: Date.now() + time,
		});
		await SetReminder(client, userDocument, userDocument.reminders[userDocument.reminders.length - 1]);
		return time;
	} else {
		return "ERR";
	}
};
