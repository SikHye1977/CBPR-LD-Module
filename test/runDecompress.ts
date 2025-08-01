import pako from "pako";
import {decodeCBOR} from "../src/codec/decodeCBOR";
import {expandCompressedJsonLd} from "../src/conversion/expandCompressedJsonLd";
import {Buffer} from "buffer";
import * as fs from "fs";

// 1. 압축된 base64 데이터
const base64 =
  "H4sIAAAAAAAAAz2Oy07DQAxFlfT9fv0Ik6avHS1sqZBgX9kzDpk2nQmTCbTL/kpFJfZ8DX/DpJWQLPle+8i+v1XvjBt+Abb0kIVfyCYDZLMhsvkIghayRR+CpQfj0zewlec75uKYNrJpx3Fdx/UcB8HKL0HowcSHaQlmZZg77K6GjJ2RBXUIG8jGhWxCWClqUeUbu/+J77lWlg7We+OGwJLovTshSFkJyUuOW+K2ruiQSgNWavXomFoU60SQGaEU5URmWQ6KU7GpxoUjsTq2oqsyFb79zIZCwZ7alBqto25ybc+5SXVG/cRKviO7zvdIprG7uVe9I9UU9piSL3Plfq3dgY79ICMjCZjQw3/IkrlN+TXfE9lYi8EfmUYFd1gBAAA=";

// 2. 외부 저장된 테이블 불러오기 (압축 시 exportCompressionTables()로 저장한 테이블)
const typeTable = JSON.parse(
  fs.readFileSync("./tables/typeTable.json", "utf-8")
);
const termTable = JSON.parse(
  fs.readFileSync("./tables/termTable.json", "utf-8")
);

try {
  // 3. base64 → GZIP 압축 해제
  const gzipped = Uint8Array.from(Buffer.from(base64, "base64"));
  const decompressed = pako.ungzip(gzipped);
  const decompressedPayload = decompressed.slice(3); // CBOR Tag 제거

  // 4. CBOR 디코딩 → {_c, _tm} 구조
  const wrapped = decodeCBOR(decompressedPayload);

  // 5. expandCompressedJsonLd에 필요한 구조 구성
  const input = {
    _c: wrapped["_c"], // 압축된 JSON
    _tm: wrapped["_tm"], // termMap
    _tt: termTable, // 외부 저장 termTable
    _tp: typeTable, // 외부 저장 typeTable
  };

  // 6. 압축 해제
  const restored = expandCompressedJsonLd(input);
  console.log("✅ 복원된 JSON-LD:\n", JSON.stringify(restored, null, 2));
} catch (e) {
  console.error("❌ 오류 발생:", e);
}
