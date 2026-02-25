import "server-only";

import { OpenAI } from "openai";
import {
  createAI,
  getMutableAIState,
  render,
  createStreamableUI,
} from "ai/rsc";
import { z } from "zod";
import {
  forkRepository,
  getCountryInfo,
  getCurrentWeather,
  getTrendingRepos,
  getUserAndOrganizations,
  searchRepositories,
} from "./functions";
import Weather from "@/components/weather";
import Spinner from "@/components/spinner";
import Country from "@/components/country";
import { AIMessage } from "@/components/message";
import ReactMarkdown from "react-markdown";
import { auth } from "@/auth";
import NoLogin from "@/components/no-login";
import RepoCard, { ForkRepoCard } from "@/components/repo-card";
import {
  getRepositoryNameFromUrl,
  runAsyncFnWithoutBlocking,
} from "@/lib/utils";
import { languageSchema, periodSchema } from "@/schema";
import Fork from "@/components/fork";

export async function forkRepo({
  username,
  repo,
  owner,
}: {
  username: string;
  repo: string;
  owner?: string;
}) {
  "use server";

  const aiState = getMutableAIState<typeof AI>();

  const session = await auth();

  const fork = createStreamableUI(
    <div className="inline-flex items-start gap-1 md:items-center">
      <Spinner />
      <p className="mb-2">Forking the repository...</p>
    </div>
  );

  runAsyncFnWithoutBlocking(async () => {
    try {
      const isSameUser = session?.user.username === owner;
      const organization = isSameUser ? undefined : owner;

      const res = await forkRepository({
        username,
        repo,
        organization,
        accessToken: session?.user.accessToken as string,
      });

      aiState.done([
        ...aiState.get(),
        {
          role: "function",
          name: "fork_repo",
          content: JSON.stringify(res),
        },
      ]);

      fork.done(
        <div>
          <ReactMarkdown className="prose mb-5 prose-neutral prose-a:text-blue-500 prose-a:no-underline hover:prose-a:underline prose-img:rounded-lg prose-img:shadow max-w-none flex-1 space-y-2 overflow-hidden px-1">
            {"succsess to fork the repository!"}
          </ReactMarkdown>
          <RepoCard
            url={res.data.html_url}
            stars={res.data.stargazers_count}
            language={res.data.language ?? ""}
            description={res.data.description ?? ""}
            name={res.data.full_name}
          />
        </div>
      );
    } catch (error) {
      console.log(error);
      const searchRepo = await searchRepositories(
        repo,
        session?.user.accessToken as string
      );

      aiState.done([
        ...aiState.get(),
        {
          role: "function",
          name: "fork_repo",
          content: JSON.stringify({ error: (error as Error).message }),
        },
      ]);

      fork.done(
        <div>
          <ReactMarkdown className="prose prose-neutral prose-a:text-blue-500 prose-a:no-underline hover:prose-a:underline prose-img:rounded-lg prose-img:shadow max-w-none flex-1 space-y-2 overflow-hidden px-1">
            Forking of repository failed. Here are the related repositories:
          </ReactMarkdown>
          <div className="grid-cols-3 mt-5 grid gap-3">
            {searchRepo.data.items.map((repo) => (
              <ForkRepoCard
                key={repo.id}
                url={repo.html_url}
                stars={repo.stargazers_count}
                language={repo.language ?? ""}
                description={repo.description ?? ""}
                name={repo.full_name}
              />
            ))}
          </div>
        </div>
      );
    }
  });

  return {
    forkUI: fork.value,
    newMessage: {
      id: Date.now(),
    },
  };
}

