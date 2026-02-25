import { atomWithStorage } from "jotai/utils";

export const apiKeyAtom = atomWithStorage("OpenAIApiKey", "");
