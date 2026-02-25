import { APIInteractionResponseChannelMessageWithSource } from "discord-api-types/v10";
import { ApplicationCommandObj } from "@/interactions/handleApplicationCommands";
import { InternalContext } from "@/config";
import { SYOGAKUSE_SYSTEM_PROMPT } from "kotobade-asobou";
import { SYOGAKUSE_COMMAND_NAME } from "@/constants";
import { buildAIResponse } from "@/responses/aiResponse";

const handler = async ({
  intentObj,
  ctx,
}: {
  intentObj: ApplicationCommandObj;
  ctx: InternalContext;
}): Promise<APIInteractionResponseChannelMessageWithSource> => {

  const chatCompletion = await ctx.openai.chat.completions.create({
    messages: [
      { role: "system", content: SYOGAKUSE_SYSTEM_PROMPT },
      {
        role: "user",
        content: `簡単な言葉に変換するテキスト： ${
          (intentObj.data as any)?.options[0].value
        }`,
      },
    ],
    model: "gpt-4-turbo-preview",
  });

  return buildAIResponse({
    original: (intentObj.data as any).options[0].value,
    response: chatCompletion.choices[0].message.content,
  });
};

export default {
  commandName: SYOGAKUSE_COMMAND_NAME,
  handler,
};
