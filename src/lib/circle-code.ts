import { randomInt } from "node:crypto";

/** No 0/O, 1/I/L — easy to read aloud and type. */
export const CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

/** Random circle code from an unambiguous alphabet (no 0/O, 1/I/L). */
export function newCircleCode(length = 6): string {
  let s = "";
  for (let i = 0; i < length; i++) s += CODE_ALPHABET[randomInt(CODE_ALPHABET.length)];
  return s;
}
