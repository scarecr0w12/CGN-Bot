module.exports = async ({ Constants: { Colors } }, documents, msg) => {
	msg.send({
		embeds: [{
			color: Colors.SUCCESS,
			description: `${msg.suffix && msg.suffix !== "" ? msg.suffix : "🙊"}`,
		}],
		allowedMentions: { parse: [] },
	});
};
