# Leonida Platinum — GTA 6 Trophy Guide & Tracker

An offline web app that guides and tracks all 55 PlayStation 5 trophies of
Grand Theft Auto VI: the official names, descriptions and grades, a checklist
saved in the browser, export and import, filters by kind, a spoiler setting
that hides story trophies until earned, a roadmap to the platinum, and the
missable trophies flagged — each guide in our own words, citing its sources.

## Run it offline

Serve `app/` with any static file server, then open `index.html`:

```sh
cd app && python3 -m http.server 8080
```

No build step, no network requests at run time. Progress is stored only in
your browser (localStorage) and can be exported to a file and imported back.

## Hand it in

`main.ts` (Node 22+) copies `app/` and `screenshots/` to the output
directory and writes `dossier.json` with the kit's vendored
`buildDossier`:

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

## Sources

- Official trophy list (names, descriptions, grades, hidden flags): Exophase,
  cross-checked against PSNProfiles.
- Counts and locations: PushSquare, GTA 6 Trophy Guide & Roadmap.
- Cross-checks: Gamemapa, KeenGamer.

Guides are original writing. Anything not yet confirmed in the game says so
plainly — GTA 6 released on 19 November 2026 and this guide was written two
days later. No Rockstar Games logo, official artwork or game screenshot is
used anywhere.

## License

MIT — see `LICENSE`.
