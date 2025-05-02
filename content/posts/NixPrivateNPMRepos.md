---
title: Using Nix to build JS/TS projects with private dependencies
date: '2025-05-02T16:50:41+00:00'
author: Oscar Molnar
authorTwitter: 'tymscar'
tags:
  - nix
  - linux
  - javascript
  - development
keywords:
  - nix
  - linux
  - javascript
  - development
description: How can you tell Nix to use private NPM registries without being impure?
showFullContent: false
readingTime: true
hideComments: true
draft: false
---

!["Running code from a private repo")](/nix-private-npm-repos/githubActioonsSuccess.png) 

Nix is a great tool for building software, especially in professional settings because of the guarantees it comes with.  
For example, you can be sure that the software you build is reproducible and that it will work on any machine.

When it comes to building packages in the Nix world, you usually end up going with derivation builders already made for you.

For Rust there is `rustPlatform.buildRustPackage`, for Go there is `go2nix`, for JS/TS there is `node2nix`, and so on.

## So what is the problem? Just use `node2nix`!

Well, I wish it were that easy. The problem arises when you try to use private dependencies in your project, and this is not a niche issue at all.

In fact, if the project your company works on is not fully open-source, you are most likely using private dependencies too.

What makes that a problem is that for `node2nix` to be able to build your project *and* be pure, it needs to download the dependencies at build-time, store them in the Nix store, and make them available to the build process.  
So at first I thought all I had to do was provide my secret token to `node2nix` and it would be able to download the dependencies.

But how do you do that? One way would be to set an environment variable with the token in it and then use that in your `package.json` file.  
That would be *impure*, because the build process would depend on the environment variable being set.

