import { PrismaAdapter } from "@lucia-auth/adapter-prisma";
import { Lucia } from "lucia";
import { prisma } from "../libs/prisma";

const adapter = new PrismaAdapter(prisma.session, prisma.user);

export const lucia = new Lucia(adapter, {
    sessionCookie: {
        attributes: {
            // set to `true` when using HTTPS
            secure: process.env.NODE_ENV === "production",
        },
    },
    getUserAttributes: (attributes) => {
        return {
            email: attributes.email,
            name: attributes.name,
        }
    },
});

declare module "lucia" {

    interface Register {
        Lucia: typeof Lucia,
        DatabaseUserAttributes: DatabaseUserAttributes
    }

}

interface DatabaseUserAttributes {
    name: string;
    email: string;
}