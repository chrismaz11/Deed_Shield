import { describe, expect, it } from 'vitest';

import { canonicalizeJson } from './canonicalize.js';
import { keccak256Utf8 } from './hashing.js';

describe('keccak256Utf8', () => {
  it('produces same hash for canonicalized equal objects', () => {
    const obj1 = { x: 1, y: 2 };
    const obj2 = { y: 2, x: 1 };
    const hash1 = keccak256Utf8(canonicalizeJson(obj1));
    const hash2 = keccak256Utf8(canonicalizeJson(obj2));
    expect(hash1).toBe(hash2);
  });
});
