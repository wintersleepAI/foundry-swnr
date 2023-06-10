# Stars Without Number: Revised

_The year is 3200 and mankind's empire lies in ashes._

_The Jump Gates fell six hundred years ago, severing the links between the myriad worlds of the human diaspora._

_Now, the long isolation of the Silence falls away as men and women return to the skies above their scattered worlds._

_Will you be among them once more?_

The is the open-source unofficial foundry system for Stars Without Number: Revised and Cities Without Number.
This project originally began as a fork of SpiceKing's SWNR system.

## Development Note June 2023
This project is still under active development, but is worked on sporadically when life allows.  Right now 
there are plans to add CWN features, fix a few issues introduced by foundry v10, fix issues for foundry v11, 
and eventually try to clean up some code issues (e.g. technical debt). 

Some of this debt relates to the dated type-script definitions, which results in compilation errors for TypeScript
and complicated code base for certain components. 

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
