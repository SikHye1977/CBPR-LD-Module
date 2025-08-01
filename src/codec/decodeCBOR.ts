export function decodeCBOR(bytes: Uint8Array): any {
  let offset = 0;

  function readUInt(n: number) {
    let val = 0;
    for (let i = 0; i < n; i++) val = (val << 8) | bytes[offset++];
    return val;
  }

  function decode(): any {
    const head = bytes[offset++];
    const major = head >> 5;
    const addl = head & 0x1f;

    // 🔸 0: unsigned int
    if (major === 0) {
      if (addl < 24) return addl;
      if (addl === 24) return bytes[offset++];
      if (addl === 25) return readUInt(2);
      throw new Error("Unsupported unsigned int");
    }

    // 🔸 2: byte string
    if (major === 2) {
      const len = addl < 24 ? addl : readUInt(addl === 24 ? 1 : 2);
      const value = bytes.slice(offset, offset + len);
      offset += len;
      return value;
    }

    // 🔸 3: text string
    if (major === 3) {
      const len = addl < 24 ? addl : readUInt(addl === 24 ? 1 : 2);
      const str = new TextDecoder().decode(bytes.slice(offset, offset + len));
      offset += len;
      return str;
    }

    // 🔸 4: array
    if (major === 4) {
      const len = addl < 24 ? addl : readUInt(addl === 24 ? 1 : 2);
      const arr = [];
      for (let i = 0; i < len; i++) arr.push(decode());
      return arr;
    }

    // 🔸 5: map (object)
    if (major === 5) {
      const len = addl < 24 ? addl : readUInt(addl === 24 ? 1 : 2);
      const obj: Record<any, any> = {};
      for (let i = 0; i < len; i++) {
        const key = decode();
        const val = decode();
        obj[key] = val;
      }
      return obj;
    }

    // 🔸 literals
    if (head === 0xf4) return false;
    if (head === 0xf5) return true;
    if (head === 0xf6) return null;

    throw new Error(`Unsupported major type ${major} at offset ${offset}`);
  }

  const result = decode();
  console.log("🔍 decodeCBOR 결과:\n", JSON.stringify(result, null, 2));
  return result;
}
