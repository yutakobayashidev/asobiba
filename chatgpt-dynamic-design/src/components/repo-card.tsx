"use client";

import { Star } from "lucide-react";
import { useActions, useUIState } from "ai/rsc";
import type { AI } from "@/app/action";
import { useAtomValue } from "jotai/react";
import { apiKeyAtom } from "@/atom";

export function ForkRepoCard({
  url,
  name,
  stars,
  description,
  language,
}: {
  url: string;
  name: string;
  stars: number;
  description: string;
  language: string;
}) {
  const { submitUserMessage } = useActions<typeof AI>();
  const apiKey = useAtomValue(apiKeyAtom);

  const [_, setMessages] = useUIState<typeof AI>();

  return (
    <button
      className="block"
      onClick={async () => {
        const response = await submitUserMessage(
          `Fork ${name} repository`,
          apiKey
        );
        setMessages((currentMessages) => [...currentMessages, response]);
      }}
    >
      <RepoCard
        url={url}
        stars={stars}
        language={language}
        description={description}
        name={name}
      />
    </button>
  );
}

export default function RepoCard({
  url,
  name,
  stars,
  description,
  language,
}: {
  url: string;
  name: string;
  stars: number;
  description: string;
  language: string;
}) {
  return (
    <div className="border p-4 rounded-md shadow-sm border-gray-200 flex flex-col justify-between hover:shadow-md transition-all">
      <div>
        <a
          href={url}
          className="flex no-underline items-center font-bold text-blue-500"
        >
          {name}
        </a>
        <p className="my-3 line-clamp-1 text-left text-sm">{description}</p>
      </div>
      <footer className="flex items-center text-sm prose-a:text-black">
        <div className="flex items-center mr-3">{language}</div>
        <a
          href={url + "/stargazers"}
          className="flex items-center no-underline font-normal"
        >
          <Star className="mr-1 h-5 w-3 text-gray-500" />
          {stars}
        </a>
      </footer>
    </div>
  );
}
