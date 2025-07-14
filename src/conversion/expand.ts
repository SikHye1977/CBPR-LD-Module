// src/conversion/expand.ts
type JsonLdContext = Record<string, any>;
type JsonLdObject = Record<string, any>;

/**
 * @desc remote context들을 fetch해서 병합
 */
async function loadAndMergeContext(contexts: string[]): Promise<JsonLdContext> {
  const merged: JsonLdContext = {};

  for (const url of contexts) {
    const res = await fetch(url);
    const json = await res.json();
    const ctx = json["@context"];

    if (typeof ctx === "object" && !Array.isArray(ctx)) {
      Object.assign(merged, ctx);
    }
  }

  return merged;
}

/**
 * @desc JSON-LD 확장 함수
 */
function applyExpansion(
  input: JsonLdObject,
  context: JsonLdContext
): JsonLdObject {
  const result: JsonLdObject = {};

  for (const key in input) {
    if (key === "@context") continue;

    const value = input[key];
    const definition = context[key];

    if (typeof definition === "string") {
      result[definition] = [{"@value": value}];
    } else if (definition?.["@id"] && definition["@type"] === "@id") {
      result[definition["@id"]] = [{"@id": value}];
    } else if (Array.isArray(value)) {
      result[key] = value.map((v) =>
        typeof v === "object" ? applyExpansion(v, context) : v
      );
    } else if (typeof value === "object") {
      result[key] = [applyExpansion(value, context)];
    } else {
      result[key] = value;
    }
  }

  return result;
}

/**
 * @desc 외부에서 호출하는 함수: VP 전체 전개
 */
export async function expand(input: JsonLdObject): Promise<JsonLdObject> {
  const contextRaw = input["@context"];
  const contextUrls: string[] = Array.isArray(contextRaw)
    ? contextRaw
    : [contextRaw];

  const mergedContext = await loadAndMergeContext(contextUrls);
  return applyExpansion(input, mergedContext);
}
