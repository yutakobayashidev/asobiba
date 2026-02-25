import { Hono } from "hono";
import { HonoConfig, InternalContext } from "@/config";
import { verifyDiscordInteraction } from "@/middleware/verifyDiscordInteraction";
import { errorResponse } from "@/responses/errorResponse";
import {
  APIInteraction,
  InteractionType,
  ApplicationCommandOptionType,
  ApplicationCommandType,
  InteractionResponseType,
} from "discord-api-types/v10";
import { handleApplicationCommands } from "./interactions/handleApplicationCommands";
import keigoCommand from "@/interactions/applicationCommands/keigo";
import ayasiiCommand from "@/interactions/applicationCommands/ayasii_jp";
import engurishuCommand from "@/interactions/applicationCommands/engurishu";
import chineseCommand from "@/interactions/applicationCommands/chinese";
import heianCommand from "@/interactions/applicationCommands/heian";
import katakanaCommand from "@/interactions/applicationCommands/katakana";
import syogakuseCommand from "@/interactions/applicationCommands/syogakuse";
import wordorderCommand from "@/interactions/applicationCommands/wordorder";
import { inject } from "@/middleware/inject";
import OpenAI from "openai";

const app = new Hono<HonoConfig>();

app.use("*", inject);

app.post("/interaction", verifyDiscordInteraction, async (c) => {
  const body: APIInteraction = await c.req.json();

  try {
    switch (body.type) {
      case InteractionType.ApplicationCommand:
        switch (body.data.type) {
          case ApplicationCommandType.ChatInput: {
            switch (body.data.options?.[0]?.type) {
              case ApplicationCommandOptionType.String: {

                c.executionCtx.waitUntil(handleDeferredInteractionStreamly(body.data.options[0].value as string, body.token, c.env))

                return Response.json({
                  type: InteractionResponseType.DeferredChannelMessageWithSource,
                });
              }
            }
          }
        }
    }
  } catch (e) {
    console.error(e);
    return c.json(
      errorResponse(
        e instanceof Error
          ? e.message
          : "なにか問題が起こったみたいだ！[GitHub](https://github.com/yutakobayashidev/sandbox/tree/main/node/apps/kotobade-asobou-discord)で貢献しよう！"
      )
    );
  }
});

async function handleDeferredInteractionStreamly(message: string, token: string, env: HonoConfig["Bindings"]) {
  const startedAt = Date.now();
  const chatCompletion = new OpenAI({
    apiKey: env.OPENAI_API_KEY,
    baseURL: env.AI_GATEWAY_URL,
  });

  const prefixed = message.split('\n').map((line) => `> ${line}`).join('\n');

  const endpoint = `https://discord.com/api/v10/webhooks/${env.DISCORD_APPLICATION_ID}/${token}`;
  await fetch(endpoint, {
    method: "POST",
    body: JSON.stringify({
      content: `${prefixed}\n(考え中)`,
    }),
    headers: {
      "Content-Type": "application/json",
    }
  });

  const patch_endpoint = `https://discord.com/api/v10/webhooks/${env.DISCORD_APPLICATION_ID}/${token}/messages/@original`;

  let current = '';
  const chatStream = await chatCompletion.chat.completions.create({
    messages: [
      { role: 'user', content: message }
    ],
    model: 'gpt-4-turbo-preview',
    max_tokens: 400,
    stream: true
  });

  const update = async (content: string) => {
    await fetch(patch_endpoint, {
      method: "PATCH",
      body: JSON.stringify({
        content: content,
      }),
      headers: {
        "Content-Type": "application/json",
      }
    });
  }

  const intervalId = setInterval(async () => {
    update(`${prefixed}\n\n${current}\n(考え中)`);
  }, 5000);

  let isDone = false;
  let streamPromise = (async () => {
    for await (const chatMessage of chatStream) {
      if (isDone) break;
      const text = chatMessage.choices[0]?.delta.content ?? "";
      console.log(text)
      current += text;
      if (text.includes('[DONE]')) {
        isDone = true;
        clearInterval(intervalId);
        await update(`${prefixed}\n\n${current}`);
        break;
      }
    }
  })();

  // タイムアウト処理
  let timeoutPromise = new Promise<void>((resolve) => {
    setTimeout(async () => {
      if (isDone) return;
      clearInterval(intervalId);
      await update(`${prefixed}\n\n${current}\n[timeout:${Date.now() - startedAt}ms]`);
      resolve();
    }, 27000);
  });

  await Promise.allSettled([streamPromise, timeoutPromise]);
}


export default app;