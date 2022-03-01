import {
  option,
  struct,
  table,
  union,
  vector,
} from "@ckb-lumos-experiment/molecule/lib/layout";
import {
  byte,
  createByteCodec,
  Uint32LE,
  UTF8String,
} from "@ckb-lumos-experiment/molecule/lib/common";

export const schema = `
  table Character {
    main_equip: Equip,
    sub_equip: EquipOpt,
  }

  option EquipOpt (Equip);

  union Equip {
    Sword,
    Wand,
    Bow,
  }

  struct Sword {
    material: byte,
  }

  table Wand {
    gems: GemVec,
    desc: DescOpt,
  }

  vector GemVec <Gem>;

  struct Gem {
    color: byte,
    shape: byte,
  }

  table Bow {
    arrows: Uint32,
    desc: DescOpt,
  }

  option DescOpt (UTF8String);

  # convention types
  array Uint32 [byte; 4];
  vector UTF8String <byte>;
`;

// custom type
type SwordMaterial = "wood" | "steel" | "crystal";
const Material = createByteCodec<SwordMaterial>({
  pack: (material) => {
    if (material === "wood") return 0;
    if (material === "steel") return 1;
    if (material === "crystal") return 2;

    throw new Error("Unknown material " + material);
  },
  unpack: (bin) => {
    if (bin === 0) return "wood";
    if (bin === 1) return "steel";
    if (bin === 2) return "crystal";

    throw new Error("Unknown material binary: " + bin);
  },
});

/***** molecule binding *****/
// option DescOpt (UTF8String);
const DescOpt = option(UTF8String);

// struct Sword {
//   material: byte,
// }
const Sword = struct(
  {
    material: Material,
  },
  ["material"]
);

// struct Gem {
//   color: byte,
//   shape: byte,
// }
const Gem = struct(
  {
    color: byte,
    shape: byte,
  },
  ["color", "shape"]
);
const GemVec = vector(Gem);
const Wand = table(
  {
    gems: GemVec,
    desc: DescOpt,
  },
  ["gems", "desc"]
);

// table Bow {
//   arrows: Uint32,
//   desc: DescOpt,
// }
const Bow = table(
  {
    arrow: Uint32LE,
    desc: DescOpt,
  },
  ["arrow", "desc"]
);

// union Equip {
//   Sword,
//   Wand,
//   Bow,
// }
const Equip = union(
  {
    Sword,
    Wand,
    Bow,
  },
  ["Sword", "Wand", "Bow"]
);

// option EquipOpt (Equip);
const EquipOpt = option(Equip);

// table Character {
//   main_equip: Equip,
//   sub_equip: EquipOpt,
// }
const Character = table({ main_equip: Equip, sub_equip: EquipOpt }, [
  "main_equip",
  "sub_equip",
]);

/* usage */
const buf = Character.pack({
  main_equip: {
    type: "Bow",
    value: { arrow: 10, desc: "nice bow" },
  },
  sub_equip: {
    type: "Sword",
    value: { material: "steel" },
  },
  // sub_equip: {
  //   type: "Wand",
  //   value: { gems: [{ color: 1, shape: 2 }], desc: "utf8 string" },
  // },
});

const archer = Character.unpack(buf);
const mainEquip = archer.main_equip;
if (mainEquip.type === "Sword" && mainEquip.value.material === "wood") {
  console.log("hey, Yuusya, is that a toy in your hand");
}
