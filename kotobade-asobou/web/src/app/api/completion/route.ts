import OpenAI from "openai";
import { OpenAIStream, StreamingTextResponse } from "ai";
import {
  CHINESE_SYSTEM_PROMPT,
  GOJYUN_SYSTEM_PROMPT,
  HEIAN_SYSTEM_PROMPT,
  JAPANIIZU_SYSTEM_PROMPT,
  KATAKANA_SYSTEM_PROMPT,
  SYOGAKUSE_SYSTEM_PROMPT,
  WIRED_JAPANESE_SYSTEM_PROMPT,
  KEIGO_SYSTEM_PROMPT,
} from "kotobade-asobou";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

export const runtime = "edge";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

const redis = new Redis({
  token: process.env.UPSTASH_REDIS_REST_TOKEN || "",
  url: process.env.UPSTASH_REDIS_REST_URL || "",
});

function get_type(type: string) {
  switch (type) {
    case "chinese":
      return CHINESE_SYSTEM_PROMPT;
    case "gojyun":
      return GOJYUN_SYSTEM_PROMPT;
    case "heian":
      return HEIAN_SYSTEM_PROMPT;
    case "japaniizu":
      return JAPANIIZU_SYSTEM_PROMPT;
    case "katakana":
      return KATAKANA_SYSTEM_PROMPT;
    case "keigo":
      return KEIGO_SYSTEM_PROMPT;
    case "syogakuse":
      return SYOGAKUSE_SYSTEM_PROMPT;
    case "wired_japanese":
      return WIRED_JAPANESE_SYSTEM_PROMPT;
    default:
      return null;
  }
}
export async function POST(req: Request) {
  if (
    process.env.NODE_ENV != "development" &&
    process.env.UPSTASH_REDIS_REST_URL &&
    process.env.UPSTASH_REDIS_REST_TOKEN
  ) {
    const ip = req.headers.get("x-forwarded-for");

    const ratelimit = new Ratelimit({
      limiter: Ratelimit.slidingWindow(20, "1 d"),
      redis: redis,
    });

    const { limit, remaining, reset, success } = await ratelimit.limit(
      `kotobadeasobou_ratelimit_${ip}`
    );

    if (!success) {
      return new Response("Too many requests", {
        headers: {
          "X-RateLimit-Limit": limit.toString(),
          "X-RateLimit-Remaining": remaining.toString(),
          "X-RateLimit-Reset": reset.toString(),
        },
        status: 429,
      });
    }
  }

  const { prompt, type } = await req.json();

  const system_prompt = get_type(type);

  if (!system_prompt) {
    return new Response("問題が発生しました", {
      status: 500,
    });
  }

  const response = await openai.chat.completions.create({
    messages: [
      { role: "system", content: system_prompt },
      {
        role: "user",
        content: prompt,
      },
    ],
    model: "gpt-4",
    stream: true,
  });

  const stream = OpenAIStream(response);

  return new StreamingTextResponse(stream);
}
