import {
  Chat,
  Card,
  CardText,
  Button,
  Actions,
  Select,
  SelectOption,
  Divider,
} from "chat";
import { createSlackAdapter } from "@chat-adapter/slack";
import { createMemoryState } from "@chat-adapter/state-memory";
import { streamText } from "ai";
import { anthropic } from "@ai-sdk/anthropic";

export const bot = new Chat({
  userName: "assistant",
  adapters: {
    slack: createSlackAdapter(),
  },
  state: createMemoryState(),
});

// メンションされたらカード UI で応答し、スレッドを購読
bot.onNewMention(async (thread) => {
  await thread.subscribe();
  await thread.post(
    Card({
      title: "Welcome to my bot!",
      children: [
        CardText(
          "Hello! I am a **bot**. I can respond to your _messages_ and button clicks.",
        ),
        Divider(),
        Actions([
          Button({ id: "primary", label: "Click me", style: "primary" }),
          Select({
            id: "select-fruit",
            label: "Your favorite fruit",
            options: [
              SelectOption({ label: "🍎", value: "apple" }),
              SelectOption({ label: "🍌", value: "banana" }),
              SelectOption({ label: "🍊", value: "orange" }),
            ],
          }),
        ]),
      ],
    }),
  );
});

// 対応する id のアクションが実行されたときに反応する
bot.onAction("primary", async (event) => {
  await event.thread.post("You clicked the button!");
});

bot.onAction("select-fruit", async (event) => {
  await event.thread.post(`You selected: ${event.value}`);
});

// 購読中スレッドの新着メッセージ → 会話履歴付きでストリーミング応答
bot.onSubscribedMessage(async (thread) => {
  const fetchResult = await thread.adapter.fetchMessages(thread.id, {
    limit: 20,
  });
  const history = fetchResult.messages
    .filter((msg) => msg.text.trim())
    .map((msg) => ({
      role: msg.author.isMe ? ("assistant" as const) : ("user" as const),
      content: msg.text,
    }));
  const result = streamText({
    model: anthropic("claude-haiku-4-5"),
    messages: history,
  });
  await thread.post(result.textStream);
});
