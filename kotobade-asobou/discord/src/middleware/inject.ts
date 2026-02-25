import { createMiddleware } from "hono/factory";
import OpenAI from "openai";
import { HonoConfig } from "@/config";
import { DiscordClient } from "@/clients/discord";

export const inject = createMiddleware<HonoConfig>(async (c, next) => {
  if (!c.get("openai")) {
    const client = new OpenAI({ apiKey: c.env.OPENAI_API_KEY,baseURL: c.env.AI_GATEWAY_URL });
    c.set("openai", client);
  }

  if (!c.get("discord")) {
    const client = new DiscordClient(c.env.DISCORD_TOKEN);

    c.set("discord", client);
  }

  if (!c.get("internal")) {
    const internal = {
      openai: c.get("openai"),
      discord: c.get("discord"),
    };
    c.set("internal", internal);
  }

  await next();
});
