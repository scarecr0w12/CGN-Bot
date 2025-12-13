const moment = require("moment");

module.exports = async ({ Constants: { Colors } }, { userDocument }, msg, commandData) => {
	const args = msg.suffix?.trim().split(/\s+/) || [];
	const action = args[0]?.toLowerCase() || "";

	// Initialize notes array if it doesn't exist
	if (!userDocument.notes) {
		userDocument.notes = [];
	}

	switch (action) {
		case "add":
		case "new":
		case "create": {
			const noteContent = args.slice(1).join(" ").trim();
			if (!noteContent) {
				return msg.sendInvalidUsage(commandData, "Please provide note content!", `Example: \`${commandData.name} add Remember to check the logs\``);
			}

			if (noteContent.length > 500) {
				return msg.send({
					embeds: [{
						color: Colors.SOFT_ERR,
						description: "Notes must be 500 characters or less.",
					}],
				});
			}

			if (userDocument.notes.length >= 50) {
				return msg.send({
					embeds: [{
						color: Colors.SOFT_ERR,
						description: "You've reached the maximum of 50 notes. Please delete some old notes first.",
					}],
				});
			}

			const note = {
				id: Date.now().toString(36),
				content: noteContent,
				created: new Date(),
			};

			userDocument.notes.push(note);
			await userDocument.save();

			msg.send({
				embeds: [{
					color: Colors.SUCCESS,
					title: "📝 Note Added",
					description: noteContent,
					footer: { text: `Note ID: ${note.id} • Total notes: ${userDocument.notes.length}` },
				}],
			});
			break;
		}

		case "delete":
		case "remove":
		case "del": {
			const noteId = args[1];
			if (!noteId) {
				return msg.sendInvalidUsage(commandData, "Please provide a note ID to delete!", `Use \`${commandData.name}\` to see your notes with their IDs.`);
			}

			const noteIndex = userDocument.notes.findIndex(n => n.id === noteId);
			if (noteIndex === -1) {
				return msg.send({
					embeds: [{
						color: Colors.SOFT_ERR,
						description: `Note with ID \`${noteId}\` not found.`,
					}],
				});
			}

			const deletedNote = userDocument.notes.splice(noteIndex, 1)[0];
			await userDocument.save();

			msg.send({
				embeds: [{
					color: Colors.SUCCESS,
					title: "🗑️ Note Deleted",
					description: deletedNote.content.length > 100 ? `${deletedNote.content.slice(0, 100)}...` : deletedNote.content,
				}],
			});
			break;
		}

		case "clear":
		case "deleteall": {
			if (userDocument.notes.length === 0) {
				return msg.send({
					embeds: [{
						color: Colors.SOFT_ERR,
						description: "You don't have any notes to clear.",
					}],
				});
			}

			const count = userDocument.notes.length;
			userDocument.notes = [];
			await userDocument.save();

			msg.send({
				embeds: [{
					color: Colors.SUCCESS,
					title: "🗑️ All Notes Cleared",
					description: `Deleted ${count} note${count === 1 ? "" : "s"}.`,
				}],
			});
			break;
		}

		case "view":
		case "show":
		case "get": {
			const noteId = args[1];
			if (!noteId) {
				return msg.sendInvalidUsage(commandData, "Please provide a note ID to view!", `Use \`${commandData.name}\` to see your notes with their IDs.`);
			}

			const note = userDocument.notes.find(n => n.id === noteId);
			if (!note) {
				return msg.send({
					embeds: [{
						color: Colors.SOFT_ERR,
						description: `Note with ID \`${noteId}\` not found.`,
					}],
				});
			}

			msg.send({
				embeds: [{
					color: Colors.INFO,
					title: `📝 Note ${note.id}`,
					description: note.content,
					footer: { text: `Created ${moment(note.created).fromNow()}` },
				}],
			});
			break;
		}

		case "search":
		case "find": {
			const searchQuery = args.slice(1).join(" ").toLowerCase();
			if (!searchQuery) {
				return msg.sendInvalidUsage(commandData, "Please provide a search term!");
			}

			const matches = userDocument.notes.filter(n =>
				n.content.toLowerCase().includes(searchQuery),
			);

			if (matches.length === 0) {
				return msg.send({
					embeds: [{
						color: Colors.SOFT_ERR,
						description: `No notes found matching "${searchQuery}".`,
					}],
				});
			}

			const description = matches.slice(0, 10).map(note => {
				const preview = note.content.length > 60 ? `${note.content.slice(0, 60)}...` : note.content;
				return `\`${note.id}\` ${preview}`;
			}).join("\n");

			msg.send({
				embeds: [{
					color: Colors.RESPONSE,
					title: `🔍 Search Results (${matches.length})`,
					description,
					footer: matches.length > 10 ? { text: `Showing 10 of ${matches.length} matches` } : undefined,
				}],
			});
			break;
		}

		case "help": {
			msg.send({
				embeds: [{
					color: Colors.INFO,
					title: "📝 Personal Notes",
					description: "Save and manage personal notes that only you can see.",
					fields: [
						{
							name: "Commands",
							value: [
								`\`${commandData.name}\` - View all your notes`,
								`\`${commandData.name} add <content>\` - Add a new note`,
								`\`${commandData.name} view <id>\` - View a specific note`,
								`\`${commandData.name} delete <id>\` - Delete a note`,
								`\`${commandData.name} search <term>\` - Search your notes`,
								`\`${commandData.name} clear\` - Delete all notes`,
							].join("\n"),
						},
					],
					footer: { text: "Notes are private and stored with your account" },
				}],
			});
			break;
		}

		default: {
			// List all notes
			if (userDocument.notes.length === 0) {
				return msg.send({
					embeds: [{
						color: Colors.INFO,
						title: "📝 Your Notes",
						description: `You don't have any notes yet.\n\nUse \`${commandData.name} add <content>\` to create your first note!`,
					}],
				});
			}

			// Sort by most recent first
			const sortedNotes = [...userDocument.notes].sort((a, b) => new Date(b.created) - new Date(a.created));

			const description = sortedNotes.slice(0, 15).map(note => {
				const preview = note.content.length > 50 ? `${note.content.slice(0, 50)}...` : note.content;
				const age = moment(note.created).fromNow();
				return `\`${note.id}\` ${preview} *(${age})*`;
			}).join("\n");

			msg.send({
				embeds: [{
					color: Colors.RESPONSE,
					title: `📝 Your Notes (${userDocument.notes.length})`,
					description,
					footer: userDocument.notes.length > 15 ?
						{ text: `Showing 15 of ${userDocument.notes.length} • Use "${commandData.name} view <id>" to see full note` } :
						{ text: `Use "${commandData.name} view <id>" to see full note` },
				}],
			});
		}
	}
};
