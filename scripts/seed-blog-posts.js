/* eslint-disable */
/**
 * Blog Seed Script
 * Run with: node scripts/seed-blog-posts.js
 *
 * This script populates the database with SEO-centered blog posts to attract users.
 */

const { MongoClient } = require("mongodb");

// Load config
let config;
try {
	config = require("../Configurations/config.js");
} catch {
	config = require("../Configurations/config.template.js");
}

const AUTHOR_ID = "218536118591684613"; // Using the maintainer ID found in other seed scripts

const blogPosts = [
	{
		title: "How to Boost Your Discord Server Activity with Smart Scoring",
		author_id: AUTHOR_ID,
		category: "Tutorial",
		published_timestamp: new Date(),
		content: `
## The Challenge of Active Communities

Every Discord server owner knows the struggle: you create a server, invite your friends, and... silence. Keeping a community active and engaged is one of the hardest challenges in community management. But what if you could measure exactly how active your server is, not just by message count, but by *engagement quality*?

## Enter SkynetBot's Activity Scoring

Most bots simply count messages. SkynetBot takes a smarter approach. We understand that 1,000 messages from 2 people is different from 1,000 messages from 50 people. Our unique **Activity Scoring Algorithm** weighs both message volume and unique member participation.

### How it Works

*   **Member Weighting:** Active members contribute significantly to your score.
*   **Message Velocity:** Bursts of conversation are tracked.
*   **Consistency:** Daily activity matters more than one-off spikes.

## 3 Tips to Boost Engagement

1.  **Gamify with Points:** Enable the \`!points\` system. Users love seeing their numbers go up. Use the \`!top\` command to show a leaderboard, creating healthy competition.
2.  **Reward Quality:** Encourage users to "upvote" good content by replying with \`+1\` or \`thanks\`. This awards SkynetPoints to the author, reinforcing positive behavior.
3.  **Visualize the Data:** Check your server's **Activity Graph** in the SkynetBot dashboard. Identify your peak hours and schedule events during those times.

Ready to see how active your server really is? [Log in to your dashboard](/login) and check your Activity Score today!
`,
		reactions: []
	},
	{
		title: "Create Custom Commands Without Coding",
		author_id: AUTHOR_ID,
		category: "Tutorial",
		published_timestamp: new Date(),
		content: `
## Unlock the Power of Customization

You shouldn't need a Computer Science degree to make your Discord bot do what you want. Whether it's a simple auto-response for your server rules or a complex timer for game nights, SkynetBot's **Extension Builder** puts the power in your hands.

## No Code? No Problem.

The Extension Builder is a visual tool built right into the dashboard. It allows you to create:

*   **Custom Commands:** Trigger responses with specific prefixes.
*   **Keyword Listeners:** Have the bot chime in when someone says a specific phrase.
*   **Timers & Events:** Schedule recurring messages or actions.

## How to Build Your First Extension

1.  Navigate to the [Extension Builder](/extensions/builder).
2.  Select **Command** as your type.
3.  Choose a trigger (e.g., \`!rules\`).
4.  Type your response. You can even use simple variables like \`{user}\`!
5.  Click **Save** and install it to your server instantly.

## Share with the World

Proud of what you built? You can publish your extension to the **Gallery**. Other server owners can download and use your creations, and you'll earn community reputation points!

Start building today and transform your server into a unique community space.
`,
		reactions: []
	},
	{
		title: "Gamify Your Community: The Power of SkynetPoints",
		author_id: AUTHOR_ID,
		category: "Random", // Using Random as it fits 'general interest'
		published_timestamp: new Date(),
		content: `
## Why Gamification Works

Humans love progress. We love seeing numbers go up, earning badges, and climbing leaderboards. This psychological principle is the core of SkynetBot's **SkynetPoints** system.

## More Than Just Internet Points

SkynetPoints aren't just arbitrary numbers. They represent a user's contribution to your community. Here is how they drive engagement:

### 1. The "Thank You" Economy

SkynetBot scans for phrases like "thanks", "ty", or "+1". When User A helps User B, and User B says "thanks", SkynetBot awards points to User A. This encourages members to be helpful and kind, creating a positive feedback loop.

### 2. Automatic Rank Rewards

You can configure the bot to automatically assign Discord roles when users hit point thresholds.

*   **100 Points:** Regular
*   **500 Points:** Veteran
*   **1000 Points:** Legend

This gives members a tangible goal to work towards, keeping them engaged for the long haul.

### 3. The Leaderboard

The \`!top\` command displays the server's most active members. It's a simple feature, but it drives massive engagement as users compete for the top spot.

## Get Started

Enable the Points system in your server settings dashboard and watch your engagement metrics soar!
`,
		reactions: []
	}
];

async function seed() {
	const url = config.database.URL;
	const dbName = config.database.db;
	
	console.log(`Connecting to ${url}...`);
	const client = new MongoClient(url);

	try {
		await client.connect();
		console.log("Connected successfully to server");
		const db = client.db(dbName);
		const blogsCollection = db.collection("blog");

		for (const post of blogPosts) {
			const filter = { title: post.title };
			const update = { $set: post };
			const options = { upsert: true };
			
			const result = await blogsCollection.updateOne(filter, update, options);
			
			if (result.upsertedCount > 0) {
				console.log(`Inserted post: "${post.title}"`);
			} else if (result.modifiedCount > 0) {
				console.log(`Updated post: "${post.title}"`);
			} else {
				console.log(`No changes for post: "${post.title}"`);
			}
		}

	} catch (err) {
		console.error("Error seeding blog posts:", err);
	} finally {
		await client.close();
		console.log("Connection closed.");
	}
}

seed();
