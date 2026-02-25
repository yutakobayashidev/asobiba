import { z } from "zod";

export const languageSchema = z
  .union([
    z.literal("All"),
    z.literal("JavaScript"),
    z.literal("Java"),
    z.literal("Python"),
    z.literal("PHP"),
    z.literal("C++"),
    z.literal("C#"),
    z.literal("TypeScript"),
    z.literal("Shell"),
    z.literal("C"),
    z.literal("Ruby"),
    z.literal("Rust"),
    z.literal("Go"),
    z.literal("Kotlin"),
    z.literal("HCL"),
    z.literal("PowerShell"),
    z.literal("CMake"),
    z.literal("Groovy"),
    z.literal("PLpgSQL"),
    z.literal("TSQL"),
    z.literal("Dart"),
    z.literal("Swift"),
    z.literal("HTML"),
    z.literal("CSS"),
    z.literal("Elixir"),
    z.literal("Haskell"),
    z.literal("Solidity"),
    z.literal("Assembly"),
    z.literal("R"),
    z.literal("Scala"),
    z.literal("Julia"),
    z.literal("Lua"),
    z.literal("Clojure"),
    z.literal("Erlang"),
    z.literal("Common Lisp"),
    z.literal("Emacs Lisp"),
    z.literal("OCaml"),
    z.literal("MATLAB"),
    z.literal("Objective-C"),
    z.literal("Perl"),
    z.literal("Fortran"),
  ])
  .optional()
  .default("All");

export const periodSchema = z
  .union([
    z.literal("past_24_hours"),
    z.literal("past_week"),
    z.literal("past_month"),
    z.literal("past_3_months"),
  ])
  .optional()
  .default("past_24_hours");
