// CBOR 인코딩
export function encodeUnsignedInt(value: number): number[] {
  if (value < 24) return [value];
  if (value < 256) return [0x18, value];
  if (value < 65536) return [0x19, (value >> 8) & 0xff, value & 0xff];
  throw new Error("Too large integer not supported");
}

export function encodeTextString(text: string): number[] {
  const utf8 = Array.from(new TextEncoder().encode(text));
  const lengthPrefix = encodeUnsignedInt(utf8.length);
  lengthPrefix[0] |= 0x60;
  return [...lengthPrefix, ...utf8];
}

export function encodeByteString(bytes: number[]): number[] {
  const lengthPrefix = encodeUnsignedInt(bytes.length);
  lengthPrefix[0] |= 0x40;
  return [...lengthPrefix, ...bytes];
}

export function encodeCBOR(value: any): number[] {
  if (value === null) return [0xf6];
  if (value === true) return [0xf5];
  if (value === false) return [0xf4];

  if (typeof value === "number" && Number.isInteger(value) && value >= 0)
    return encodeUnsignedInt(value);

  if (typeof value === "string") return encodeTextString(value);

  if (
    value instanceof Uint8Array ||
    (Array.isArray(value) && typeof value[0] === "number")
  )
    return encodeByteString(value as number[]);

  if (Array.isArray(value)) {
    const items = value.flatMap(encodeCBOR);
    const prefix = encodeUnsignedInt(value.length);
    prefix[0] |= 0x80;
    return [...prefix, ...items];
  }

  if (typeof value === "object") {
    const keys = Object.keys(value).sort();
    const pairs = keys.flatMap((key) => [
      ...encodeCBOR(key),
      ...encodeCBOR(value[key]),
    ]);
    const prefix = encodeUnsignedInt(keys.length);
    prefix[0] |= 0xa0;
    return [...prefix, ...pairs];
  }

  throw new Error(`Unsupported type: ${typeof value}`);
}

// TypeTable 관련
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
  const table: TypeTable = {"@type": {}, url: {}, none: {}};
  let t = 1,
    u = 1,
    n = 1;

  const add = (group: keyof TypeTable, value: string) => {
    if (!(value in table[group])) {
      table[group][value] =
        group === "@type" ? t++ : group === "url" ? u++ : n++;
    }
  };

  const walk = (obj: any) => {
    if (Array.isArray(obj)) return obj.forEach(walk);
    if (typeof obj === "object" && obj !== null) {
      for (const [k, v] of Object.entries(obj)) {
        if (k === "@context")
          (Array.isArray(v) ? v : [v]).forEach(
            (c) => typeof c === "string" && add("url", c)
          );
        else if (k === "type")
          (Array.isArray(v) ? v : [v]).forEach(
            (t) => typeof t === "string" && add("@type", t)
          );
        else if (typeof v === "string" && NONTYPED_KEYS.includes(k))
          add("none", v);
        walk(v);
      }
    }
  };

  walk(jsonld);
  return table;
}

// TermMap: key → int
export function generateTermMapFromContext(
  jsonld: any
): Record<string, number> {
  const map: Record<string, number> = {};
  let i = 1;
  const walk = (obj: any) => {
    if (Array.isArray(obj)) obj.forEach(walk);
    else if (typeof obj === "object" && obj !== null) {
      for (const [k, v] of Object.entries(obj)) {
        if (!(k in map)) map[k] = i++;
        walk(v);
      }
    }
  };
  walk(jsonld);
  return map;
}

// TermTable: key|value → int
export function generateTermTableFromJsonLD(
  jsonld: any
): Record<string, number> {
  const table: Record<string, number> = {};
  let i = 1;
  const visit = (obj: any) => {
    if (Array.isArray(obj)) return obj.forEach(visit);
    if (typeof obj === "object" && obj !== null) {
      for (const [k, v] of Object.entries(obj)) {
        if (typeof v === "string") {
          const composite = `${k}|${v}`;
          if (!(composite in table)) table[composite] = i++;
        }
        visit(v);
      }
    }
  };
  visit(jsonld);
  return table;
}

// 압축 적용
export function applyTypeTableCompression(
  value: any,
  typeTable: TypeTable,
  termMap: Record<string, number>,
  termTable: Record<string, number>
): any {
  if (Array.isArray(value)) {
    return value.map((v) =>
      applyTypeTableCompression(v, typeTable, termMap, termTable)
    );
  }

  if (typeof value === "object" && value !== null) {
    const compressed: Record<number, any> = {};
    for (const [k, v] of Object.entries(value)) {
      const keyId = termMap[k];
      if (keyId === undefined) throw new Error(`Missing termMap for key: ${k}`);

      if (typeof v === "string") {
        const termKey = `${k}|${v}`;
        compressed[keyId] = termTable[termKey] ?? typeTable.none[v] ?? v;
      } else if (k === "@context") {
        compressed[keyId] = (Array.isArray(v) ? v : [v]).map(
          (ctx: string) => typeTable.url[ctx] ?? ctx
        );
      } else if (k === "type") {
        compressed[keyId] = (Array.isArray(v) ? v : [v]).map(
          (t: string) => typeTable["@type"][t] ?? t
        );
      } else {
        compressed[keyId] = applyTypeTableCompression(
          v,
          typeTable,
          termMap,
          termTable
        );
      }
    }
    return compressed;
  }

  return value;
}

// prefix 생성 (CBOR Tag + Registry ID)
export function getVarintStructure(registryEntryId: number): Uint8Array {
  const tag = [0xd9, 0x06]; // Tag 51997
  return new Uint8Array([...tag, registryEntryId]);
}

// 최종 압축 함수
export function compressToCborLd(jsonld: any, registryEntryId = 1): Uint8Array {
  const typeTable = generateTypeTableFromJsonLD(jsonld);
  const termMap = generateTermMapFromContext(jsonld);
  const termTable = generateTermTableFromJsonLD(jsonld);

  const compressedJson = applyTypeTableCompression(
    jsonld,
    typeTable,
    termMap,
    termTable
  );
  const prefix = getVarintStructure(registryEntryId);
  const suffix = encodeCBOR(compressedJson);

  return new Uint8Array([...prefix, ...suffix]);
}
