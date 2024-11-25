# Development Note Nov 2024
This project is no longer under development, but a re-write of the system is under progress to support v12+ of Foundry using their new data model and AppV2 frameworks. This will be entirely in native Javascript and will support SWN, CWN, and AWN. There is a small chance that this will support WWN also.

If you are a developer (either CSS/HTML or JS) and want to contribute please reach out to wintersleep1832 on discord.

# Stars Without Number: Revised

_The year is 3200 and mankind's empire lies in ashes._

_The Jump Gates fell six hundred years ago, severing the links between the myriad worlds of the human diaspora._

_Now, the long isolation of the Silence falls away as men and women return to the skies above their scattered worlds._

_Will you be among them once more?_

The is the open-source unofficial foundry system for Stars Without Number: Revised and Cities Without Number.
This project originally began as a fork of SpiceKing's SWNR system.


## Features

* Player characters
* NPCs
* Ships
* Drones
* Factions
* Mechs (but no data / compendium available)
* Vehicles
* Weapons, items, cyberware
* Psionic powers, foci, and support for magic based users

## Dev crash course

Note that the TypeScript definition files are out of date, so there are several compilation errors. There are plans to 
fix this with a v10 migration.

1. `npm install`
2. Copy `foundryconfig.example.json` to `foundryconfig.json` and make edits if you want a different dataPath for working from.
3. `npm run build:watch`
4. `npm run foundry` in a second terminal if you stuff a copy of Foundry into `./foundry` and want to use `./data` as your dataPath

### Special dev features

SK original system differs from many foundry systems:

* Avoiding Javascript for Typescript for better type sanity
* Since JSON it down right picky, I compile YAML into JSON
* The NeDB files are a pain for diffs, between compaction and the append only nature which scrambles the lines around, so I make them as well from a folder of YAML files.

## Support 

The best way to get support is on the [discord channel](https://discord.com/channels/351180092442935296/765417889938931732)

## Licence

This system is licensed under AGLP-3.0.

TL;DR: You mod it and share it, you send the changes. No ifs, ands, or butts.

The contents of `src/packs/` are mostly text from [SWN Revised Edition (Free Version)](https://www.drivethrurpg.com/product/230009/Stars-Without-Number-Revised-Edition-Free-Version) with slight alterations to better fit with Foundry VTT. All rights for the included content belong wto Kevin Crawford. I've followed what Kevin Crawford has said on Reddit. [[1]](https://www.reddit.com/r/SWN/comments/8g9lsp/is_there_a_standing_policy_on_selling_content/dy9vf8q/) [[2]](https://www.reddit.com/r/SWN/comments/cj1b7n/could_someone_explain_how_ogl_works_with_regards/)

## Abandonment

This project is in active development.
