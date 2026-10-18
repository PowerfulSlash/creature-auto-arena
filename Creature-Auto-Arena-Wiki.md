# Creature Auto Arena - Wiki

_Generated from the game's data. 92 units, 19 synergies, 18 items._

## Contents
1. [Rules](#rules)
2. [Shop odds & levels](#shop-odds--levels)
3. [Synergies](#synergies)
4. [Abilities](#abilities)
5. [Items](#items)
6. [Units](#units)

## Rules
- **Board & bench.** Your level equals the number of units you may field (Level 2 = 2 units … Level 9 = 9). The bench holds 8 units. You can only place units on the bottom 3 rows of the board.
- **Merging.** Three copies of the same unit at the same star level merge into one unit of the next star (max 3 stars). Items on the merged copies are kept (up to 3 per unit; extras return to your item stash). 2-star units have 2x HP and 1.8x attack; 3-star units have 4x HP and 3.2x attack.
- **Buying & selling.** Rerolling the shop costs 1 gold. Buying XP costs 4 gold for 4 XP. Selling gives back the cost for a 1-star unit, (cost x 3 - 1) for a 2-star and (cost x 9 - 1) for a 3-star, and returns equipped items.
- **Income each round.** Base 4 gold (stages 1-3) or 5 gold (stage 4+), +1 for winning, +1 interest per 10 gold you hold (max +5), and a streak bonus for consecutive wins or losses: 2-3 streak +1, 4-5 streak +2, 6+ streak +3. You also gain 2 XP every round.
- **Rounds.** Stages 1, 2 and 3 are wild encounters (very weak). Stage 9, 14, 19, 24, 28, 32, 36 and 40 are boss fights. Every other stage is player-vs-player (or vs a bot team). Winning a wild round drops items (1 item, 2 on boss stages).
- **Taking damage.** Losing a PvP round costs you 2 + floor(stage x 0.6) + the number of surviving enemy units, in HP. Losing a wild round costs 1 + floor(stage / 2) + surviving enemies. You start with 100 HP; at 0 you are eliminated.
- **Combat basics.** Units move toward the nearest enemy and attack automatically. Base attack speed is 0.8 attacks per second. Each attack gives +10 mana (plus any bonuses) and being hit gives +4 mana; when mana is full the unit casts its ability instead of attacking. Melee units have 90 mana, ranged units 70. Damage = attack x 30 / (30 + target defense). Everyone has a 5% base crit chance (crits deal 1.5x damage). A fight lasts at most 45 seconds; if both sides survive, the side with more total remaining HP wins.
- **Synergies.** Count the number of DIFFERENT species you have on the board that share a type (two copies of the same unit count once). Reaching a threshold activates that tier of the bonus for every unit of that type on your team. Units have two types, so they count towards two synergies.
- **Ranked (online).** Standard Elo, K=32, starting at 1000. Only ranked games with 2+ human players change ratings; each human is scored against every other human by finishing order. Quitting counts as an elimination.

## Shop odds & levels
Chance for each shop slot to be a unit of that cost, by your level. XP needed to reach the next level in the last column.

| Level | 1-cost | 2-cost | 3-cost | 4-cost | 5-cost | XP to next level |
|---|---|---|---|---|---|---|
| 1 | 100% | - | - | - | - | 2 |
| 2 | 100% | - | - | - | - | 6 |
| 3 | 70% | 30% | - | - | - | 10 |
| 4 | 50% | 40% | 10% | - | - | 22 |
| 5 | 36% | 42% | 20% | 2% | - | 34 |
| 6 | 25% | 40% | 30% | 5% | - | 52 |
| 7 | 15% | 35% | 35% | 15% | - | 72 |
| 8 | 11% | 27% | 35% | 22% | 5% | 72 |
| 9 | 5% | 20% | 35% | 30% | 10% | max |

## Synergies
_Thresholds count different species of that type on your board. Values in each effect line are listed in threshold order._

| Synergy | Thresholds | Effect (per threshold) | Units |
|---|---|---|---|
| **Normal** | 2 / 4 / 6 / 8 | Max HP +10/20/35/60% | 14 |
| **Sound** | 2 / 4 / 6 | +3/6/10 mana per attack | 9 |
| **Flying** | 2 / 4 / 6 / 8 | Attack speed +20/35/55/80% | 13 |
| **Fighting** | 2 / 4 / 6 / 8 | Attack +20/40/70/110% | 8 |
| **Poison** | 2 / 4 / 6 | Hits poison 1/2/3% max HP per sec | 7 |
| **Field** | 2 / 4 / 6 | Max HP +15/35/60% | 8 |
| **Wild** | 2 / 4 / 6 | Crit +15/30/50%, Atk +10/20/30% | 11 |
| **Fire** | 2 / 4 / 6 / 8 | Hits deal bonus 20/40/70/110% Atk | 10 |
| **Water** | 2 / 4 / 6 / 8 | Start with +20/35/50/70 mana | 9 |
| **Grass** | 2 / 4 / 6 | Regen 1/2/3.5% HP per sec | 7 |
| **Electric** | 2 / 4 / 6 | Hits chain to 1/2/3 more enemies | 8 |
| **Psychic** | 2 / 4 / 6 | Ability power +25/50/90% | 14 |
| **Dark** | 2 / 4 / 6 | Crit +10%, crit damage +40/80/140% | 11 |
| **Steel** | 2 / 4 / 6 | Defense +5/10/18 | 10 |
| **Ice** | 2 / 4 / 6 | Hits slow targets 40%, Def +2/4/8 | 8 |
| **Ghost** | 2 / 4 / 6 | Dodge 10/20/35% of attacks | 7 |
| **Bug** | 2 / 4 / 6 | Attack +10/20/30%, speed +10/20/35% | 11 |
| **Rock** | 2 / 4 / 6 | Reflect 10/20/35% melee dmg, Def +2/4/6 | 9 |
| **Ground** | 2 / 4 / 6 | Defense +3/6/10, HP +10/20/35% | 10 |

### Synergy details

#### Normal
- **Thresholds:** 2 / 4 / 6 / 8 different Normal units
- **Effect:** Max HP +10/20/35/60%
- **Ability style of Normal-primary units:** Power Shot
- **Units (14):** Beetlet (1), Cubby (1), Dreamling (1), Embrit (1), Fluffin (1), Frostkit (1), Pebblit (1), Pupling (1), Scrapper (1), Sprigle (1), Tinkit (1), Gloomcat (2), Ironpup (2), Mystifox (4)

#### Sound
- **Thresholds:** 2 / 4 / 6 different Sound units
- **Effect:** +3/6/10 mana per attack
- **Ability style of Sound-primary units:** Rally
- **Units (9):** Chirpy (1), Fluffin (1), Hummer (2), Mindling (2), Warblow (2), Echobat (3), Harmonix (4), Tsunamar (4), Wailspore (4)

#### Flying
- **Thresholds:** 2 / 4 / 6 / 8 different Flying units
- **Effect:** Attack speed +20/35/55/80%
- **Ability style of Flying-primary units:** Power Shot
- **Units (13):** Burrowl (1), Chirpy (1), Mothlet (1), Mothwing (2), Tidefin (2), Warblow (2), Sagewing (3), Stormraptor (3), Tempestcrow (3), Frostwyrm (4), Terradrake (4), Emberphoenix (5), Skybreaker (5)

#### Fighting
- **Thresholds:** 2 / 4 / 6 / 8 different Fighting units
- **Effect:** Attack +20/40/70/110%
- **Ability style of Fighting-primary units:** Shockwave
- **Units (8):** Scrapper (1), Boulderoo (2), Cragmite (2), Blazehorn (3), Brawlbear (3), Cryobear (3), Hornetking (3), Titanfist (4)

#### Poison
- **Thresholds:** 2 / 4 / 6 different Poison units
- **Effect:** Hits poison 1/2/3% max HP per sec
- **Ability style of Poison-primary units:** Drain
- **Units (7):** Mothlet (1), Toxipod (2), Webspin (2), Stingtail (3), Venomaw (3), Wailspore (4), Noxqueen (5)

#### Field
- **Thresholds:** 2 / 4 / 6 different Field units
- **Effect:** Max HP +15/35/60%
- **Ability style of Field-primary units:** Mend
- **Units (8):** Dewpup (1), Pupling (1), Leafawn (2), Snowhare (2), Voltmouse (2), Gaiaphant (3), Meadowdeer (3), Thunderstag (4)

#### Wild
- **Thresholds:** 2 / 4 / 6 different Wild units
- **Effect:** Crit +15/30/50%, Atk +10/20/30%
- **Ability style of Wild-primary units:** Power Shot
- **Units (11):** Cubby (1), Shadelet (1), Zaplet (1), Cindrake (2), Tuskboar (2), Boulderhorn (3), Brawlbear (3), Thornlion (3), Nightstalker (4), Phantomare (4), Voltwolf (4)

#### Fire
- **Thresholds:** 2 / 4 / 6 / 8 different Fire units
- **Effect:** Hits deal bonus 20/40/70/110% Atk
- **Ability style of Fire-primary units:** Shockwave
- **Units (10):** Embrit (1), Cindrake (2), Pyrofly (2), Blazehorn (3), Lanternwisp (3), Moltenback (3), Steelhound (3), Magmawyrm (4), Emberphoenix (5), Solarion (5)

#### Water
- **Thresholds:** 2 / 4 / 6 / 8 different Water units
- **Effect:** Start with +20/35/50/70 mana
- **Ability style of Water-primary units:** Mend
- **Units (9):** Dewpup (1), Shellkin (1), Coralisk (2), Glimmerfin (2), Tidefin (2), Aquadon (3), Glaciarch (4), Tsunamar (4), Abyssal (5)

#### Grass
- **Thresholds:** 2 / 4 / 6 different Grass units
- **Effect:** Regen 1/2/3.5% HP per sec
- **Ability style of Grass-primary units:** Drain
- **Units (7):** Sprigle (1), Ghoulet (2), Leafawn (2), Toxipod (2), Meadowdeer (3), Thornlion (3), Floraqueen (4)

#### Electric
- **Thresholds:** 2 / 4 / 6 different Electric units
- **Effect:** Hits chain to 1/2/3 more enemies
- **Ability style of Electric-primary units:** Paralyze
- **Units (8):** Sparkbug (1), Zaplet (1), Bolthide (2), Voltmouse (2), Stormraptor (3), Thunderstag (4), Voltwolf (4), Skybreaker (5)

#### Psychic
- **Thresholds:** 2 / 4 / 6 different Psychic units
- **Effect:** Ability power +25/50/90%
- **Ability style of Psychic-primary units:** Paralyze
- **Units (14):** Dreamling (1), Hexcub (2), Mindling (2), Aquadon (3), Sagewing (3), Spectrix (3), Floraqueen (4), Harmonix (4), Mystifox (4), Hivemind (5), Monolith (5), Noxqueen (5), Permafrost (5), Solarion (5)

#### Dark
- **Thresholds:** 2 / 4 / 6 different Dark units
- **Effect:** Crit +10%, crit damage +40/80/140%
- **Ability style of Dark-primary units:** Drain
- **Units (11):** Shadelet (1), Wispet (1), Gloomcat (2), Hexcub (2), Echobat (3), Tempestcrow (3), Venomaw (3), Nightstalker (4), Obsidian (4), Abyssal (5), Eclipsar (5)

#### Steel
- **Thresholds:** 2 / 4 / 6 different Steel units
- **Effect:** Defense +5/10/18
- **Ability style of Steel-primary units:** Shockwave
- **Units (10):** Tinkit (1), Bolthide (2), Ironpup (2), Quakeback (3), Steelhound (3), Cragtitan (4), Scarabeast (4), Titanfist (4), Colossus (5), Wraithlord (5)

#### Ice
- **Thresholds:** 2 / 4 / 6 different Ice units
- **Effect:** Hits slow targets 40%, Def +2/4/8
- **Ability style of Ice-primary units:** Paralyze
- **Units (8):** Frostkit (1), Glimmerfin (2), Snowhare (2), Cryobear (3), Glacipede (3), Frostwyrm (4), Glaciarch (4), Permafrost (5)

#### Ghost
- **Thresholds:** 2 / 4 / 6 different Ghost units
- **Effect:** Dodge 10/20/35% of attacks
- **Ability style of Ghost-primary units:** Drain
- **Units (7):** Wispet (1), Ghoulet (2), Lanternwisp (3), Spectrix (3), Phantomare (4), Eclipsar (5), Wraithlord (5)

#### Bug
- **Thresholds:** 2 / 4 / 6 different Bug units
- **Effect:** Attack +10/20/30%, speed +10/20/35%
- **Ability style of Bug-primary units:** Power Shot
- **Units (11):** Beetlet (1), Sparkbug (1), Hummer (2), Mothwing (2), Pyrofly (2), Webspin (2), Glacipede (3), Hornetking (3), Stingtail (3), Scarabeast (4), Hivemind (5)

#### Rock
- **Thresholds:** 2 / 4 / 6 different Rock units
- **Effect:** Reflect 10/20/35% melee dmg, Def +2/4/6
- **Ability style of Rock-primary units:** Shockwave
- **Units (9):** Gritlet (1), Shellkin (1), Coralisk (2), Cragmite (2), Boulderhorn (3), Moltenback (3), Cragtitan (4), Obsidian (4), Monolith (5)

#### Ground
- **Thresholds:** 2 / 4 / 6 different Ground units
- **Effect:** Defense +3/6/10, HP +10/20/35%
- **Ability style of Ground-primary units:** Shockwave
- **Units (10):** Burrowl (1), Gritlet (1), Pebblit (1), Boulderoo (2), Tuskboar (2), Gaiaphant (3), Quakeback (3), Magmawyrm (4), Terradrake (4), Colossus (5)

## Abilities
Every unit's ability is set by its **first** type.

| Ability | Effect | Used by first type |
|---|---|---|
| **Power Shot** | Deals 3x Atk to its target. Scales with ability power. | Normal, Flying, Wild, Bug |
| **Shockwave** | Deals 2x Atk to all adjacent enemies. Scales with ability power. | Fighting, Fire, Steel, Rock, Ground |
| **Mend** | Heals the weakest ally. Scales with ability power. | Field, Water |
| **Rally** | Allies within 2 tiles gain +20% Atk. Scales with ability power. | Sound |
| **Paralyze** | Stuns the target for 1.5s and deals 1.5x Atk. Scales with ability power. | Electric, Psychic, Ice |
| **Drain** | Deals 2.2x Atk and heals half of it. Scales with ability power. | Poison, Grass, Dark, Ghost |

## Items
Each unit can hold up to 3 items. Items drop from wild rounds and bosses; drag them onto a unit during the prep phase.

| Item | Effect |
|---|---|
| **Power Band** | +8 Attack |
| **Iron Plate** | +8 Defense |
| **Swift Charm** | +25% attack speed |
| **Mana Orb** | +30 starting mana |
| **Hearty Berry** | +90 max HP |
| **Sharp Lens** | +25% crit chance |
| **Regrowth Leaf** | Regen 1.5% HP per sec |
| **Mind Wand** | +40% ability power |
| **Speed Scarf** | +35% move speed |
| **Aegis Charm** | Starts with a shield (30% max HP) |
| **Vampire Fang** | Heal 25% of attack damage |
| **Blast Core** | Attacks splash adjacent foes for 50% |
| **Venom Vial** | Attacks poison for 2% HP/s |
| **Frost Gem** | Attacks slow the target 40% |
| **Rage Totem** | +30% Attack |
| **King's Crown** | +12% to all stats |
| **Thorn Mail** | Reflect 20% of melee damage taken |
| **Time Gear** | +8 mana per attack |

## Units
Base stats are for 1-star. 2-star = 2x HP, 1.8x attack. 3-star = 4x HP, 3.2x attack. Range 1 = melee. "Mana" is the amount needed to cast.

### 1-cost (Common)

| Unit | Types | HP | Attack | Defense | Range | Mana | Ability |
|---|---|---|---|---|---|---|---|
| **Beetlet** | Bug / Normal | 75 | 7 | 5 | 1 | 90 | Power Shot |
| **Burrowl** | Ground / Flying | 75 | 7 | 5 | 1 | 90 | Shockwave |
| **Chirpy** | Flying / Sound | 75 | 7 | 5 | 1 | 90 | Power Shot |
| **Cubby** | Wild / Normal | 75 | 7 | 5 | 1 | 90 | Power Shot |
| **Dewpup** | Water / Field | 75 | 7 | 5 | 1 | 90 | Mend |
| **Dreamling** | Psychic / Normal | 51 | 8 | 3 | 3 | 70 | Paralyze |
| **Embrit** | Fire / Normal | 75 | 7 | 5 | 1 | 90 | Shockwave |
| **Fluffin** | Normal / Sound | 75 | 7 | 5 | 1 | 90 | Power Shot |
| **Frostkit** | Ice / Normal | 75 | 7 | 5 | 1 | 90 | Paralyze |
| **Gritlet** | Rock / Ground | 75 | 7 | 5 | 1 | 90 | Shockwave |
| **Mothlet** | Poison / Flying | 51 | 8 | 3 | 3 | 70 | Drain |
| **Pebblit** | Ground / Normal | 75 | 7 | 5 | 1 | 90 | Shockwave |
| **Pupling** | Normal / Field | 75 | 7 | 5 | 1 | 90 | Power Shot |
| **Scrapper** | Fighting / Normal | 75 | 7 | 5 | 1 | 90 | Shockwave |
| **Shadelet** | Dark / Wild | 75 | 7 | 5 | 1 | 90 | Drain |
| **Shellkin** | Water / Rock | 75 | 7 | 5 | 1 | 90 | Mend |
| **Sparkbug** | Bug / Electric | 75 | 7 | 5 | 1 | 90 | Power Shot |
| **Sprigle** | Grass / Normal | 51 | 8 | 3 | 3 | 70 | Drain |
| **Tinkit** | Steel / Normal | 75 | 7 | 5 | 1 | 90 | Shockwave |
| **Wispet** | Ghost / Dark | 75 | 7 | 5 | 1 | 90 | Drain |
| **Zaplet** | Electric / Wild | 51 | 8 | 3 | 3 | 70 | Paralyze |

### 2-cost (Uncommon)

| Unit | Types | HP | Attack | Defense | Range | Mana | Ability |
|---|---|---|---|---|---|---|---|
| **Bolthide** | Steel / Electric | 113 | 10 | 7 | 1 | 90 | Shockwave |
| **Boulderoo** | Ground / Fighting | 113 | 10 | 7 | 1 | 90 | Shockwave |
| **Cindrake** | Fire / Wild | 113 | 10 | 7 | 1 | 90 | Shockwave |
| **Coralisk** | Water / Rock | 113 | 10 | 7 | 1 | 90 | Mend |
| **Cragmite** | Rock / Fighting | 113 | 10 | 7 | 1 | 90 | Shockwave |
| **Ghoulet** | Ghost / Grass | 113 | 10 | 7 | 1 | 90 | Drain |
| **Glimmerfin** | Water / Ice | 113 | 10 | 7 | 1 | 90 | Mend |
| **Gloomcat** | Dark / Normal | 113 | 10 | 7 | 1 | 90 | Drain |
| **Hexcub** | Psychic / Dark | 77 | 12 | 5 | 3 | 70 | Paralyze |
| **Hummer** | Sound / Bug | 77 | 12 | 5 | 3 | 70 | Rally |
| **Ironpup** | Steel / Normal | 113 | 10 | 7 | 1 | 90 | Shockwave |
| **Leafawn** | Grass / Field | 77 | 12 | 5 | 3 | 70 | Drain |
| **Mindling** | Psychic / Sound | 77 | 12 | 5 | 3 | 70 | Paralyze |
| **Mothwing** | Bug / Flying | 113 | 10 | 7 | 1 | 90 | Power Shot |
| **Pyrofly** | Fire / Bug | 113 | 10 | 7 | 1 | 90 | Shockwave |
| **Snowhare** | Ice / Field | 113 | 10 | 7 | 1 | 90 | Paralyze |
| **Tidefin** | Water / Flying | 113 | 10 | 7 | 1 | 90 | Mend |
| **Toxipod** | Poison / Grass | 77 | 12 | 5 | 3 | 70 | Drain |
| **Tuskboar** | Wild / Ground | 113 | 10 | 7 | 1 | 90 | Power Shot |
| **Voltmouse** | Electric / Field | 77 | 12 | 5 | 3 | 70 | Paralyze |
| **Warblow** | Sound / Flying | 77 | 12 | 5 | 3 | 70 | Rally |
| **Webspin** | Bug / Poison | 113 | 10 | 7 | 1 | 90 | Power Shot |

### 3-cost (Rare)

| Unit | Types | HP | Attack | Defense | Range | Mana | Ability |
|---|---|---|---|---|---|---|---|
| **Aquadon** | Water / Psychic | 163 | 14 | 10 | 1 | 90 | Mend |
| **Blazehorn** | Fire / Fighting | 163 | 14 | 10 | 1 | 90 | Shockwave |
| **Boulderhorn** | Rock / Wild | 163 | 14 | 10 | 1 | 90 | Shockwave |
| **Brawlbear** | Fighting / Wild | 163 | 14 | 10 | 1 | 90 | Shockwave |
| **Cryobear** | Ice / Fighting | 163 | 14 | 10 | 1 | 90 | Paralyze |
| **Echobat** | Sound / Dark | 111 | 16 | 8 | 3 | 70 | Rally |
| **Gaiaphant** | Ground / Field | 163 | 14 | 10 | 1 | 90 | Shockwave |
| **Glacipede** | Ice / Bug | 163 | 14 | 10 | 1 | 90 | Paralyze |
| **Hornetking** | Bug / Fighting | 163 | 14 | 10 | 1 | 90 | Power Shot |
| **Lanternwisp** | Ghost / Fire | 163 | 14 | 10 | 1 | 90 | Drain |
| **Meadowdeer** | Field / Grass | 163 | 14 | 10 | 1 | 90 | Mend |
| **Moltenback** | Rock / Fire | 163 | 14 | 10 | 1 | 90 | Shockwave |
| **Quakeback** | Ground / Steel | 163 | 14 | 10 | 1 | 90 | Shockwave |
| **Sagewing** | Psychic / Flying | 111 | 16 | 8 | 3 | 70 | Paralyze |
| **Spectrix** | Ghost / Psychic | 163 | 14 | 10 | 1 | 90 | Drain |
| **Steelhound** | Steel / Fire | 163 | 14 | 10 | 1 | 90 | Shockwave |
| **Stingtail** | Poison / Bug | 111 | 16 | 8 | 3 | 70 | Drain |
| **Stormraptor** | Electric / Flying | 111 | 16 | 8 | 3 | 70 | Paralyze |
| **Tempestcrow** | Flying / Dark | 163 | 14 | 10 | 1 | 90 | Power Shot |
| **Thornlion** | Grass / Wild | 111 | 16 | 8 | 3 | 70 | Drain |
| **Venomaw** | Poison / Dark | 111 | 16 | 8 | 3 | 70 | Drain |

### 4-cost (Epic)

| Unit | Types | HP | Attack | Defense | Range | Mana | Ability |
|---|---|---|---|---|---|---|---|
| **Cragtitan** | Rock / Steel | 225 | 19 | 13 | 1 | 90 | Shockwave |
| **Floraqueen** | Grass / Psychic | 153 | 22 | 11 | 3 | 70 | Drain |
| **Frostwyrm** | Ice / Flying | 225 | 19 | 13 | 1 | 90 | Paralyze |
| **Glaciarch** | Ice / Water | 225 | 19 | 13 | 1 | 90 | Paralyze |
| **Harmonix** | Sound / Psychic | 153 | 22 | 11 | 3 | 70 | Rally |
| **Magmawyrm** | Fire / Ground | 225 | 19 | 13 | 1 | 90 | Shockwave |
| **Mystifox** | Psychic / Normal | 153 | 22 | 11 | 3 | 70 | Paralyze |
| **Nightstalker** | Dark / Wild | 225 | 19 | 13 | 1 | 90 | Drain |
| **Obsidian** | Rock / Dark | 225 | 19 | 13 | 1 | 90 | Shockwave |
| **Phantomare** | Ghost / Wild | 225 | 19 | 13 | 1 | 90 | Drain |
| **Scarabeast** | Bug / Steel | 225 | 19 | 13 | 1 | 90 | Power Shot |
| **Terradrake** | Ground / Flying | 225 | 19 | 13 | 1 | 90 | Shockwave |
| **Thunderstag** | Electric / Field | 153 | 22 | 11 | 3 | 70 | Paralyze |
| **Titanfist** | Fighting / Steel | 225 | 19 | 13 | 1 | 90 | Shockwave |
| **Tsunamar** | Water / Sound | 225 | 19 | 13 | 1 | 90 | Mend |
| **Voltwolf** | Electric / Wild | 153 | 22 | 11 | 3 | 70 | Paralyze |
| **Wailspore** | Sound / Poison | 153 | 22 | 11 | 3 | 70 | Rally |

### 5-cost (Ultra)

| Unit | Types | HP | Attack | Defense | Range | Mana | Ability |
|---|---|---|---|---|---|---|---|
| **Abyssal** | Water / Dark | 313 | 26 | 17 | 1 | 90 | Mend |
| **Colossus** | Steel / Ground | 313 | 26 | 17 | 1 | 90 | Shockwave |
| **Eclipsar** | Ghost / Dark | 313 | 26 | 17 | 1 | 90 | Drain |
| **Emberphoenix** | Fire / Flying | 313 | 26 | 17 | 1 | 90 | Shockwave |
| **Hivemind** | Bug / Psychic | 313 | 26 | 17 | 1 | 90 | Power Shot |
| **Monolith** | Rock / Psychic | 313 | 26 | 17 | 1 | 90 | Shockwave |
| **Noxqueen** | Poison / Psychic | 213 | 30 | 15 | 3 | 70 | Drain |
| **Permafrost** | Ice / Psychic | 313 | 26 | 17 | 1 | 90 | Paralyze |
| **Skybreaker** | Flying / Electric | 313 | 26 | 17 | 1 | 90 | Power Shot |
| **Solarion** | Fire / Psychic | 313 | 26 | 17 | 1 | 90 | Shockwave |
| **Wraithlord** | Ghost / Steel | 313 | 26 | 17 | 1 | 90 | Drain |
