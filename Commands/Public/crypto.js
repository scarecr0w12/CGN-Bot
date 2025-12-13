const fetch = require("node-fetch");

const COINGECKO_API = "https://api.coingecko.com/api/v3";

// Common coin aliases
const COIN_ALIASES = {
	btc: "bitcoin",
	eth: "ethereum",
	sol: "solana",
	ada: "cardano",
	dot: "polkadot",
	doge: "dogecoin",
	xrp: "ripple",
	ltc: "litecoin",
	link: "chainlink",
	matic: "polygon",
	avax: "avalanche",
	atom: "cosmos",
	uni: "uniswap",
	xlm: "stellar",
	algo: "algorand",
	bnb: "binancecoin",
	usdt: "tether",
	usdc: "usd-coin",
};

const formatPrice = (price, currency = "usd") => {
	if (price >= 1) {
		return new Intl.NumberFormat("en-US", {
			style: "currency",
			currency: currency.toUpperCase(),
			minimumFractionDigits: 2,
			maximumFractionDigits: 2,
		}).format(price);
	}
	return new Intl.NumberFormat("en-US", {
		style: "currency",
		currency: currency.toUpperCase(),
		minimumFractionDigits: 2,
		maximumFractionDigits: 8,
	}).format(price);
};

const formatLargeNumber = num => {
	if (num >= 1e12) return `$${(num / 1e12).toFixed(2)}T`;
	if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
	if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
	return `$${num.toLocaleString()}`;
};

const formatPercentage = pct => {
	if (pct === null || pct === undefined) return "N/A";
	const sign = pct >= 0 ? "+" : "";
	return `${sign}${pct.toFixed(2)}%`;
};

const getChangeEmoji = pct => {
	if (pct === null || pct === undefined) return "➖";
	if (pct >= 5) return "🚀";
	if (pct > 0) return "📈";
	if (pct <= -5) return "💥";
	return "📉";
};

