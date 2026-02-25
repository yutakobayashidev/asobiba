import {
  APIInteractionResponseChannelMessageWithSource,
  InteractionResponseType,
} from "discord-api-types/v10";

export const buildAIResponse = ({
  original,
  response,
}: {
  original: string;
  response: string | null;
}): APIInteractionResponseChannelMessageWithSource => {
  return {
    type: InteractionResponseType.ChannelMessageWithSource,
    data: {
      content: `元の文字列: ${original}\n\n新しい文字列: ${
        response ?? "問題が発生したため、生成できませんでした"
      }`,
    },
  };
};
