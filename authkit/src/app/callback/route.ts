import { WorkOS } from "@workos-inc/node";
import { SignJWT } from "jose";
import { NextResponse } from "next/server";

const workos = new WorkOS(process.env.WORKOS_API_KEY);

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = new URL(request.url).searchParams.get("code") || "";

  const secret = new Uint8Array(
    Buffer.from(process.env.JWT_SECRET_KEY as string, "base64")
  );

  try {
    const { user } = await workos.userManagement.authenticateWithCode({
      clientId: process.env.WORKOS_CLIENT_ID || "",
      code,
    });

    const token = await new SignJWT({ user })
      .setProtectedHeader({ alg: "HS256", typ: "JWT" })
      .setIssuedAt()
      .setExpirationTime("1h")
      .sign(secret);

    url.searchParams.delete("code");

    url.pathname = "/";
    const response = NextResponse.redirect(url);

    response.cookies.set({
      name: "token",
      value: token,
      httpOnly: true,
      path: "/",
    });

    return response;
  } catch (error) {
    return NextResponse.json(error);
  }
}
