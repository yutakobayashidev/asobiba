import { LanguageType, PeriodType, RepoInfo } from "@/types";
import { Octokit } from "octokit";

export async function getCurrentWeather(cityName: string) {
  const baseURL = "https://api.openweathermap.org/data/2.5/weather";

  const queryString = `?q=${encodeURIComponent(
    cityName
  )}&appid=${encodeURIComponent(
    process.env.OPENWEATHERMAP_APP_ID as string
  )}&units=metric&lang=ja`;

  try {
    const response = await fetch(baseURL + queryString, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return "Network response was not ok";
    }

    return data;
  } catch (error) {
    console.error("Error fetching weather data:", error);
    return null;
  }
}

export async function getUserAndOrganizations(accessToken: string) {
  const octokit = new Octokit({ auth: accessToken });

  const { data: user } = await octokit.rest.users.getAuthenticated();

  const { data: organizations } =
    await octokit.rest.orgs.listForAuthenticatedUser();

  const allEntities = [
    {
      username: user.login,
      avatar_url: user.avatar_url,
    },
    ...organizations.map((org) => ({
      username: org.login,
      avatar_url: org.avatar_url,
    })),
  ];

  return allEntities;
}

export async function getCountryInfo(country_code: string) {
  const response = await fetch(
    `https://restcountries.com/v3.1/alpha/${country_code}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    }
  );

  const data = await response.json();

  return data[0];
}

/**
 * 指定されたリポジトリをフォークする
 *
 * @param {string} username ユーザー名
 * @param {string} repo リポジトリ名
 * @param {string} accessToken アクセストークン
 * @param {string} [organization] 組織名（任意）
 * @returns フォーク結果のレスポンス
 */
export async function forkRepository({
  username,
  repo,
  accessToken,
  organization,
}: {
  username: string;
  repo: string;
  accessToken: string;
  organization?: string;
}) {
  const octokit = new Octokit({ auth: accessToken });

  const res = await octokit.request("POST /repos/{owner}/{repo}/forks", {
    owner: username,
    repo: repo,
    organization,
  });

  return res;
}

export async function searchRepositories(query: string, accessToken: string) {
  const octokit = new Octokit({ auth: accessToken });

  const response = await octokit.request("GET /search/repositories", {
    q: query,
    per_page: 6,
  });

  return response;
}
export async function getTrendingRepos(
  limit: number = 10,
  period: PeriodType = "past_24_hours",
  language: LanguageType = "All"
) {
  const response = await fetch(
    `https://api.ossinsight.io/v1/trends/repos?period=${period}&language=${language}`
  );
  console.log(
    `https://api.ossinsight.io/v1/trends/repos?period=${period}&language=${language}`
  );
  const { data } = await response.json();

  return {
    repos: data.rows.slice(0, limit).map((d: { repo_name: string }) => {
      d.repo_name = `https://github.com/${d.repo_name}`;
      return d;
    }) as RepoInfo[],
  };
}
