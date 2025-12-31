// Lazy-load ESM module
let parseDuration;
const loadParseDuration = async () => {
	if (!parseDuration) {
		const module = await import("parse-duration");
		parseDuration = module.default;
	}
	return parseDuration;
};

// Parses durations
module.exports = async string => {
	const parse = await loadParseDuration();
	let time, event;
	const args = string.split("|").trimAll();
	if (args.length === 2) {
		// Easy peasy lemon sqeezy
		[event, time] = args;
	} else {
		// Parse with assumption to "command to ... in ..."
		time = string.substring(string.toLowerCase().lastIndexOf(" in ") + 4);
		event = string.indexOf("to ") === 0 ? string.substring(3, string.toLowerCase.lastIndexOf(" in ")) : string.substring(0, string.toLowerCase().lastIndexOf(" in "));
	}
	const actualTime = parse(time);
	if (actualTime > 0 && event) {
		return {
			time: actualTime,
			event,
		};
	} else {
		return {
			time: null,
			event,
			error: "ERR",
		};
	}
};
