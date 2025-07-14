import {compressToCborLd} from "../src/compress/cborLdCompressor";
import pako from "pako";
import QRCode from "qrcode";

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

// 🔹 1. JSON → CBOR-LD 압축
const compressed = compressToCborLd(VP); // Uint8Array

// 🔹 2. GZIP 압축
const gzipped = pako.gzip(compressed); // Uint8Array

// 🔹 3. Base64 인코딩
const base64 = Buffer.from(gzipped).toString("base64");

// 🔹 4. QR 코드 생성 (터미널 출력)
QRCode.toString(base64, {type: "terminal"}, (err, qr) => {
  if (err) {
    console.error("❌ QR 생성 실패:", err);
    return;
  }
  console.log("✅ QR 코드:");
  console.log(qr);
});

// 🔹 (Optional) 이미지 파일로 저장
QRCode.toFile("output_qr.png", base64, {type: "png"}, (err) => {
  if (err) console.error("❌ PNG 저장 실패:", err);
  else console.log("🖼️ QR 이미지 saved to output_qr.png");
});
