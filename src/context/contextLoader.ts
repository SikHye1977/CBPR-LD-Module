import {
  CBORLDState,
  ContextEntry,
  TermDefinition,
} from "../interface/interface";

export function initCBORLDState(
  strategy: "compression" | "decompression"
): CBORLDState {
  const keywords = new Map<string, number>([
    ["@context", 0],
    ["@type", 2],
    ["@id", 4],
    ["@value", 6],
    ["@language", 8],
    ["@list", 10],
    ["@graph", 12],
    ["@set", 14],
    ["@reverse", 16],
  ]);

  const state: CBORLDState = {
    strategy,
    contextMap: new Map(),
    keywordsMap: keywords,
    termToId: new Map(keywords),
    nextTermId: 100,
    idToTerm: strategy === "decompression" ? new Map() : undefined,
  };

  if (strategy === "decompression") {
    for (const [term, id] of keywords.entries()) {
      state.idToTerm!.set(id, term);
    }
  }

  return state;
}

export async function loadExternalContext(
  state: CBORLDState,
  url: string
): Promise<void> {
  if (state.contextMap.has(url)) return;

  const response = await fetch(url);
  const json = await response.json();
  const context = json["@context"];

  await addContext(state, context, url);
}

async function addContext(
  state: CBORLDState,
  context: any,
  contextUrl: string
): Promise<void> {
  const termMap: Record<string, TermDefinition> = {};
  const entry: ContextEntry = {context, termMap};
  const sortedTerms = Object.keys(context).sort();
  const isProtected = context["@protected"] === true;

  for (const term of sortedTerms) {
    if (state.keywordsMap.has(term)) continue;

    let definition = context[term];
    if (definition == null) continue;
    if (typeof definition === "string") {
      definition = {"@id": definition};
    }

    definition.protected = isProtected;
    termMap[term] = definition;

    if (definition["@context"]) {
      const nestedCtx = definition["@context"];
      const nestedKey = `${term}::nested`;
      await addContext(state, nestedCtx, nestedKey);
    }

    if (!state.termToId.has(term)) {
      const id = state.nextTermId;
      state.nextTermId += 2;
      state.termToId.set(term, id);
      if (state.strategy === "decompression") {
        state.idToTerm!.set(id, term);
      }
    }
  }

  state.contextMap.set(contextUrl, entry);
}
