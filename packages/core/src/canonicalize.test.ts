import { describe, expect, it } from 'vitest';

import { canonicalizeJson } from './canonicalize.js';

describe('canonicalizeJson', () => {
  it('orders keys deterministically', () => {
    const input = { b: 2, a: 1, nested: { z: 1, y: 2 } };
    const output = canonicalizeJson(input);
    expect(output).toBe('{"a":1,"b":2,"nested":{"y":2,"z":1}}');
  });
});
