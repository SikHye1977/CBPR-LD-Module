type JsonLdContext = Record<string, any>;
type JsonLdObject = Record<string, any>;

async function fetchContext(url: string): Promise<JsonLdContext> {
  const res = await fetch(url);
  const json = await res.json();
  return json["@context"];
}

async function mergeContexts(
  contexts: (string | object)[]
): Promise<JsonLdContext> {
  const merged: JsonLdContext = {};
  for (const ctx of contexts) {
    if (typeof ctx === "string") {
      const remote = await fetchContext(ctx);
      Object.assign(merged, remote);
    } else if (typeof ctx === "object" && !Array.isArray(ctx)) {
      Object.assign(merged, ctx);
    }
  }
  return merged;
}

function expandWithContext(
  obj: JsonLdObject,
  context: JsonLdContext
): JsonLdObject {
  const result: JsonLdObject = {};
  for (const key in obj) {
    if (key === "@context") continue;

    const value = obj[key];
    const definition = context[key];

    if (typeof definition === "string") {
      result[definition] = [{"@value": value}];
    } else if (definition?.["@id"] && definition["@type"] === "@id") {
      result[definition["@id"]] = [{"@id": value}];
    } else if (Array.isArray(value)) {
      result[key] = value.map((v) =>
        typeof v === "object" ? expandWithContext(v, context) : v
      );
    } else if (typeof value === "object") {
      result[key] = [expandWithContext(value, context)];
    } else {
      result[key] = value;
    }
  }

  return result;
}

async function recursiveExpand(
  obj: JsonLdObject,
  parentContext: JsonLdContext
): Promise<JsonLdObject> {
  let currentContext = parentContext;

  if ("@context" in obj) {
    const rawCtx = obj["@context"];
    const ctxArray = Array.isArray(rawCtx) ? rawCtx : [rawCtx];
    const merged = await mergeContexts(ctxArray);
    currentContext = {...parentContext, ...merged};
  }

  const expanded = expandWithContext(obj, currentContext);

  for (const key in expanded) {
    const value = expanded[key];
    if (Array.isArray(value)) {
      expanded[key] = await Promise.all(
        value.map(async (v) =>
          typeof v === "object" ? await recursiveExpand(v, currentContext) : v
        )
      );
    }
  }

  return expanded;
}

export async function expand(input: JsonLdObject): Promise<JsonLdObject> {
  const rootCtxRaw = input["@context"] ?? {};
  const rootCtxArray = Array.isArray(rootCtxRaw) ? rootCtxRaw : [rootCtxRaw];
  const mergedRootContext = await mergeContexts(rootCtxArray);
  return await recursiveExpand(input, mergedRootContext);
}
