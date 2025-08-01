import {
  reverseTermMap,
  reverseTermTable,
  reverseTypeTable,
  TermMap,
  TermTable,
  TypeTable,
} from "../utils/reverseMap";

/**
 * 압축된 CBOR-LD 구조에서 원래 JSON-LD 복원
 * @param wrapped - decodeCBOR로 복원한 객체 { _c, _tm, _tt, _tp }
 */
export function expandCompressedJsonLd(wrapped: {
  _c: any;
  _tm: TermMap;
  _tt: TermTable;
  _tp: TypeTable;
}): any {
  const {_c, _tm, _tt, _tp} = wrapped;

  if (!_c || !_tm || !_tt || !_tp)
    throw new Error("❌ 압축 JSON 구조에 필요한 요소가 없습니다.");

  const revTermMap = reverseTermMap(_tm);
  const revTermTable = reverseTermTable(_tt);
  const revTypeTable = reverseTypeTable(_tp);

  const expand = (value: any): any => {
    if (Array.isArray(value)) return value.map(expand);

    if (typeof value === "object" && value !== null) {
      const result: Record<string, any> = {};
      for (const [k, v] of Object.entries(value)) {
        const key = revTermMap[+k];
        if (!key) throw new Error(`❌ 알 수 없는 키 ID: ${k}`);

        if (key === "@context") {
          const ctxArr = (Array.isArray(v) ? v : [v]).map((ctxEntry) => {
            if (typeof ctxEntry === "number") {
              return revTypeTable.url[ctxEntry] ?? ctxEntry;
            } else if (
              typeof ctxEntry === "object" &&
              ctxEntry !== null &&
              Object.keys(ctxEntry).every((k) => !isNaN(Number(k)))
            ) {
              const entries = Object.entries(ctxEntry)
                .sort((a, b) => Number(a[0]) - Number(b[0]))
                .map(([_, id]) =>
                  typeof id === "number" ? revTypeTable.url[id] ?? id : id
                );
              return entries;
            } else {
              return ctxEntry;
            }
          });
          result[key] = ctxArr.flat();
        } else if (key === "type") {
          if (Array.isArray(v)) {
            result[key] = v.map((id) =>
              typeof id === "number" ? revTypeTable["@type"][id] ?? id : id
            );
          } else if (typeof v === "object" && v !== null) {
            result[key] = Object.values(v).map((id) =>
              typeof id === "number" ? revTypeTable["@type"][id] ?? id : id
            );
          } else if (typeof v === "number") {
            result[key] = revTypeTable["@type"][v] ?? v;
          } else {
            result[key] = v;
          }
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
}
