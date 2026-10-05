# Dead Air

**A mystery hiding between the lines.**

An immersive, fictional radio case file built with Angular. Investigate the disappearance of lighthouse keeper Mira Vale by listening to intercepted transmissions, finding clues in their transcripts, connecting evidence on a pinboard, and deciding who to accuse.

## Run on Windows

1. Install Node.js 20.19+ or 22.12+.
2. Double-click `Start-DeadAir.bat`. On the first run it installs the app packages, then starts the local server.
3. Open the URL shown in the terminal (usually `http://localhost:4200`).

Or open a terminal in this folder and run `npm.cmd install`, then `npm.cmd start`.

## How to play

1. Open a transmission and click interesting transcript lines to save evidence.
2. On the evidence board, select the station access log and the weather report, then connect them.
3. Review the people of Greywick. Collect at least four clues and make an accusation.

Your case progress saves in local browser storage. The recordings are simulated for the game; the whole project runs locally and uses no account or external API.

## Build

```sh
npm run build
```
