import { Hono } from "hono";
import { bot } from "./bot.js";

const app = new Hono();

type Platform = keyof typeof bot.webhooks;

app.post("/api/webhooks/:platform", async (c) => {
  const platform = c.req.param("platform");
  const handler = bot.webhooks[platform as Platform];
  if (!handler) {
    return c.text("Unsupported platform", 400);
  }
  return handler(c.req.raw);
});

export default {
  port: Number(process.env.PORT ?? 3000),
  fetch: app.fetch,
};
