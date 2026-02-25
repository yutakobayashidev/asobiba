import { APIInteractionResponseChannelMessageWithSource } from "discord-api-types/v10";
import { ApplicationCommandObj } from "@/interactions/handleApplicationCommands";
import { InternalContext } from "@/config";
import { KEIGO_SYSTEM_PROMPT } from "kotobade-asobou";
import { KEIGO_COMMAND_NAME } from "@/constants";
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
      { role: "system", content: KEIGO_SYSTEM_PROMPT },
      {
        role: "user",
        content: `敬語に変換するテキスト： ${
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
  commandName: KEIGO_COMMAND_NAME,
  handler,
};
