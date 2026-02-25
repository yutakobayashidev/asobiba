{
  description = "A Nix-flake-based Bun development environment";

  inputs = {
    nixpkgs.url = "https://flakehub.com/f/NixOS/nixpkgs/0.1";
    flake-parts.url = "github:hercules-ci/flake-parts";
    agent-skills.url = "github:Kyure-A/agent-skills-nix";
    vercel-chat-skills = {
      url = "github:vercel/chat";
      flake = false;
    };
  };

  outputs =
    inputs:
    inputs.flake-parts.lib.mkFlake { inherit inputs; } {
      systems = [
        "x86_64-linux"
        "aarch64-linux"
        "x86_64-darwin"
        "aarch64-darwin"
      ];

      perSystem =
        { pkgs, ... }:
        let
          agentLib = inputs.agent-skills.lib.agent-skills;

          sources = {
            vercel-chat = {
              path = inputs.vercel-chat-skills;
              subdir = "skills";
            };
          };

          catalog = agentLib.discoverCatalog sources;
          allowlist = agentLib.allowlistFor {
            inherit catalog sources;
            enable = [ "chat" ];
          };
          selection = agentLib.selectSkills {
            inherit catalog allowlist sources;
            skills = { };
          };
          bundle = agentLib.mkBundle { inherit pkgs selection; };
          localTargets = {
            agents = agentLib.defaultLocalTargets.agents // { enable = true; };
            claude = agentLib.defaultLocalTargets.claude // { enable = true; };
            codex = agentLib.defaultLocalTargets.codex // { enable = true; };
          };
        in
        {
          devShells.default = pkgs.mkShellNoCC {
            packages = with pkgs; [ bun ];
            shellHook = agentLib.mkShellHook { inherit pkgs bundle; targets = localTargets; };
          };
        };
    };
}
