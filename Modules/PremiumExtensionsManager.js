const VoteRewardsManager = require("./VoteRewardsManager");

const getMarketplaceSettings = async () => {
	const siteSettings = await SiteSettings.findOne("main");
	return siteSettings?.premium_extensions || {};
};

const getOrCreateUser = async userId => {
	let user = await Users.findOne(userId);
	if (!user) {
		user = Users.new({ _id: userId });
		await user.save();
		user = await Users.findOne(userId);
	}
	return user;
};

const getOrCreateEarnings = user => user.extension_earnings || {
	balance: 0,
	lifetime_earned: 0,
	total_withdrawn: 0,
};

const setPremiumStatus = async (extensionId, ownerId, pricePoints, isPremium) => {
	const extension = await Database.Gallery.findOne(extensionId);
	if (!extension) throw new Error("Extension not found");
	if (extension.owner_id !== ownerId) throw new Error("You do not own this extension");

	const marketplaceSettings = await getMarketplaceSettings();
	const minPrice = marketplaceSettings.min_price_points;
	const maxPrice = marketplaceSettings.max_price_points;

	if (isPremium) {
		if (typeof pricePoints !== "number" || Number.isNaN(pricePoints) || pricePoints <= 0) {
			throw new Error("Invalid pricePoints");
		}
		if (typeof minPrice === "number" && pricePoints < minPrice) {
			throw new Error(`Minimum price is ${minPrice} points`);
		}
		if (typeof maxPrice === "number" && pricePoints > maxPrice) {
			throw new Error(`Maximum price is ${maxPrice} points`);
		}
	}

	const currentPremium = extension.premium || {};
	let approved = currentPremium.approved === true;
	if (!isPremium) {
		approved = false;
	} else if (marketplaceSettings && marketplaceSettings.approval_required === true) {
		if (typeof currentPremium.price_points !== "number" || currentPremium.price_points !== pricePoints) {
			approved = false;
		}
	} else {
		approved = true;
	}
	let revenueShare = currentPremium.revenue_share;
	if (typeof revenueShare !== "number" || Number.isNaN(revenueShare) || revenueShare < 0 || revenueShare > 100) {
		revenueShare = marketplaceSettings.default_revenue_share;
	}
	if (typeof revenueShare !== "number" || Number.isNaN(revenueShare) || revenueShare < 0 || revenueShare > 100) {
		revenueShare = 70;
	}
	extension.query.set("premium", {
		...currentPremium,
		is_premium: Boolean(isPremium),
		approved,
		price_points: isPremium ? pricePoints : 0,
		revenue_share: revenueShare,
	});
	await extension.save();

	return { success: true };
};

const purchaseExtension = async (buyerUserId, extensionId) => VoteRewardsManager.redeemForExtension(buyerUserId, extensionId);

const getExtensionEarnings = async userId => {
	const user = await getOrCreateUser(userId);
	return getOrCreateEarnings(user);
};

const withdrawEarnings = async (userId, amount) => {
	if (typeof amount !== "number" || Number.isNaN(amount) || amount <= 0) {
		throw new Error("Amount must be positive");
	}

	const user = await getOrCreateUser(userId);
	const earnings = getOrCreateEarnings(user);

	const currentBalance = earnings.balance || 0;
	if (currentBalance < amount) {
		throw new Error("Insufficient extension earnings balance");
	}

	const voteRewards = user.vote_rewards || {
		balance: 0,
		lifetime_earned: 0,
		lifetime_spent: 0,
		total_votes: 0,
	};

	user.query.set("extension_earnings", {
		...earnings,
		balance: currentBalance - amount,
		total_withdrawn: (earnings.total_withdrawn || 0) + amount,
	});

	user.query.set("vote_rewards", {
		...voteRewards,
		balance: (voteRewards.balance || 0) + amount,
	});

	await user.save();

	return {
		success: true,
		withdrawn: amount,
		extensionEarningsBalance: currentBalance - amount,
		voteRewardsBalance: (voteRewards.balance || 0) + amount,
	};
};

const getUserExtensions = async userId => {
	const extensions = await Database.Gallery.find({ owner_id: userId }).exec();
	return (extensions || []).map(ext => ({
		id: ext._id,
		name: ext.name,
		premium: ext.premium || { is_premium: false, price_points: 0, purchases: 0, developer_earnings: 0, lifetime_revenue: 0 },
	}));
};

