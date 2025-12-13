const fetch = require("node-fetch");

const formatPrice = price => new Intl.NumberFormat("en-US", {
	style: "currency",
	currency: "USD",
	minimumFractionDigits: 2,
	maximumFractionDigits: 2,
}).format(price);

const formatLargeNumber = num => {
	if (!num) return "N/A";
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
	if (pct >= 3) return "🚀";
	if (pct > 0) return "📈";
	if (pct <= -3) return "💥";
	return "📉";
};

module.exports = async ({ client, configJS, Constants: { Colors } }, documents, msg, commandData) => {
	const symbol = msg.suffix?.toUpperCase().trim().split(/\s+/)[0];

	if (!symbol) {
		return msg.send({
			embeds: [{
				color: Colors.INFO,
				title: "📊 Stock Market Info",
				description: "Get real-time stock market data and quotes.",
				fields: [
					{
						name: "Usage",
						value: [
							`\`${commandData.name} <symbol>\` - Get stock quote`,
							`\`${commandData.name} AAPL\` - Apple Inc.`,
							`\`${commandData.name} MSFT\` - Microsoft`,
							`\`${commandData.name} GOOGL\` - Alphabet`,
						].join("\n"),
					},
				],
				footer: { text: "Enter a stock ticker symbol" },
			}],
		});
	}

	// Check if API key is configured
	const apiKey = configJS.tokens?.alphavantage || configJS.tokens?.finnhub || process.env.ALPHAVANTAGE_API_KEY || process.env.FINNHUB_API_KEY;

	if (!apiKey) {
		// Use free Yahoo Finance alternative
		try {
			const response = await fetch(
				`https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1d`,
				{
					timeout: 10000,
					headers: {
						"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
					},
				},
			);

			if (!response.ok) {
				throw new Error("Stock not found");
			}

			const data = await response.json();

			if (!data.chart?.result?.[0]) {
				throw new Error("No data available");
			}

			const result = data.chart.result[0];
			const meta = result.meta;
			const quote = result.indicators?.quote?.[0] || {};

			const currentPrice = meta.regularMarketPrice;
			const previousClose = meta.previousClose || meta.chartPreviousClose;
			const change = currentPrice - previousClose;
			const changePercent = (change / previousClose) * 100;

			const high = quote.high ? Math.max(...quote.high.filter(h => h !== null)) : null;
			const low = quote.low ? Math.min(...quote.low.filter(l => l !== null)) : null;

			return msg.send({
				embeds: [{
					color: changePercent >= 0 ? Colors.SUCCESS : Colors.ERR,
					title: `${meta.symbol} - ${meta.shortName || meta.longName || symbol}`,
					fields: [
						{ name: "💵 Price", value: formatPrice(currentPrice), inline: true },
						{ name: "📈 Change", value: `${getChangeEmoji(changePercent)} ${formatPrice(change)} (${formatPercentage(changePercent)})`, inline: true },
						{ name: "📊 Volume", value: meta.regularMarketVolume?.toLocaleString() || "N/A", inline: true },
						{ name: "📉 Day Low", value: low ? formatPrice(low) : "N/A", inline: true },
						{ name: "📈 Day High", value: high ? formatPrice(high) : "N/A", inline: true },
						{ name: "🔒 Prev Close", value: formatPrice(previousClose), inline: true },
					],
					footer: { text: `${meta.exchangeName || "Exchange"} • ${meta.currency || "USD"}` },
					timestamp: new Date().toISOString(),
				}],
			});
		} catch (err) {
			logger.warn(`Stock command error: ${err.message}`, { svrid: msg.guild.id, symbol });
			return msg.send({
				embeds: [{
					color: Colors.SOFT_ERR,
					title: "Stock Not Found",
					description: `Couldn't find stock data for \`${symbol}\`.\n\nMake sure you're using a valid ticker symbol (e.g., AAPL, MSFT, GOOGL).`,
				}],
			});
		}
	}

	// Use configured API (Alpha Vantage or Finnhub)
	try {
		let stockData;

		if (configJS.tokens?.finnhub || process.env.FINNHUB_API_KEY) {
			const finnhubKey = configJS.tokens?.finnhub || process.env.FINNHUB_API_KEY;
			const response = await fetch(
				`https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${finnhubKey}`,
				{ timeout: 10000 },
			);
			const data = await response.json();

			if (!data.c || data.c === 0) {
				throw new Error("Stock not found");
			}

			stockData = {
				symbol,
				price: data.c,
				change: data.d,
				changePercent: data.dp,
				high: data.h,
				low: data.l,
				open: data.o,
				prevClose: data.pc,
			};
		} else {
			const avKey = configJS.tokens?.alphavantage || process.env.ALPHAVANTAGE_API_KEY;
			const response = await fetch(
				`https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${avKey}`,
				{ timeout: 10000 },
			);
			const data = await response.json();

			const quote = data["Global Quote"];
			if (!quote || !quote["05. price"]) {
				throw new Error("Stock not found");
			}

			stockData = {
				symbol: quote["01. symbol"],
				price: parseFloat(quote["05. price"]),
				change: parseFloat(quote["09. change"]),
				changePercent: parseFloat(quote["10. change percent"]?.replace("%", "")),
				high: parseFloat(quote["03. high"]),
				low: parseFloat(quote["04. low"]),
				open: parseFloat(quote["02. open"]),
				prevClose: parseFloat(quote["08. previous close"]),
			};
		}

		msg.send({
			embeds: [{
				color: stockData.changePercent >= 0 ? Colors.SUCCESS : Colors.ERR,
				title: `📊 ${stockData.symbol}`,
				fields: [
					{ name: "💵 Price", value: formatPrice(stockData.price), inline: true },
					{ name: "📈 Change", value: `${getChangeEmoji(stockData.changePercent)} ${formatPrice(stockData.change)} (${formatPercentage(stockData.changePercent)})`, inline: true },
					{ name: "🔓 Open", value: formatPrice(stockData.open), inline: true },
					{ name: "📉 Day Low", value: formatPrice(stockData.low), inline: true },
					{ name: "📈 Day High", value: formatPrice(stockData.high), inline: true },
					{ name: "🔒 Prev Close", value: formatPrice(stockData.prevClose), inline: true },
				],
				footer: { text: "Real-time market data" },
				timestamp: new Date().toISOString(),
			}],
		});
	} catch (err) {
		logger.warn(`Stock command error: ${err.message}`, { svrid: msg.guild.id, symbol });
		msg.send({
			embeds: [{
				color: Colors.SOFT_ERR,
				title: "Stock Not Found",
				description: `Couldn't find stock data for \`${symbol}\`.\n\nMake sure you're using a valid ticker symbol.`,
			}],
		});
	}
};
