// init express project

import express from 'express';
import cors from "cors";
import { config } from 'dotenv';
import authRoutes from "./routes/auth"
import { lucia } from './libs/lucia';
import { verifyRequestOrigin } from 'lucia';
import cookieParser from "cookie-parser";

config()

const app = express();

app.use(cors({
    origin: [process.env.FRONTEND_URL],
    credentials: true,
}));

app.use(cookieParser());

app.use(express.json());

app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
    if (req.method === "GET") {
        return next();
    }
    const originHeader = req.headers.origin ?? null;

    const hostHeader = req.headers.host ?? null;
    if (!originHeader || !hostHeader || !verifyRequestOrigin(originHeader, [hostHeader])) {
        return res.status(403).end();
    }
});

app.use(async (req, res, next) => {
    const sessionId = lucia.readSessionCookie(req.headers.cookie ?? "");
    if (!sessionId) {
        res.locals.user = null;
        res.locals.session = null;
        return next();
    }

    const { session, user } = await lucia.validateSession(sessionId);
    if (session && session.fresh) {
        res.appendHeader("Set-Cookie", lucia.createSessionCookie(session.id).serialize());
    }
    if (!session) {
        res.appendHeader("Set-Cookie", lucia.createBlankSessionCookie().serialize());
    }
    res.locals.user = user;
    res.locals.session = session;
    return next();
});


app.use('/auth', authRoutes);

app.listen(3001, () => {
    console.log(`Server running on port 3001`);
});