import pako from "pako";
import {decodeCBOR} from "../codec/decodeCBOR";
import {
  reverseTermMap,
  reverseTermTable,
  reverseTypeTable,
  TermMap,
  TermTable,
  TypeTable,
} from "../utils/reverseMap";
import {Buffer} from "buffer";

/**
 * 압축된 CBOR-LD QR(Base64) 문자열을 원래 JSON-LD로 복원
 */
export function decompressCborLdBase64(base64: string): any {
  try {
    // 🔹 1. Base64 → Uint8Array
    const gzipped = Uint8Array.from(Buffer.from(base64, "base64"));

    // 🔹 2. GZIP 해제
    const decompressed = pako.ungzip(gzipped);

    // 🔹 3. CBOR prefix 제거 (3바이트)
    const payload = decompressed.slice(3);

    // 🔹 4. CBOR 디코딩
    const wrapped = decodeCBOR(payload); // {_c, _tt, _tm, _tp}

    const _c: any = wrapped._c;
    const _tt: TermTable = wrapped._tt;
    const _tm: TermMap = wrapped._tm;
    const _tp: TypeTable = wrapped._tp;

    if (!_c || !_tt || !_tm || !_tp)
      throw new Error("CBOR 구조가 잘못되었습니다");

    // 🔹 5. 테이블 뒤집기
    const revTermMap = reverseTermMap(_tm);
    const revTermTable = reverseTermTable(_tt);
    const revTypeTable = reverseTypeTable(_tp);

    // 🔹 6. 복원 함수
    const expand = (value: any): any => {
      if (Array.isArray(value)) return value.map(expand);

      if (typeof value === "object" && value !== null) {
        const result: Record<string, any> = {};
        for (const [k, v] of Object.entries(value)) {
          const key = revTermMap[Number(k)];
          if (!key) throw new Error(`❌ 알 수 없는 key id: ${k}`);

          if (key === "@context") {
            result[key] = (Array.isArray(v) ? v : [v]).map(
              (id) => revTypeTable.url[id] ?? id
            );
          } else if (key === "type") {
            result[key] = (Array.isArray(v) ? v : [v]).map(
              (id) => revTypeTable["@type"][id] ?? id
            );
          } else if (typeof v === "number") {
            result[key] = revTermTable[v] ?? revTypeTable.none[v] ?? v;
          } else {
            result[key] = expand(v);
          }
        }
        return result;
      }

      return value;
    };

    return expand(_c);
  } catch (e) {
    console.error("❌ 복원 실패:", e);
    return null;
  }
}
