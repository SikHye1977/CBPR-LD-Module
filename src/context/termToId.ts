// src/context/termToId.ts
export const termToId = new Map<string, number>([
  ["@context", 0],
  ["@type", 2],
  ["@id", 4],
  ["@value", 6],
  ["verifiableCredential", 100],
  ["issuer", 102],
  ["issuanceDate", 104],
  ["expirationDate", 106],
  ["credentialSubject", 108],
  ["ticketNumber", 110],
  ["ticketToken", 112],
  ["issuedBy", 114],
  ["name", 116],
  ["underName", 118],
  ["holder", 120],
  ["https://w3id.org/security#proof", 122],
]);
