"use client";

import { Input } from "@/components/ui/input";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useState } from "react";
import { useActions } from "ai/rsc";
import { AI } from "@/app/action";

export default function Fork({
  orgs,
  username,
  repo,
}: {
  orgs: {
    username: string;
    avatar_url: string;
  }[];
  username: string;
  repo: string;
}) {
  const [open, setOpen] = useState(false);
  const [owner, setOwner] = useState<
    | {
        username: string;
        avatar_url: string;
      }
    | undefined
  >(orgs[0] ?? null);
  const [forkUI, setForkUI] = useState<null | React.ReactNode>(null);
  const [repoName, setRepoName] = useState(repo);

  const { forkRepo } = useActions<typeof AI>();

  return forkUI ? (
    forkUI
  ) : (
    <div className="border shadow-md p-5 rounded-md">
      <h1 className="text-3xl font-bold mb-2">Fork</h1>
      <p>
        Fork {username}/{repo}.
      </p>
      <div className="flex mt-3 gap-x-3.5 items-center">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="w-[200px] justify-between"
            >
              {owner ? (
                <div className="flex items-center">
                  <img
                    src={owner.avatar_url}
                    className="h-5 w-5 mr-1.5 rounded-full border"
                    alt={owner.username}
                  />
                  {owner.username}
                </div>
              ) : (
                "Select Owner..."
              )}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[200px] p-0">
            <Command>
              <CommandInput placeholder="Search Organization..." />
              <CommandEmpty>Organization not found</CommandEmpty>
              <CommandGroup>
                {orgs.map((org) => (
                  <CommandItem
                    key={org.username}
                    value={org.username}
                    onSelect={() => {
                      setOwner(org);
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        owner?.username === org.username
                          ? "opacity-100"
                          : "opacity-0"
                      )}
                    />
                    <img
                      src={org.avatar_url}
                      className="h-5 w-5 mr-1.5 rounded-full border"
                      alt={org.username}
                    />
                    {org.username}
                  </CommandItem>
                ))}
              </CommandGroup>
            </Command>
          </PopoverContent>
        </Popover>
        <span>/</span>
        <Input
          value={repoName}
          onChange={(e) => setRepoName(e.target.value)}
          placeholder="Repository name..."
          className="w-[200px]"
        />
      </div>
      <div className="flex justify-end mt-5">
        <Button
          onClick={async () => {
            const response = await forkRepo({
              username,
              repo,
              owner: owner?.username,
            });
            setForkUI(response.forkUI);
          }}
        >
          Fork
        </Button>
      </div>
    </div>
  );
}
