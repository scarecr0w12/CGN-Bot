const { SHOP_ITEMS } = require("./shop");

const activeAuctions = new Map();

const AUCTION_DURATION = 5 * 60 * 1000; // 5 minutes
const MIN_BID_INCREMENT = 100;

module.exports = async ({ Constants: { Colors }, client }, { serverDocument, userDocument, userQueryDocument }, msg, commandData) => {
	if (!userDocument.economy) {
		userQueryDocument.set("economy", { wallet: 0, bank: 0, bank_capacity: 5000, inventory: [] });
	}

	const args = msg.suffix ? msg.suffix.split("|").map(a => a.trim()) : [];
	const subCommand = args[0]?.toLowerCase();

	// Show help or active auctions
	if (!subCommand || subCommand === "list") {
		const guildAuctions = Array.from(activeAuctions.entries())
			.filter(([, auction]) => auction.guildId === msg.guild.id)
			.map(([id, auction]) => ({ id, ...auction }));

		if (guildAuctions.length === 0) {
			return msg.send({
				embeds: [{
					color: Colors.INFO,
					title: "🔨 Auction House",
					description: "No active auctions in this server.",
					fields: [
						{
							name: "📝 Commands",
							value: `\`${msg.guild.commandPrefix}${commandData.name} start <item_id> | <starting_price>\` - Start an auction\n\`${msg.guild.commandPrefix}${commandData.name} bid <auction_id> | <amount>\` - Place a bid\n\`${msg.guild.commandPrefix}${commandData.name} list\` - View active auctions`,
							inline: false,
						},
					],
					footer: {
						text: "Auction items from your inventory!",
					},
				}],
			});
		}

		const fields = guildAuctions.map(auction => {
			const item = SHOP_ITEMS[auction.itemId] || { name: auction.itemId, emoji: "📦" };
			const timeLeft = Math.max(0, auction.endTime - Date.now());
			const minutes = Math.floor(timeLeft / 60000);
			const seconds = Math.floor((timeLeft % 60000) / 1000);

			return {
				name: `${item.emoji} ${item.name} (ID: ${auction.id.slice(-6)})`,
				value: `Current Bid: **${auction.currentBid.toLocaleString()}** coins\nSeller: <@${auction.sellerId}>\nHighest Bidder: ${auction.highestBidder ? `<@${auction.highestBidder}>` : "None"}\n⏰ Ends in: ${minutes}m ${seconds}s`,
				inline: true,
			};
		});

		return msg.send({
			embeds: [{
				color: Colors.INFO,
				title: "🔨 Active Auctions",
				fields,
				footer: {
					text: `Use ${msg.guild.commandPrefix}${commandData.name} bid <auction_id> | <amount> to bid`,
				},
			}],
		});
	}

	// Start an auction
	if (subCommand === "start") {
		if (args.length < 3) {
			return msg.send({
				embeds: [{
					color: Colors.SOFT_ERR,
					description: `Usage: \`${msg.guild.commandPrefix}${commandData.name} start <item_id> | <starting_price>\``,
				}],
			});
		}

		const itemId = args[1].toLowerCase().replace(/ /g, "_");
		const startingPrice = parseInt(args[2], 10);

		if (isNaN(startingPrice) || startingPrice < 100) {
			return msg.send({
				embeds: [{
					color: Colors.SOFT_ERR,
					description: "Starting price must be at least **100** coins!",
				}],
			});
		}

		// Check if user has the item
		const inventory = userDocument.economy?.inventory || [];
		const itemIndex = inventory.findIndex(i => i.item_id === itemId);

		if (itemIndex === -1) {
			return msg.send({
				embeds: [{
					color: Colors.SOFT_ERR,
					description: `You don't have **${itemId}** in your inventory!`,
				}],
			});
		}

		const item = SHOP_ITEMS[itemId] || { name: itemId, emoji: "📦" };

		// Remove item from inventory
		if (inventory[itemIndex].quantity > 1) {
			userQueryDocument.inc(`economy.inventory.${itemIndex}.quantity`, -1);
		} else {
			userQueryDocument.pull("economy.inventory", { item_id: itemId });
		}

		// Create auction
		const auctionId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
		const auction = {
			id: auctionId,
			guildId: msg.guild.id,
			channelId: msg.channel.id,
			sellerId: msg.author.id,
			itemId,
			startingPrice,
			currentBid: startingPrice,
			highestBidder: null,
			endTime: Date.now() + AUCTION_DURATION,
		};

		activeAuctions.set(auctionId, auction);

		// Set timer to end auction
		setTimeout(() => endAuction(client, auctionId), AUCTION_DURATION);

		return msg.send({
			embeds: [{
				color: Colors.SUCCESS,
				title: "🔨 Auction Started!",
				description: `${item.emoji} **${item.name}** is now up for auction!`,
				fields: [
					{
						name: "💰 Starting Price",
						value: `${startingPrice.toLocaleString()} coins`,
						inline: true,
					},
					{
						name: "⏰ Duration",
						value: "5 minutes",
						inline: true,
					},
					{
						name: "🆔 Auction ID",
						value: `\`${auctionId.slice(-6)}\``,
						inline: true,
					},
				],
				footer: {
					text: `Use ${msg.guild.commandPrefix}${commandData.name} bid ${auctionId.slice(-6)} | <amount> to bid`,
				},
			}],
		});
	}

	// Place a bid
	if (subCommand === "bid") {
		if (args.length < 3) {
			return msg.send({
				embeds: [{
					color: Colors.SOFT_ERR,
					description: `Usage: \`${msg.guild.commandPrefix}${commandData.name} bid <auction_id> | <amount>\``,
				}],
			});
		}

		const auctionIdPartial = args[1].toLowerCase();
		const bidAmount = parseInt(args[2], 10);

		// Find auction by partial ID
		const auctionEntry = Array.from(activeAuctions.entries())
			.find(([id]) => id.endsWith(auctionIdPartial) || id === auctionIdPartial);

		if (!auctionEntry) {
			return msg.send({
				embeds: [{
					color: Colors.SOFT_ERR,
					description: "Auction not found! Use `list` to see active auctions.",
				}],
			});
		}

		const [auctionId, auction] = auctionEntry;

		if (auction.guildId !== msg.guild.id) {
			return msg.send({
				embeds: [{
					color: Colors.SOFT_ERR,
					description: "This auction is not in this server!",
				}],
			});
		}

		if (auction.sellerId === msg.author.id) {
			return msg.send({
				embeds: [{
					color: Colors.SOFT_ERR,
					description: "You can't bid on your own auction!",
				}],
			});
		}

		if (isNaN(bidAmount) || bidAmount < auction.currentBid + MIN_BID_INCREMENT) {
			return msg.send({
				embeds: [{
					color: Colors.SOFT_ERR,
					description: `Your bid must be at least **${(auction.currentBid + MIN_BID_INCREMENT).toLocaleString()}** coins!`,
				}],
			});
		}

		const wallet = userDocument.economy?.wallet || 0;
		if (bidAmount > wallet) {
			return msg.send({
				embeds: [{
					color: Colors.SOFT_ERR,
					description: `You don't have enough coins!\n\n💵 Wallet: **${wallet.toLocaleString()}** coins`,
				}],
			});
		}

		// Refund previous bidder
		if (auction.highestBidder) {
			const prevBidderDoc = await Users.findOne(auction.highestBidder);
			if (prevBidderDoc) {
				const prevBidderQuery = prevBidderDoc.query;
				prevBidderQuery.inc("economy.wallet", auction.currentBid);
				await prevBidderDoc.save();
			}
		}

		// Deduct bid from new bidder
		userQueryDocument.inc("economy.wallet", -bidAmount);

		// Update auction
		auction.currentBid = bidAmount;
		auction.highestBidder = msg.author.id;
		activeAuctions.set(auctionId, auction);

		const item = SHOP_ITEMS[auction.itemId] || { name: auction.itemId, emoji: "📦" };
		const timeLeft = Math.max(0, auction.endTime - Date.now());
		const minutes = Math.floor(timeLeft / 60000);
		const seconds = Math.floor((timeLeft % 60000) / 1000);

		return msg.send({
			embeds: [{
				color: Colors.SUCCESS,
				title: "🔨 Bid Placed!",
				description: `You are now the highest bidder on ${item.emoji} **${item.name}**!`,
				fields: [
					{
						name: "💰 Your Bid",
						value: `${bidAmount.toLocaleString()} coins`,
						inline: true,
					},
					{
						name: "⏰ Time Remaining",
						value: `${minutes}m ${seconds}s`,
						inline: true,
					},
				],
			}],
		});
	}

	// Cancel auction (seller only)
	if (subCommand === "cancel") {
		const auctionIdPartial = args[1]?.toLowerCase();

		if (!auctionIdPartial) {
			return msg.send({
				embeds: [{
					color: Colors.SOFT_ERR,
					description: `Usage: \`${msg.guild.commandPrefix}${commandData.name} cancel <auction_id>\``,
				}],
			});
		}

		const auctionEntry = Array.from(activeAuctions.entries())
			.find(([id, a]) => (id.endsWith(auctionIdPartial) || id === auctionIdPartial) && a.sellerId === msg.author.id);

		if (!auctionEntry) {
			return msg.send({
				embeds: [{
					color: Colors.SOFT_ERR,
					description: "Auction not found or you're not the seller!",
				}],
			});
		}

		const [auctionId, auction] = auctionEntry;

		// Refund highest bidder if exists
		if (auction.highestBidder) {
			const bidderDoc = await Users.findOne(auction.highestBidder);
			if (bidderDoc) {
				const bidderQuery = bidderDoc.query;
				bidderQuery.inc("economy.wallet", auction.currentBid);
				await bidderDoc.save();
			}
		}

		// Return item to seller
		const inventory = userDocument.economy?.inventory || [];
		const existingItem = inventory.find(i => i.item_id === auction.itemId);

		if (existingItem) {
			const itemIndex = inventory.findIndex(i => i.item_id === auction.itemId);
			userQueryDocument.inc(`economy.inventory.${itemIndex}.quantity`, 1);
		} else {
			userQueryDocument.push("economy.inventory", {
				_id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
				item_id: auction.itemId,
				quantity: 1,
				acquired_at: new Date(),
			});
		}

		activeAuctions.delete(auctionId);

		const item = SHOP_ITEMS[auction.itemId] || { name: auction.itemId, emoji: "📦" };

		return msg.send({
			embeds: [{
				color: Colors.SUCCESS,
				title: "🔨 Auction Cancelled",
				description: `Your auction for ${item.emoji} **${item.name}** has been cancelled.`,
			}],
		});
	}

	msg.send({
		embeds: [{
			color: Colors.SOFT_ERR,
			description: `Unknown command. Use \`${msg.guild.commandPrefix}${commandData.name}\` for help.`,
		}],
	});
};

