import { describe, it, expect } from 'vitest';
import { AnyBlock } from '../src/block.js';

describe('block schema', () => {
  it('validates a text block', () => {
    const data = AnyBlock.parse({
      id: '11111111-1111-1111-1111-111111111111',
      type: 'text',
      order: 0,
      content: 'hello world',
      variant: 'body',
    });
    expect(data.content).toBe('hello world');
  });

  it('rejects invalid block', () => {
    expect(() =>
      AnyBlock.parse({
        id: '11111111-1111-1111-1111-111111111111',
        type: 'text',
        order: -1,
        content: '',
      })
    ).toThrowError();
  });
});
