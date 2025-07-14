export function generateTermMapFromContext(
  jsonld: any
): Record<string, number> {
  const termMap: Record<string, number> = {};
  let counter = 1;

  const collectKeys = (obj: any) => {
    if (Array.isArray(obj)) {
      obj.forEach(collectKeys);
    } else if (typeof obj === "object" && obj !== null) {
      for (const [k, v] of Object.entries(obj)) {
        if (!(k in termMap)) {
          termMap[k] = counter++;
        }
        collectKeys(v);
      }
    }
  };

  collectKeys(jsonld);
  return termMap;
}
