---
title: Running Jetbrains remote dev servers on NixOS
date: '2023-07-10T00:33:45+01:00'
author: Oscar Molnar
authorTwitter: 'tymscar'
tags:
  - nix
  - development
  - linux
  - technical
keywords:
  - nix
  - development
  - linux
  - technical
description: I participated in this year's HTM CTF. Here is my experience!
showFullContent: false
readingTime: false
hideComments: true
draft: false
---

![A remote project](/jb-nix-remote-server/project.png)

For the past year or so I have been very interested in [NixOS and Nix][nix-website] in general.
I have set it up as my [main OS on my desktop][dotfiles], I have used it on remote VPS instances, and I have used it for local projects as well in the shape of nix environments.

However there has always been an issue, and that is hosting a remote Jetbrains instance on it that I can then connect to from anywhere else.

Long story short, the way it works is when a client tries to connect to the server, it checks to see if there is any instance of a Jetbrains IDE running.
If there is none, it tries to start one. All good up to this point, however, here is where the problems start: If there is no IDE present, or if it can't detect it, it sends over a package and it tries installing that, and because NixOS is not your standard Linux distro, it fails every time.

I have looked far and wide online and there hasn't been a good solution until I found this issue on GitHub: https://github.com/NixOS/nixpkgs/issues/153335

None of the solutions there were made specifically for Webstorm, which is what I needed, but the one by [Nicolas Guilloux][nicolas-solution], for PHPStorm, was something that in the end managed to work.

I have then spent a handful of hours trying to understand how does the patch work and why is it needed because I wanted to see if I can simplify it to make it less likey to break in future updates.

I managed to boil it down to 2 modification, and looking back through the history as far as I had patience for, this new patch seems to work with all of the previous versions, which gives me hope that it will continue to work in the future.

Here is my modified patch, if you want to follow along, save this as `JetbrainsRemoteDev.patch` in the same folder as your nix config:
{{< highlight diff >}}
--- a/plugins/remote-dev-server/bin/launcher.sh
+++ b/plugins/remote-dev-server/bin/launcher.sh
@@ -327,6 +327,8 @@
   REMOTE_DEV_SERVER_USE_SELF_CONTAINED_LIBS=1
 fi
 
+REMOTE_DEV_SERVER_USE_SELF_CONTAINED_LIBS=0
+
 if [ $REMOTE_DEV_SERVER_USE_SELF_CONTAINED_LIBS -eq 1 ]; then
   SELFCONTAINED_LIBS="$REMOTE_DEV_SERVER_DIR/selfcontained/lib"
   if [ ! -d "$SELFCONTAINED_LIBS" ]; then
@@ -568,3 +570,5 @@
     "$LAUNCHER" "$STARTER_COMMAND" "$PROJECT_PATH" "$@"
     ;;
 esac
+
+unset REMOTE_DEV_SERVER_USE_SELF_CONTAINED_LIBS

{{< /highlight >}}

I have spent a few hours trying to see if I can get it to work without the patch at all by setting the command line option myself before running the server, or doing it in the overlay, but it would fail either because the variable would be set to 1 and it wouldn't find the libraries (in the store) or because the variable was 0 and at the end of the launch script it would still be set and used by the IDE later down the line.

I have also made a few modifications to the overlay which would give you the opportunity of selecting multiple Jetbrains IDEs that you would want to use as remote servers. It worked with all of the ones I have tried.

If you're following at home, you just have to add the overlay to your config, for example as such:
{{< highlight elixir >}}
nixpkgs.overlays = [
  (final: prev:
  let
    toolNames = ["phpstorm" "webstorm"];
    makeToolOverlay = toolName: {
      ${toolName} = prev.jetbrains.${toolName}.overrideAttrs (old: {
        patches = (old.patches or []) ++ [ ./JetbrainsRemoteDev.patch ];
        installPhase = (old.installPhase or "") + ''
          makeWrapper "$out/$pname/bin/remote-dev-server.sh" "$out/bin/$pname-remote-dev-server" \
            --prefix PATH : "$out/libexec/$pname:${final.lib.makeBinPath [ final.jdk final.coreutils final.gnugrep final.which final.git ]}" \
            --prefix LD_LIBRARY_PATH : "${final.lib.makeLibraryPath ([ final.stdenv.cc.cc.lib final.libsecret final.e2fsprogs final.libnotify ])}" \
            --set-default JDK_HOME "${final.jetbrains.jdk}" \
            --set-default JAVA_HOME "${final.jetbrains.jdk}"
        '';
      });
    };
  in { jetbrains = prev.jetbrains // builtins.foldl' (acc: toolName: acc // makeToolOverlay toolName) {} toolNames; })
];
{{< /highlight >}}

Now all you have to do is add your favourite Jetbrains IDE to the `toolNames` list and don't forget to add it to your packages list as well, for example:
{{< highlight elixir >}}
environment.systemPackages = with pkgs; [
    # other packages here...
    jetbrains.webstorm
    jetbrains.phpstorm
    jetbrains.jdk 
  ];
{{< /highlight >}}

Note `jetbrains.jdk` being there! Without it, none of this works, so do not forget to add it there!

Now you need to `sudo nixos-rebuild switch` and start the server. The naming of the utility depends on the IDE you want to use, in my case `webstorm-remote-dev-server run <path to project>`.

That is all, now you can just open up Jetbrains Gateway, go to the SSH tab and just connect to your instance by clicking on the project. It will be the one selected with the previous command!

![Project list](/jb-nix-remote-server/projects.png)

[nix-website]: https://nixos.org/
[dotfiles]: https://github.com/tymscar/dotfiles
[nicolas-solution]: https://github.com/NixOS/nixpkgs/issues/153335#issuecomment-1465833977