const getExtensionSales = async (ownerId, extensionId, limit = 100) => {
	const extension = await Database.Gallery.findOne(extensionId);
	if (!extension) throw new Error("Extension not found");
	if (extension.owner_id !== ownerId) throw new Error("You do not own this extension");

	const history = Array.isArray(extension.purchase_history) ? extension.purchase_history : [];
	const sorted = history
		.slice()
		.sort((a, b) => {
			const at = a?.purchased_at ? new Date(a.purchased_at).getTime() : 0;
			const bt = b?.purchased_at ? new Date(b.purchased_at).getTime() : 0;
			return bt - at;
		});

	return {
		extensionId: extension._id,
		extensionName: extension.name,
		purchases: extension.premium?.purchases || 0,
		revenueShare: extension.premium?.revenue_share,
		pricePoints: extension.premium?.price_points || 0,
		history: sorted.slice(0, limit),
	};
};

const getExtensionSalesAdmin = async (extensionId, limit = 100) => {
	const extension = await Database.Gallery.findOne(extensionId);
	if (!extension) throw new Error("Extension not found");

	const history = Array.isArray(extension.purchase_history) ? extension.purchase_history : [];
	const sorted = history
		.slice()
		.sort((a, b) => {
			const at = a?.purchased_at ? new Date(a.purchased_at).getTime() : 0;
			const bt = b?.purchased_at ? new Date(b.purchased_at).getTime() : 0;
			return bt - at;
		});

	return {
		extensionId: extension._id,
		extensionName: extension.name,
		ownerId: extension.owner_id,
		isPremium: extension.premium?.is_premium === true,
		approved: extension.premium?.approved === true,
		purchases: extension.premium?.purchases || 0,
		revenueShare: extension.premium?.revenue_share,
		pricePoints: extension.premium?.price_points || 0,
		lifetimeRevenue: extension.premium?.lifetime_revenue || 0,
		history: sorted.slice(0, limit),
	};
};

const getMarketplaceStats = async ({ topLimit = 10 } = {}) => {
	const extensions = await Database.Gallery.find({ "premium.is_premium": true }).exec();
	let totalRevenue = 0;
	let totalPurchases = 0;

	const creatorTotals = new Map();

	(extensions || []).forEach(ext => {
		const purchases = ext.premium?.purchases || 0;
		const revenue = ext.premium?.lifetime_revenue || 0;
		totalPurchases += purchases;
		totalRevenue += revenue;

		const ownerId = ext.owner_id;
		if (!ownerId) return;
		const current = creatorTotals.get(ownerId) || {
			owner_id: ownerId,
			total_revenue: 0,
			total_purchases: 0,
			extensions_count: 0,
		};
		current.total_revenue += revenue;
		current.total_purchases += purchases;
		current.extensions_count += 1;
		creatorTotals.set(ownerId, current);
	});

	const normalizeExtension = ext => ({
		id: ext._id?.toString ? ext._id.toString() : ext._id,
		name: ext.name,
		owner_id: ext.owner_id,
		price_points: ext.premium?.price_points || 0,
		purchases: ext.premium?.purchases || 0,
		lifetime_revenue: ext.premium?.lifetime_revenue || 0,
	});

	const safeLimit = typeof topLimit === "number" && !Number.isNaN(topLimit) && topLimit > 0 ? topLimit : 10;
	const topExtensionsByPurchases = (extensions || [])
		.slice()
		.sort((a, b) => (b.premium?.purchases || 0) - (a.premium?.purchases || 0))
		.slice(0, safeLimit)
		.map(normalizeExtension);

	const topExtensionsByRevenue = (extensions || [])
		.slice()
		.sort((a, b) => (b.premium?.lifetime_revenue || 0) - (a.premium?.lifetime_revenue || 0))
		.slice(0, safeLimit)
		.map(normalizeExtension);

	const topCreatorsByRevenue = Array.from(creatorTotals.values())
		.sort((a, b) => (b.total_revenue || 0) - (a.total_revenue || 0))
		.slice(0, safeLimit);

	return {
		totalPurchases,
		totalCreatorRevenue: totalRevenue,
		topExtensionsByPurchases,
		topExtensionsByRevenue,
		topCreatorsByRevenue,
	};
};

const canServerInstallExtension = async (serverId, extensionId, installerUserId) => {
	const extension = await Database.Gallery.findOne(extensionId);
	if (!extension) return { allowed: false, reason: "Extension not found" };
	if (!extension.premium?.is_premium) return { allowed: true };
	const hasAccess = await VoteRewardsManager.hasUserPurchasedExtension(installerUserId, extensionId);
	return hasAccess ? { allowed: true } : { allowed: false, reason: "Not purchased" };
};

module.exports = {
	getMarketplaceSettings,
	setPremiumStatus,
	purchaseExtension,
	getExtensionEarnings,
	withdrawEarnings,
	getUserExtensions,
	getExtensionSales,
	getExtensionSalesAdmin,
	getMarketplaceStats,
	canServerInstallExtension,
};
