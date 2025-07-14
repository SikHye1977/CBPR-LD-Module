import {compressToCborLd} from "../src/compress/cborLdCompressor";

const VP = {
  "@context": ["https://www.w3.org/2018/credentials/v1"],
  type: ["VerifiablePresentation"],
  verifiableCredential: [
    {
      "@context": [
        "https://www.w3.org/2018/credentials/v1",
        "https://schema.org/docs/jsonldcontext.jsonld",
      ],
      id: "aa7c429d-b717-40b6-a4dc-696bd75a873b",
      type: ["VerifiableCredential", "Ticket"],
      issuer: "did:sov:VV9pK5ZrLPRwYmotgACPkC",
      issuanceDate: "2025-05-18T10:17:46.728Z",
      expirationDate: "2025-02-10T15:00:00.000Z",
      credentialSubject: {
        id: "Gtw58xLhejueHwEZtbmmQ5",
        ticketNumber: "5ea83195-c279-4207-b23d-315c45bb8cfb",
        ticketToken: "vcData.reservedTicket.ticketToken",
        issuedBy: {
          name: "Additional Concert 1",
          id: "did:sov:VV9pK5ZrLPRwYmotgACPkC",
        },
        underName: {
          name: "Gtw58xLhejueHwEZtbmmQ5",
          id: "Gtw58xLhejueHwEZtbmmQ5",
        },
      },
      proof: {
        type: "Ed25519Signature2020",
        created: "2025-05-18T10:17:46.736Z",
        proofPurpose: "assertionMethod",
        verificationMethod:
          "GXUnLHyrYogGzyeiFLXdLv9EjEy8ZJN7XFnuSuN3Dn9M#keys-1",
        jws: "eyJhbGciOiJFZERTQSIsImI2NCI6ZmFsc2UsImNyaXQiOlsiYjY0Il19..8X7IqE0UR4DOCODvJ_H5Gyv3UziSaofHZRR26Q48U1xRNK0ViYKdjde867LNvuJYQNyQHYx2bF8ZUNG7TORtCA",
      },
    },
  ],
  holder: "did:sov:Gtw58xLhejueHwEZtbmmQ5",
  proof: {
    type: "Ed25519Signature2020",
    created: "2025-05-18T10:45:44.971Z",
    verificationMethod: "did:sov:Gtw58xLhejueHwEZtbmmQ5#key-1",
    jws: "eyJhbGciOiJFZERTQSIsImI2NCI6ZmFsc2UsImNyaXQiOlsiYjY0Il19..KevhjfPxQUwZosgyLmVJgEI8XQKd1CYB-ZuYgTPBxwM6bZLdlZeM75MAYviHiGjlflrvfHFsFxCwOSwG1WRWCQ",
  },
};

// 원본 사이즈 측정
const jsonString = JSON.stringify(VP);
const originalSize = new TextEncoder().encode(jsonString).length;

// 압축
const compressed = compressToCborLd(VP);
const compressedSize = compressed.length;

// 결과 출력
console.log("compressed:\n", compressed);
console.log("📦 Original size:", originalSize, "bytes");
console.log("📦 Compressed size:", compressedSize, "bytes");

const ratio = ((originalSize - compressedSize) / originalSize) * 100;
console.log(`💡 Compression ratio: ${ratio.toFixed(2)}%`);
