const ivm = require("isolated-vm");
const fs = require("fs-nextra");

// Run an extension (command or keyword) in the sandbox using isolated-vm
/* eslint-disable max-len, no-unused-vars*/
module.exports = async (bot, server, serverDocument, channel, extensionDocument, msg, suffix, keywordMatch) => {
	let extensionCode;
	try {
		extensionCode = await fs.readFile(`${__dirname}/../extensions/${extensionDocument.code_id}.gabext`, "utf8");
	} catch (err) {
		logger.warn(`Failed to load the extension code for ${extensionDocument.type} extension "${extensionDocument.name}"`, { svrid: server.id, extid: extensionDocument._id }, err);
	}
	if (extensionCode) {
		let isolate = null;
		try {
			// Create isolate with memory limit
			isolate = new ivm.Isolate({ memoryLimit: 128 });
			const context = await isolate.createContext();
			const jail = context.global;
			await jail.set("global", jail.derefInto());

			// Run the extension code
			await context.eval(extensionCode, { timeout: extensionDocument.timeout || 5000 });
		} catch (err) {
			logger.warn(`Failed to run ${extensionDocument.type} extension "${extensionDocument.name}"`, { svrid: server.id, chid: channel.id, extid: extensionDocument._id }, err);
		} finally {
			// Always clean up isolate resources
			if (isolate) isolate.dispose();
		}
	}
};
