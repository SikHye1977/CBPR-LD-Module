export interface TypeTable {
  "@type": Record<string, number>;
  url: Record<string, number>;
  none: Record<string, number>;
}

const NONTYPED_KEYS = [
  "id",
  "issuer",
  "holder",
  "name",
  "ticketToken",
  "ticketNumber",
  "verificationMethod",
  "created",
];

export function generateTypeTableFromJsonLD(jsonld: any): TypeTable {
  const typeTable: TypeTable = {"@type": {}, url: {}, none: {}};
  let t = 1,
    u = 1,
    n = 1;

  const add = (tbl: any, key: keyof TypeTable, val: string) => {
    if (!(val in tbl[key])) {
      tbl[key][val] = key === "@type" ? t++ : key === "url" ? u++ : n++;
    }
  };

  const walk = (obj: any) => {
    if (Array.isArray(obj)) {
      obj.forEach(walk);
    } else if (typeof obj === "object" && obj !== null) {
      for (const [k, v] of Object.entries(obj)) {
        if (k === "@context") {
          const contexts = Array.isArray(v) ? v : [v];
          for (const c of contexts) {
            if (typeof c === "string") add(typeTable, "url", c);
          }
        } else if (k === "type") {
          const types = Array.isArray(v) ? v : [v];
          for (const t of types) {
            if (typeof t === "string") add(typeTable, "@type", t);
          }
        } else if (typeof v === "string" && NONTYPED_KEYS.includes(k)) {
          add(typeTable, "none", v);
        }

        // recursive step
        walk(v);
      }
    }
  };

  walk(jsonld);
  return typeTable;
}
