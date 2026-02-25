"use client";

import { useState } from "react";
import { useUIState, useActions } from "ai/rsc";
import type { AI } from "./action";
import { UserMessage } from "@/components/message";
import ReactMarkdown from "react-markdown";
import { useAtom } from "jotai/react";
import { apiKeyAtom } from "@/atom";

export default function Chat() {
  const [apiKey, setAPIkey] = useAtom(apiKeyAtom);

  const [inputValue, setInputValue] = useState("");
  const [messages, setMessages] = useUIState<typeof AI>();
  const { submitUserMessage } = useActions<typeof AI>();

  return (
    <div className="mx-auto py-12 px-3 max-w-6xl">
      <div className="space-y-5">
        {messages.map((message) => (
          <div key={message.id}>{message.display}</div>
        ))}
      </div>
      <div className="mt-5">
        <form
          onSubmit={async (e) => {
            e.preventDefault();

            if (!apiKey) {
              alert("API Key is required");
              return;
            }

            setMessages((currentMessages) => [
              ...currentMessages,
              {
                id: Date.now(),
                display: (
                  <UserMessage>
                    <ReactMarkdown className="prose prose-neutral prose-a:text-blue-500 prose-a:no-underline hover:prose-a:underline prose-img:rounded-lg prose-img:shadow max-w-none flex-1 space-y-2 overflow-hidden px-1">
                      {inputValue}
                    </ReactMarkdown>
                  </UserMessage>
                ),
              },
            ]);

            const responseMessage = await submitUserMessage(inputValue, apiKey);
            setMessages((currentMessages) => [
              ...currentMessages,
              responseMessage,
            ]);

            setInputValue("");
          }}
        >
          <input
            placeholder="プロンプトを入力..."
            value={inputValue}
            onChange={(event) => {
              setInputValue(event.target.value);
            }}
          />
        </form>
        <input
          type="text"
          value={apiKey}
          onChange={(e) => setAPIkey(e.target.value)}
          placeholder="OpenAI API Key"
          className="w-full"
        />
      </div>
    </div>
  );
}
