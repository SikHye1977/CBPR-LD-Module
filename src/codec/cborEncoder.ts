// src/codec/cborEncoder.ts

// Major Type 0: Unsigned Integer
export function encodeUnsignedInt(value: number): number[] {
  if (value < 24) return [value];
  if (value < 256) return [0x18, value];
  if (value < 65536) return [0x19, (value >> 8) & 0xff, value & 0xff];
  throw new Error("Too large integer not supported yet");
}

// Major Type 2: Byte String
export function encodeByteString(bytes: number[]): number[] {
  const lengthPrefix = encodeUnsignedInt(bytes.length);
  lengthPrefix[0] |= 0x40; // Major Type 2 (010_00000)
  return [...lengthPrefix, ...bytes];
}

// Major Type 3: Text String
export function encodeTextString(text: string): number[] {
  const utf8 = Array.from(new TextEncoder().encode(text));
  const lengthPrefix = encodeUnsignedInt(utf8.length);
  lengthPrefix[0] |= 0x60; // Major Type 3 (011_00000)
  return [...lengthPrefix, ...utf8];
}

// ✅ Main encoder: handles primitive, array, object
export function encodeCBOR(value: any): number[] {
  if (value === null) return [0xf6]; // null
  if (value === true) return [0xf5]; // true
  if (value === false) return [0xf4]; // false

  // Unsigned int
  if (typeof value === "number" && Number.isInteger(value) && value >= 0)
    return encodeUnsignedInt(value);

  // Text string
  if (typeof value === "string") return encodeTextString(value);

  // Byte string (Uint8Array or number[])
  if (
    value instanceof Uint8Array ||
    (Array.isArray(value) && value.length > 0 && typeof value[0] === "number")
  )
    return encodeByteString(value as number[]);

  // ✅ Array (Major Type 4)
  if (Array.isArray(value)) {
    const items = value.map(encodeCBOR).flat();
    const lengthPrefix = encodeUnsignedInt(value.length);
    lengthPrefix[0] |= 0x80; // Major Type 4 (100_00000)
    return [...lengthPrefix, ...items];
  }

  // ✅ Object / Map (Major Type 5)
  if (typeof value === "object") {
    const keys = Object.keys(value).sort(); // lexicographically sorted
    const encodedPairs = keys.flatMap((key) => [
      ...encodeCBOR(key), // key is always a string
      ...encodeCBOR(value[key]), // value is recursively encoded
    ]);
    const lengthPrefix = encodeUnsignedInt(keys.length);
    lengthPrefix[0] |= 0xa0; // Major Type 5 (101_00000)
    return [...lengthPrefix, ...encodedPairs];
  }

  throw new Error(`Unsupported CBOR type for value: ${JSON.stringify(value)}`);
}
