import { MeOutlinedIcon } from "@xpadev-net/designsystem-icons";
import { SiOpenai } from "react-icons/si";

export function AIMessage({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start">
      <div className="flex h-8 w-8 mr-3 shrink-0 select-none items-center justify-center rounded-md border shado bg-black">
        <SiOpenai className="h-4 w-4 text-white" />
      </div>
      {children}
    </div>
  );
}

export function UserMessage({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start">
      <div className="flex h-8 mr-3 w-8 shrink-0 select-none items-center justify-center rounded-md border shado bg-gray-100">
        <MeOutlinedIcon
          width="1em"
          height="1em"
          fill="currentColor"
          className="h-4 w-4"
        />
      </div>
      {children}
    </div>
  );
}
