import { describe, it, expect } from '@jest/globals';
import { validateSelectionText, validateFilename } from '../src/validation.js';

describe('validateSelectionText', () => {
  it('should accept valid text', () => {
    const result = validateSelectionText('Hello World');

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.value).toBe('Hello World');
    }
  });

  it('should reject undefined text', () => {
    const result = validateSelectionText(undefined);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.type).toBe('INVALID_SELECTION');
    }
  });

  it('should reject empty text', () => {
    const result = validateSelectionText('');

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.type).toBe('INVALID_SELECTION');
    }
  });

  it('should reject text exceeding maximum length', () => {
    const longText = 'a'.repeat(1_000_001);
    const result = validateSelectionText(longText);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.type).toBe('INVALID_SELECTION');
    }
  });

  it('should accept text at maximum length', () => {
    const maxText = 'a'.repeat(1_000_000);
    const result = validateSelectionText(maxText);

    expect(result.success).toBe(true);
  });
});

describe('validateFilename', () => {
  it('should accept valid filename', () => {
    const result = validateFilename('test.txt');

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.value).toBe('test.txt');
    }
  });

  it('should reject filename with invalid characters', () => {
    const invalidFilenames = [
      'test<.txt',
      'test>.txt',
      'test".txt',
      'test/.txt',
      'test\\.txt',
      'test|.txt',
      'test?.txt',
      'test*.txt',
    ];

    invalidFilenames.forEach((filename) => {
      const result = validateFilename(filename);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.type).toBe('INVALID_SELECTION');
      }
    });
  });

  it('should reject empty filename', () => {
    const result = validateFilename('');

    expect(result.success).toBe(false);
  });

  it('should reject filename exceeding 255 characters', () => {
    const longFilename = 'a'.repeat(256);
    const result = validateFilename(longFilename);

    expect(result.success).toBe(false);
  });
});
