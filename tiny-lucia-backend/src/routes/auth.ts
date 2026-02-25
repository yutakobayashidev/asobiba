import { generateState } from 'arctic';
import express from 'express';
import { discordAuthUrl, getDiscordAccount, getDiscordTokens } from '../libs/oauth-providers/discord';
import { prisma } from "../libs/prisma"
import { lucia } from 'src/libs/lucia';
import { generateIdFromEntropySize, Session, User } from "lucia";

const app = express.Router();

app.post('/discord', async (_, res) => {

    const state = generateState();
    const redirectUrl = await discordAuthUrl(state);

    const nodeEnv = process.env.NODE_ENV;

    res.cookie("discord_oauth_state", state, {
        path: "/",
        secure: nodeEnv === "production",
        httpOnly: true,
        sameSite: "lax",
        maxAge: 600000,
    })

    return res.status(200).json({ redirectUrl });

});

app.post('/discord/callback', async (req, res) => {

    const { code, state } = req.body;

    if (!code || !state) {
        return res.status(400).send("Missing code or state");
    }

    const storedState = req.cookies.discord_oauth_state;

    if (!(storedState) || state !== storedState) {
        return res.status(400).send("Invalid state");
    }

    const tokens = await getDiscordTokens(code);

    const account = await getDiscordAccount(tokens.accessToken);

    const existingAccount = await prisma.oAuthAccount.findFirst({
        where: {
            providerAccountId: account.id,
            provider: "discord"
        },
        include: {
            user: true
        }
    });

    if (existingAccount) {

        const session = await lucia.createSession(existingAccount.user.id, {});
        const sessionCookie = lucia.createSessionCookie(session.id);

        res.cookie(sessionCookie.name, sessionCookie.value, {
            ...sessionCookie.attributes,
            ...(sessionCookie.attributes.maxAge !== undefined && { maxAge: sessionCookie.attributes.maxAge * 1000 }),
        });


        return res.status(200).json({ user: existingAccount.user });
    }

    const user = await prisma.user.findUnique({
        where: {
            email: account.email,
        },
    });

    if (user) {
        return res.status(400).json({ message: "Email already in use" });
    }

    const userId = generateIdFromEntropySize(10)

    await prisma.$transaction(async (prisma) => {
        const newUser = await prisma.user.create({
            data: {
                id: userId,
                email: account.email,
                name: account.username,
            },
        });

        await prisma.oAuthAccount.create({
            data: {
                provider: "line",
                providerAccountId: account.id,
                userId: newUser.id,
            },
        });

        const session = await lucia.createSession(userId, {});
        const sessionCookie = lucia.createSessionCookie(session.id);

        res.cookie(sessionCookie.name, sessionCookie.value, {
            ...sessionCookie.attributes,
            ...(sessionCookie.attributes.maxAge !== undefined && { maxAge: sessionCookie.attributes.maxAge * 1000 }),
        });
        res.clearCookie("redirect_to");

        return res.status(200).json({ user: newUser });

    });

});

app.post('/logout', async (_, res) => {

    if (!res.locals.user || !res.locals.session) {
        return res.status(403).end();
    }

    await lucia.invalidateSession(res.locals.session.id)

    res.appendHeader("Set-Cookie", lucia.createBlankSessionCookie().serialize())

    return res.status(200).end();

});

export default app;

declare global {
    namespace Express {
        interface Locals {
            user: User | null;
            session: Session | null;
        }
    }
}