Another way—the one I ended up going with—was to use a `.yarnrc.yml` file and set the token there. For testing I hosted a [Verdaccio](https://verdaccio.org/) instance in my homelab, created a user, created a private package, and populated my `.yarnrc.yml` file like this:

```yaml
nodeLinker: node-modules
npmScopes:
  selfhosted:
    npmAlwaysAuth: true
    npmAuthIdent: tymscar:ultraSecretPassword
    npmRegistryServer: https://verdaccio.tymscar.com
```

Don't worry. The server has been taken down after the CI went green in the demo repository!

Now whenever I ran `yarn install` it correctly downloaded my private package from the registry, defined in my `package.json` file like this:

```json
{
  "name": "supernixtest",
  "version": "1.0.1",
  "main": "index.js",
  "license": "MIT",
  "type": "module",
  "dependencies": {
    "@selfhosted/tymscartest1": "1.1.2"
  }
}
```

Notice the `@selfhosted` scope. This is the same one defined in my `.yarnrc.yml` file.

## Cool! Does it work in Nix now?

Well, it does if I commit this file to my repo, yes, but that would mean my public repo will contain my private registry token.

I remembered that [a friend of mine](https://github.com/Jadarma/advent-of-code-kotlin-solutions/) used **git-crypt** to encrypt his Advent of Code input files, so I gave that a go and it worked. I installed git-crypt and added this to my `.gitattributes` file:

```gitattributes
.yarnrc.yml filter=git-crypt diff=git-crypt
```

### CI/CD workflow

![Github Actions](/nix-private-npm-repos/githubActions.png)

```yaml
name: CI Pipeline

on:
  push:
    branches:
      - main

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v2

      - name: Unlock secrets
        uses: sliteteam/github-action-git-crypt-unlock@1.2.0
        env:
          GIT_CRYPT_KEY: ${{ secrets.GIT_CRYPT_KEY }}

      - uses: cachix/install-nix-action@v31
        with:
          github_access_token: ${{ secrets.GITHUB_TOKEN }}

      - name: Run nix build
        run: nix build

      - name: Show tree structure of result directory
        run: |
          echo "Tree structure of result directory:"
          tree result

      - name: Run the main file (prints a message from the private repo)
        run: |
          echo "Running the main file..."
          nix run nixpkgs#nodejs -- result/index.js
```

I know, it looks a bit daunting if you've never done something like this, but in all honesty it's not too bad.  
Basically it downloads the repo, unlocks the secrets, installs Nix, builds the project, and runs it.  
To decrypt the secrets I just had to add `GIT_CRYPT_KEY` to my GitHub repository secrets.

## So what is the secret? Why did this take me so long to figure out?

In Nix there are two main kinds of derivations: the normal ones you use every day, and **FODs**.

**FOD** stands for *Fixed-Output Derivation*, and what makes them special is that they, unlike normal derivations, *have network access*. They can download files for you (such as private and public dependencies) and then store them in the Nix store, to be used by your normal derivations.

Does that mean FODs are not pure? No, actually they are. The only difference—and the way you define FODs—is by adding

```nix
outputHash = "YOUR_HASH_HERE";
```

to any derivation. That means you *know* what the output of the derivation will be, and you can verify that the output is correct.

So the way to solve the whole issue is by using two derivations:

1. **One FOD** that has network access, fetches your dependencies, and stores them in the Nix store.
2. **One normal derivation** that has access to those stored dependencies and builds your project.

### `flake.nix`

```nix
{
  description = "Node.js project with private npm registry support";

  inputs = {
    flake-parts.url = "github:hercules-ci/flake-parts";
    nixpkgs.url     = "github:NixOS/nixpkgs/nixos-24.11";
  };

  outputs = { flake-parts, ... } @ inputs:
    flake-parts.lib.mkFlake { inherit inputs; } {
      systems = [ "aarch64-darwin" "x86_64-linux" ];

      perSystem = { pkgs, ... }: let
        nodeEnv = ''
          export HOME="$NIX_BUILD_TOP"
          export YARN_ENABLE_TELEMETRY=0
          yarn config set enableGlobalCache false
        '';

        supportedArchitecturesJSON = builtins.toJSON {
          os   = [ "darwin" "linux" ];
          cpu  = [ "arm" "arm64" "ia32" "x64" ];
          libc = [ "glibc" "musl" ];
        };

        # 1. FOD: fetch dependencies
        yarnOfflineCache = pkgs.stdenvNoCC.mkDerivation {
          name = "super-nix-test-deps";
          src  = ./.;

          nativeBuildInputs = with pkgs; [ yarn-berry ];
          NODE_EXTRA_CA_CERTS = "${pkgs.cacert}/etc/ssl/certs/ca-bundle.crt";

          configurePhase = ''
            runHook preConfigure
            ${nodeEnv}
            yarn config set cacheFolder $out
            yarn config set supportedArchitectures --json '${supportedArchitecturesJSON}'
            runHook postConfigure
          '';

          buildPhase = ''
            runHook preBuild
            yarn install --immutable --mode skip-build
            runHook postBuild
          '';

          dontInstall     = true;
          outputHashAlgo  = "sha256";
          outputHashMode  = "recursive";
          outputHash      = "sha256-WLURUf/xCDOEPOs5jKPAhYfv7Qvy+yxNMMLsq6lLCEQ=";
        };
      in {
        # 2. Normal derivation: build the project
        packages.default = pkgs.stdenv.mkDerivation {
          pname    = "yarn-nix-private-repo-test";
          version  = "0.0.1";
          src      = ./.;

          nativeBuildInputs = with pkgs; [ nodejs yarn-berry ];

          configurePhase = ''
            runHook preConfigure
            ${nodeEnv}
            yarn config set cacheFolder ${yarnOfflineCache}
            runHook postConfigure
          '';

          buildPhase = ''
            runHook preBuild
            yarn install --immutable --immutable-cache
            runHook postBuild
          '';

          installPhase = ''
            mkdir -p $out
            cp -r . $out/
          '';
        };
      };
    };
}
```

Yes, it's quite long and seems daunting, but the main bits you need to understand are:

* **`yarnOfflineCache`** is the FOD that fetches the dependencies and stores them in the Nix store.
* **`packages.default`** is the derivation that builds your project. It uses the cache via  
  `yarn config set cacheFolder ${yarnOfflineCache}`.

## Ok, so what do I need to do now if I want to update my dependencies?

Quite simple, actually:

1. Work on the project as normal and run `yarn install` to update `yarn.lock`.
2. Delete the value of `outputHash` in the `yarnOfflineCache` derivation.
3. Run `nix build`. Nix will tell you the new hash—copy it back into `outputHash`.
4. Commit the changes. Your colleagues and CI can now run `nix build` without issues!

If you want to see the whole project on GitHub, so it's easier to copy-paste, you can find it [here](https://github.com/tymscar/Nix-Yarn-Private-Repo-Example).

Special thanks to [Kieran](https://github.com/TeamWolfyta) for spending a couple of hours with me on a Discord call trying to figure this out. Sorry it took this long to post the solution—it’s been weeks, but the part we were missing was the FOD with the output hash.
