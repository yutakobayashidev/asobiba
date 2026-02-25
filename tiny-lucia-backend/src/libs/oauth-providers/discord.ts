import { Discord } from "arctic"

const clientId = process.env.DISCORD_CLIENT_ID as string
const clientSecret = process.env.DISCORD_CLIENT_SECRET as string

const FRONTEND_URL = process.env.FRONTEND_URL as string;

const discord = new Discord(clientId, clientSecret, `${FRONTEND_URL}/auth/callback`);

const discordAuthUrl = async (state: string) => {

    const url: URL = await discord.createAuthorizationURL(state, {
        scopes: ["identify"]
    });

    return url;

}

const getDiscordTokens = async (code: string) => await discord.validateAuthorizationCode(code);

const getDiscordAccount = async (accessToken: string) => {

    const response = await fetch("https://discord.com/api/users/@me", {
        headers: {
            Authorization: `Bearer ${accessToken}`
        }
    });

    const user: DiscordUser = await response.json();

    return {
        id: user.id,
        username: user.username,
        email: user.email,
    }

}

interface DiscordUser {
    id: string;
    avatar: string;
    username: string;
    global_name: string;
    email: string;
}

export type { DiscordUser }

export { discordAuthUrl, getDiscordTokens, getDiscordAccount }