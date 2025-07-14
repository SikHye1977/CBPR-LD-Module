import {TypeTable} from "../utils/typeTableGen";

export function applyTypeTableCompression(
  input: any,
  typeTable: TypeTable,
  termMap: Record<string, number>
): any {
  return compressValue(input, typeTable, termMap);
}

function compressValue(
  value: any,
  typeTable: TypeTable,
  termMap: Record<string, number>
): any {
  if (Array.isArray(value)) {
    return value.map((v) => compressValue(v, typeTable, termMap));
  }

  if (typeof value === "object" && value !== null) {
    const compressedObj: Record<number, any> = {};

    for (const [key, val] of Object.entries(value)) {
      const termId = termMap[key];
      if (termId === undefined) {
        throw new Error(`Key "${key}" not found in termMap`);
      }

      // Handle special keys
      if (key === "@context") {
        compressedObj[termId] = (Array.isArray(val) ? val : [val]).map(
          (v: string) => typeTable.url[v] ?? v
        );
      } else if (key === "type") {
        compressedObj[termId] = (Array.isArray(val) ? val : [val]).map(
          (v: string) => typeTable["@type"][v] ?? v
        );
      } else if (typeof val === "string") {
        compressedObj[termId] = typeTable.none[val] ?? val;
      } else {
        compressedObj[termId] = compressValue(val, typeTable, termMap);
      }
    }

    return compressedObj;
  }

  // Primitive (number, boolean, etc.)
  return value;
}

// Optional: fixed term map (key name -> number ID)
// You can make this dynamic later
export function generateTermMap(): Record<string, number> {
  return {
    "@context": 1,
    type: 2,
    verifiableCredential: 3,
    id: 4,
    issuer: 5,
    issuanceDate: 6,
    expirationDate: 7,
    credentialSubject: 8,
    proof: 9,
    holder: 10,
    created: 11,
    proofPurpose: 12,
    verificationMethod: 13,
    jws: 14,
    ticketNumber: 15,
    ticketToken: 16,
    issuedBy: 17,
    underName: 18,
    name: 19,
  };
}
