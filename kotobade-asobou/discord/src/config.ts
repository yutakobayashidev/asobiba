import OpenAI from "openai";
import { DiscordClient } from "@/clients/discord";

export type InternalContext = {
  openai: OpenAI;
  discord: DiscordClient;
};

export interface HonoConfig {
  Bindings: {
    OPENAI_API_KEY: string;
    DISCORD_TOKEN: string;
    DISCORD_APPLICATION_ID: string;
    AI_GATEWAY_URL: string;
  };
  Variables: {
    openai: OpenAI;
    discord: DiscordClient;
    internal: InternalContext;
  };
}
