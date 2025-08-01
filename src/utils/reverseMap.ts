export type TermMap = Record<string, number>;
export type ReverseTermMap = Record<number, string>;

export type TermTable = Record<string, number>;
export type ReverseTermTable = Record<number, string>;

export type TypeTable = {
  "@type": Record<string, number>;
  url: Record<string, number>;
  none: Record<string, number>;
};

export type ReverseTypeTable = {
  "@type": Record<number, string>;
  url: Record<number, string>;
  none: Record<number, string>;
};

export function reverseTermMap(termMap: TermMap): ReverseTermMap {
  const rev: ReverseTermMap = {};
  for (const [key, id] of Object.entries(termMap)) {
    rev[id] = key;
  }
  return rev;
}

export function reverseTermTable(termTable: TermTable): ReverseTermTable {
  const rev: ReverseTermTable = {};
  for (const [kv, id] of Object.entries(termTable)) {
    const [, value] = kv.split("|");
    rev[id] = value;
  }
  return rev;
}

export function reverseTypeTable(typeTable: TypeTable): ReverseTypeTable {
  const rev: ReverseTypeTable = {
    "@type": {},
    url: {},
    none: {},
  };
  const groups = ["@type", "url", "none"] as const;
  for (const group of groups) {
    for (const [key, id] of Object.entries(typeTable[group])) {
      rev[group][id as number] = key;
    }
  }
  return rev;
}
