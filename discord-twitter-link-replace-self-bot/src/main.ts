import { Client } from "discord.js-selfbot-v13";
import dotenv from "dotenv";

dotenv.config();

const client = new Client({
  checkUpdate: false,
});

client.on("ready", async () => {
  if (client.user) console.log(`${client.user.username} is ready!`);
});

client.on("messageCreate", async (message) => {
  // Check if the message is from the self bot and is not a system message
  if (message.author.id === client.user?.id && !message.system) {
    let updatedContent = message.content;

    // Function to remove query parameters from URLs
    const removeQueryParameters = (url) => {
      const urlObject = new URL(url);
      urlObject.search = ""; // Remove query parameters
      return urlObject.toString();
    };

    // Replace twitter.com and x.com URLs and remove query parameters if present
    updatedContent = updatedContent.replace(
      /https:\/\/twitter\.com\/\w+\/status\/\d+\S*/g,
      (match) => {
        return removeQueryParameters(match).replace(
          "twitter.com",
          "fxtwitter.com"
        );
      }
    );
    updatedContent = updatedContent.replace(
      /https:\/\/x\.com\/\w+\/status\/\d+\S*/g,
      (match) => {
        return removeQueryParameters(match).replace("x.com", "fxtwitter.com");
      }
    );

    // Edit the message if the content has changed
    if (message.content !== updatedContent) {
      try {
        await message.edit(updatedContent);
      } catch (error) {
        console.error("Failed to edit message:", error);
      }
    }
  }
});

client.login(process.env.DISCORD_BOT_TOKEN as string);