async function submitUserMessage(userInput: string, apiKey: string) {
  "use server";

  const openai = new OpenAI({
    apiKey: apiKey,
  });

  const aiState = getMutableAIState<typeof AI>();

  // Update AI state with new message.
  aiState.update([
    ...aiState.get(),
    {
      role: "user",
      content: userInput,
    },
  ]);

  // render() returns a stream of UI components
  const ui = render({
    model: "gpt-4-0125-preview",
    provider: openai,
    messages: [{ role: "user", content: userInput }],
    // `text` is called when an AI returns a text response (as opposed to a tool call)
    text: ({ content, done }) => {
      // text can be streamed from the LLM, but we only want to close the stream with .done() when its completed.
      // done() marks the state as available for the client to access
      if (done) {
        aiState.done([
          ...aiState.get(),
          {
            role: "assistant",
            content,
          },
        ]);
      }

      return (
        <AIMessage>
          <ReactMarkdown className="prose prose-neutral prose-a:text-blue-500 prose-a:no-underline hover:prose-a:underline prose-img:rounded-lg prose-img:shadow max-w-none flex-1 space-y-2 overflow-hidden px-1">
            {content}
          </ReactMarkdown>
        </AIMessage>
      );
    },
    functions: {
      get_current_weather: {
        description:
          "Learn about the current weather in your country or region from OpenWeatherMap",
        parameters: z
          .object({
            cityName: z.string().describe("the number of the flight"),
          })
          .required(),
        render: async function* ({ cityName }) {
          yield (
            <AIMessage>
              <Spinner />
            </AIMessage>
          );
          const weather = await getCurrentWeather(cityName);

          aiState.done([
            ...aiState.get(),
            {
              role: "function",
              name: "get_current_weather",
              content: JSON.stringify(weather),
            },
          ]);

          return (
            <AIMessage>
              <Weather weather={weather} />
            </AIMessage>
          );
        },
      },
      get_country_info: {
        description: "Get country information from the REST Countries API",
        parameters: z
          .object({
            countryCode: z
              .string()
              .describe("cca2, ccn3, cca3 or cioc country code"),
          })
          .required(),
        render: async function* ({ countryCode }) {
          yield (
            <AIMessage>
              <Spinner />
            </AIMessage>
          );
          const country = await getCountryInfo(countryCode);

          aiState.done([
            ...aiState.get(),
            {
              role: "function",
              name: "get_country_info",
              content: JSON.stringify(country),
            },
          ]);

          return (
            <AIMessage>
              <Country country={country} />
            </AIMessage>
          );
        },
      },
      get_trends_repos: {
        description: "Get trending repositories from the OSS Insight API",
        parameters: z
          .object({
            limit: z.number().optional().default(10),
            period: periodSchema,
            language: languageSchema,
          })
          .required(),
        render: async function* ({ limit, period, language }) {
          yield (
            <AIMessage>
              <Spinner />
            </AIMessage>
          );
          const repos = await getTrendingRepos(limit, period, language);

          aiState.done([
            ...aiState.get(),
            {
              role: "function",
              name: "get_trends_repos",
              content: JSON.stringify(repos),
            },
          ]);

          return (
            <AIMessage>
              <div className="grid-cols-3 grid gap-3">
                {repos.repos.map((repo) => (
                  <RepoCard
                    url={repo.repo_name}
                    stars={Number(repo.stars)}
                    language={repo.primary_language}
                    description={repo.description}
                    key={repo.repo_id}
                    name={getRepositoryNameFromUrl(repo.repo_name) || ""}
                  />
                ))}
              </div>
            </AIMessage>
          );
        },
      },
      fork_repo: {
        description: "Fork a repository on GitHub",
        parameters: z
          .object({
            username: z.string().describe("the username of the owner"),
            repo: z.string().describe("the name of the repository"),
          })
          .required(),
        render: async function* ({ username, repo }) {
          yield (
            <AIMessage>
              <Spinner />
            </AIMessage>
          );

          const session = await auth();

          if (!session) {
            return <NoLogin username={username} repo={repo} />;
          }

          const orgs = await getUserAndOrganizations(session.user.accessToken);

          return (
            <AIMessage>
              <Fork username={username} repo={repo} orgs={orgs} />
            </AIMessage>
          );
        },
      },
    },
  });

  return {
    id: Date.now(),
    display: ui,
  };
}

// Define the initial state of the AI. It can be any JSON object.
const initialAIState: {
  role: "user" | "assistant" | "system" | "function";
  content: string;
  id?: string;
  name?: string;
}[] = [];

// The initial UI state that the client will keep track of.
const initialUIState: {
  id: number;
  display: React.ReactNode;
}[] = [];

export const AI = createAI({
  actions: {
    submitUserMessage,
    forkRepo,
  },
  initialUIState,
  initialAIState,
});