module.exports = async ({ Constants: { Colors } }, documents, msg, commandData) => {
	const args = msg.suffix?.toLowerCase().trim().split(/\s+/) || [];

	if (args.length === 0 || args[0] === "" || args[0] === "help") {
		return msg.send({
			embeds: [{
				color: Colors.INFO,
				title: "💰 Cryptocurrency Prices",
				description: "Get real-time cryptocurrency prices and market data.",
				fields: [
					{
						name: "Usage",
						value: [
							`\`${commandData.name} <coin>\` - Get price for a coin`,
							`\`${commandData.name} <coin> <coin2> ...\` - Compare multiple coins`,
							`\`${commandData.name} top [count]\` - Top coins by market cap`,
						].join("\n"),
					},
					{
						name: "Examples",
						value: [
							`\`${commandData.name} bitcoin\``,
							`\`${commandData.name} btc eth sol\``,
							`\`${commandData.name} top 10\``,
						].join("\n"),
					},
				],
				footer: { text: "Data provided by CoinGecko" },
			}],
		});
	}

	try {
		// Handle "top" command
		if (args[0] === "top" || args[0] === "list") {
			const count = Math.max(1, Math.min(25, parseInt(args[1]) || 10));

			const response = await fetch(
				`${COINGECKO_API}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=${count}&page=1&sparkline=false&price_change_percentage=24h`,
				{ timeout: 10000 },
			);

			if (!response.ok) {
				throw new Error("Failed to fetch market data");
			}

			const coins = await response.json();

			const description = coins.map((coin, i) => {
				const emoji = getChangeEmoji(coin.price_change_percentage_24h);
				const change = formatPercentage(coin.price_change_percentage_24h);
				return `**${i + 1}. ${coin.name}** (${coin.symbol.toUpperCase()})\n${formatPrice(coin.current_price)} ${emoji} ${change}`;
			}).join("\n\n");

			return msg.send({
				embeds: [{
					color: Colors.RESPONSE,
					title: `💰 Top ${count} Cryptocurrencies`,
					description: description.slice(0, 4000),
					footer: { text: "Data provided by CoinGecko • Prices in USD" },
					timestamp: new Date().toISOString(),
				}],
			});
		}

		// Handle single or multiple coin lookup
		const coinIds = args.slice(0, 5).map(arg => COIN_ALIASES[arg] || arg);

		const response = await fetch(
			`${COINGECKO_API}/coins/markets?vs_currency=usd&ids=${coinIds.join(",")}&order=market_cap_desc&sparkline=false&price_change_percentage=1h,24h,7d`,
			{ timeout: 10000 },
		);

		if (!response.ok) {
			throw new Error("Failed to fetch coin data");
		}

		const coins = await response.json();

		if (coins.length === 0) {
			return msg.send({
				embeds: [{
					color: Colors.SOFT_ERR,
					title: "Coin Not Found",
					description: `Couldn't find cryptocurrency matching: \`${args.join(", ")}\`\n\nTry using the full name (e.g., "bitcoin" instead of "btc") or check the spelling.`,
				}],
			});
		}

		// Single coin - detailed view
		if (coins.length === 1) {
			const coin = coins[0];
			const change1h = formatPercentage(coin.price_change_percentage_1h_in_currency);
			const change24h = formatPercentage(coin.price_change_percentage_24h_in_currency);
			const change7d = formatPercentage(coin.price_change_percentage_7d_in_currency);

			return msg.send({
				embeds: [{
					color: coin.price_change_percentage_24h >= 0 ? Colors.SUCCESS : Colors.ERR,
					title: `${coin.name} (${coin.symbol.toUpperCase()})`,
					thumbnail: { url: coin.image },
					fields: [
						{ name: "💵 Price", value: formatPrice(coin.current_price), inline: true },
						{ name: "📊 Market Cap", value: formatLargeNumber(coin.market_cap), inline: true },
						{ name: "💹 24h Volume", value: formatLargeNumber(coin.total_volume), inline: true },
						{ name: "📈 1h Change", value: `${getChangeEmoji(coin.price_change_percentage_1h_in_currency)} ${change1h}`, inline: true },
						{ name: "📈 24h Change", value: `${getChangeEmoji(coin.price_change_percentage_24h_in_currency)} ${change24h}`, inline: true },
						{ name: "📈 7d Change", value: `${getChangeEmoji(coin.price_change_percentage_7d_in_currency)} ${change7d}`, inline: true },
						{ name: "🏆 Rank", value: `#${coin.market_cap_rank || "N/A"}`, inline: true },
						{ name: "📉 24h Low", value: formatPrice(coin.low_24h), inline: true },
						{ name: "📈 24h High", value: formatPrice(coin.high_24h), inline: true },
					],
					footer: { text: "Data provided by CoinGecko" },
					timestamp: new Date().toISOString(),
				}],
			});
		}

		// Multiple coins - comparison view
		const fields = coins.map(coin => ({
			name: `${coin.name} (${coin.symbol.toUpperCase()})`,
			value: [
				`**Price:** ${formatPrice(coin.current_price)}`,
				`**24h:** ${getChangeEmoji(coin.price_change_percentage_24h)} ${formatPercentage(coin.price_change_percentage_24h)}`,
				`**MCap:** ${formatLargeNumber(coin.market_cap)}`,
			].join("\n"),
			inline: true,
		}));

		msg.send({
			embeds: [{
				color: Colors.RESPONSE,
				title: "💰 Crypto Comparison",
				fields,
				footer: { text: "Data provided by CoinGecko" },
				timestamp: new Date().toISOString(),
			}],
		});
	} catch (err) {
		logger.warn(`Crypto command error: ${err.message}`, { svrid: msg.guild.id });
		msg.send({
			embeds: [{
				color: Colors.ERR,
				title: "Error Fetching Data",
				description: "Unable to fetch cryptocurrency data. Please try again later.",
				footer: { text: "CoinGecko API may be rate limited" },
			}],
		});
	}
};
