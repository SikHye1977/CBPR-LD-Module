// src/registry/varint.ts
import {encodeUnsignedInt} from "../codec/cborEncoder";

export function getVarintStructure(registryEntryId: number): Uint8Array {
  const tag = [0xd9, 0x06]; // CBOR tag 51997
  if (registryEntryId < 128) {
    return new Uint8Array([...tag, registryEntryId]);
  }
  throw new Error("Only registryEntryId < 128 supported for now");
}