async function endAuction (client, auctionId) {
	const auction = activeAuctions.get(auctionId);
	if (!auction) return;

	activeAuctions.delete(auctionId);

	const item = SHOP_ITEMS[auction.itemId] || { name: auction.itemId, emoji: "📦" };

	try {
		const channel = await client.channels.fetch(auction.channelId).catch(() => null);
		if (!channel) return;

		if (auction.highestBidder) {
			// Transfer coins to seller
			const sellerDoc = await Users.findOne(auction.sellerId);
			if (sellerDoc) {
				const sellerQuery = sellerDoc.query;
				sellerQuery.inc("economy.wallet", auction.currentBid);
				sellerQuery.inc("economy.total_earned", auction.currentBid);
				await sellerDoc.save();
			}

			// Give item to winner
			const winnerDoc = await Users.findOne(auction.highestBidder);
			if (winnerDoc) {
				const winnerQuery = winnerDoc.query;
				const inventory = winnerDoc.economy?.inventory || [];
				const existingItem = inventory.find(i => i.item_id === auction.itemId);

				if (existingItem) {
					const itemIndex = inventory.findIndex(i => i.item_id === auction.itemId);
					winnerQuery.inc(`economy.inventory.${itemIndex}.quantity`, 1);
				} else {
					winnerQuery.push("economy.inventory", {
						_id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
						item_id: auction.itemId,
						quantity: 1,
						acquired_at: new Date(),
					});
				}
				await winnerDoc.save();
			}

			channel.send({
				embeds: [{
					color: 0x00FF00,
					title: "🔨 Auction Ended!",
					description: `${item.emoji} **${item.name}** sold to <@${auction.highestBidder}> for **${auction.currentBid.toLocaleString()}** coins!`,
					fields: [
						{
							name: "👤 Seller",
							value: `<@${auction.sellerId}>`,
							inline: true,
						},
						{
							name: "🏆 Winner",
							value: `<@${auction.highestBidder}>`,
							inline: true,
						},
						{
							name: "💰 Final Price",
							value: `${auction.currentBid.toLocaleString()} coins`,
							inline: true,
						},
					],
				}],
			});
		} else {
			// Return item to seller
			const sellerDoc = await Users.findOne(auction.sellerId);
			if (sellerDoc) {
				const sellerQuery = sellerDoc.query;
				const inventory = sellerDoc.economy?.inventory || [];
				const existingItem = inventory.find(i => i.item_id === auction.itemId);

				if (existingItem) {
					const itemIndex = inventory.findIndex(i => i.item_id === auction.itemId);
					sellerQuery.inc(`economy.inventory.${itemIndex}.quantity`, 1);
				} else {
					sellerQuery.push("economy.inventory", {
						_id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
						item_id: auction.itemId,
						quantity: 1,
						acquired_at: new Date(),
					});
				}
				await sellerDoc.save();
			}

			channel.send({
				embeds: [{
					color: 0xFF6B6B,
					title: "🔨 Auction Ended - No Bids",
					description: `${item.emoji} **${item.name}** received no bids and has been returned to <@${auction.sellerId}>.`,
				}],
			});
		}
	} catch (error) {
		logger.error("Error ending auction:", error);
	}
}
