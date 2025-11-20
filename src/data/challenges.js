const BINGO_CHALLENGES = {
  // Easy Challenges (Common gameplay actions)
  easy: [
    "Get 5 kills in a single match",
    "Win a match",
    "Play as Sage",
    "Play as Jett",
    "Plant the spike 3 times",
    "Defuse the spike once",
    "Get a headshot kill",
    "Play on Bind",
    "Play on Haven",
    "Play on Split",
    "Win a pistol round",
    "Get an assist",
    "Use your ultimate ability",
    "Buy full armor in a round",
    "Survive a round without taking damage",
    "Get a kill with Classic",
    "Play 3 matches",
    "Win a round as attackers",
    "Win a round as defenders",
    "Use voice chat during match",
  ],

  // Medium Challenges (Require some skill/luck)
  medium: [
    "Get 10+ kills in a single match",
    "Get a double kill",
    "Clutch a 1v2 situation",
    "Get 3 headshot kills in one match",
    "Get a kill through smoke",
    "Get a wallbang kill",
    "Win without losing a single round",
    "Play as a Controller agent",
    "Play as an Initiator agent",
    "Get a kill with Operator",
    "Get a kill with Sheriff",
    "Flash and kill an enemy",
    "Get a multi-kill with your ultimate",
    "Plant spike and successfully defend it",
    "Win a match on Ascent",
    "Win a match on Icebox",
    "Get 5 first bloods in one match",
    "Win an eco round",
    "Get a knife kill",
    "Top frag in your team",
  ],

  // Hard Challenges (Require significant skill/dedication)
  hard: [
    "Get an Ace (5 kills in one round)",
    "Get 20+ kills in a single match",
    "Clutch a 1v3 situation",
    "Get a triple kill",
    "Win 3 matches in a row",
    "Get a collateral kill (one shot, two kills)",
    "Get 5 wallbang kills in one match",
    "Win a match without dying",
    "Get a 4K in a single round",
    "Win 5 pistol rounds in one match",
    "Get 10 first bloods in one match",
    "Clutch with a Classic only",
    "Get an ace with abilities only",
    "Win a 1v4 clutch",
    "Get a pentakill with Raze ult",
  ],

  // Agent Specific Challenges
  agentSpecific: {
    Jett: [
      "Get 3 kills after using Dash",
      "Get a kill while gliding with Updraft",
      "Ace with Blade Storm knives",
    ],
    Phoenix: [
      "Get a kill with Hot Hands",
      "Clutch using Run it Back",
      "Get 3 kills after using Blaze",
    ],
    Sage: [
      "Get 5 heals in one match",
      "Revive 3 teammates in one match",
      "Block a site with Barrier Orb",
    ],
    Sova: [
      "Get 10 recon assists in one match",
      "Get a kill with Shock Dart",
      "Reveal 5+ enemies with one Recon Dart",
    ],
    Brimstone: [
      "Get a triple kill with Orbital Strike",
      "Block defuse with smokes 3 times",
      "Get 15 smoke assists in one match",
    ],
    Viper: [
      "Get a kill with Snake Bite",
      "Control 2 sites with Toxic Screen",
      "Get 10 decay assists in one match",
    ],
    Cypher: [
      "Get 3 kills with Trapwire",
      "Reveal 8+ enemies with Spycam",
      "Get info on all 5 enemies in one round",
    ],
    Reyna: [
      "Get 4 Devours in one match",
      "Go invisible 5 times with Dismiss",
      "Get an ace while overheal",
    ],
    Killjoy: [
      "Get a double kill with Alarmbot/Nanoswarm combo",
      "Get 5 Turret assists in one match",
      "Lockdown an entire site successfully",
    ],
    Breach: [
      "Flash 8+ enemies in one match",
      "Get a kill with Aftershock",
      "Stun 10+ enemies with Fault Line",
    ],
  },

  // Map Specific Challenges
  mapSpecific: {
    Bind: [
      "Control both teleporters in one round",
      "Get a kill through the teleporter on A site",
      "Win without using Hookah",
    ],
    Haven: [
      "Successfully attack all three sites in one match",
      "Control Long C for an entire half",
      "Get a 4K on A site",
    ],
    Split: [
      "Control both ramps in one round",
      "Get a kill from Heaven",
      "Successfully rush B site 3 times",
    ],
    Ascent: [
      "Get a pick from A Main",
      "Control Mid for 5 rounds straight",
      "Get a kill through the doors on B site",
    ],
    Icebox: [
      "Get a kill from Yellow container",
      "Control Mid for 3 rounds",
      "Successfully execute A site 3 times",
    ],
  },

  // Weapon Challenges
  weaponChallenges: [
    "Get 5 kills with Vandal",
    "Get 5 kills with Phantom",
    "Get 3 kills with Operator",
    "Get a kill with each pistol in one match",
    "Get 10 kills with SMG weapons",
    "Win a round with Sheriff only",
    "Get 5 kills with Ares/Odin",
    "Get a one-tap headshot with Guardian",
    "Eco frag with Ghost",
    "Get 3 Marshal headshots in one match",
  ],

  // Fun/Meme Challenges
  funChallenges: [
    "Win a round buying only shields",
    "Get a kill while defusing",
    "Get killed by your own ability",
    "Win a round without buying anything",
    "Get a team kill (damage teammate)",
    "Clutch with 1 HP remaining",
    "Get a kill while blinded",
    "Win using only right-click with Classic",
    "Get a kill while falling",
    "Dance after getting an ace",
  ],
};

module.exports = BINGO_CHALLENGES;
