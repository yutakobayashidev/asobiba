import { APIBaseInteraction, InteractionType } from "discord-api-types/v10";
import { InternalContext } from "@/config";

export type ApplicationCommandObj = APIBaseInteraction<
  InteractionType.ApplicationCommand,
  {
    name: string;
  }
>;

export const handleApplicationCommands = async ({
  intentObj,
  ctx,
  commands,
}: {
  intentObj: ApplicationCommandObj;
  ctx: InternalContext;
  commands: {
    commandName: string;
    handler: (args: {
      intentObj: ApplicationCommandObj;
      ctx: InternalContext;
    }) => Promise<{
      type: number;
      data: unknown;
    }>;
  }[];
}) => {
  for (const command of commands) {
    if (command.commandName === intentObj.data?.name) {
      return command.handler({
        intentObj,
        ctx,
      });
    }
  }

  throw new Error("Invalid interaction");
};
