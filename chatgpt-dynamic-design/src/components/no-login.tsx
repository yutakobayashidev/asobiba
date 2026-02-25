"use client";

import { signIn } from "next-auth/react";
import { Icons } from "./icons";
import { AIMessage } from "./message";
import { Button } from "@/components/ui/button";

export default function NoLogin({
  repo,
  username,
}: {
  repo: string;
  username: string;
}) {
  return (
    <AIMessage>
      <div>
        <p className="mb-2">
          Authentication is required to fork {username}/{repo}. Please sign in.{" "}
        </p>
        <Button onClick={() => signIn("github")}>
          <Icons.gitHub className="h-3 w-3 mr-1.5" />
          Sign in
        </Button>
      </div>
    </AIMessage>
  );
}
