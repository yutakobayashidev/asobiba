import { WorkOS, type User } from "@workos-inc/node";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { redirect } from "next/navigation";

const workos = new WorkOS(process.env.WORKOS_API_KEY);

async function getUser(): Promise<{
  isAuthenticated: boolean;
  user?: User | null;
}> {
  const token = cookies().get("token")?.value;

  if (token) {
    const secret = new Uint8Array(
      Buffer.from(process.env.JWT_SECRET_KEY as string, "base64")
    );

    const { payload } = await jwtVerify(token, secret);
    if (payload) {
      return {
        isAuthenticated: true,
        user: payload.user as User | null,
      };
    }
  }

  return { isAuthenticated: false };
}

export default async function Basic({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const { user } = await getUser();

  const authKitUrl = workos.userManagement.getAuthorizationUrl({
    clientId: process.env.WORKOS_CLIENT_ID || "",
    provider: "authkit",
    redirectUri: "http://localhost:3000/callback",
  });

  return (
    <div>
      {user ? (
        <>
          <h1>
            👋 Hi. {user.firstName} {user.lastName}
          </h1>
          <p>{user.email}</p>
          <form
            action={async () => {
              "use server";
              cookies().delete("token");
              redirect("/");
            }}
          >
            <button type="submit">Sign-out</button>
          </form>
        </>
      ) : (
        <>
          <a href={authKitUrl}>Sign-in</a>
        </>
      )}
    </div>
  );
}
