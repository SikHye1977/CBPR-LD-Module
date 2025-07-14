type JsonLdObject = Record<string, any>;
type TermToIdMap = Map<string, number>;

export function compress(
  obj: JsonLdObject,
  termToId: TermToIdMap
): JsonLdObject {
  if (Array.isArray(obj)) {
    return obj.map((item) => compress(item, termToId));
  }

  if (typeof obj === "object" && obj !== null) {
    const result: JsonLdObject = {};

    for (const key in obj) {
      const newKey = termToId.has(key) ? termToId.get(key)! : key;
      result[newKey] = compress(obj[key], termToId);
    }

    return result;
  }

  return obj;
}
