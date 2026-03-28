import { describe, it, expect } from '@jest/globals';
import { validateTab, validateDataUrl } from '../src/validation.js';
import type { Tab } from '../src/types.js';

const baseTab: Tab = {
  id: 1,
  index: 0,
  windowId: 1,
  highlighted: true,
  active: true,
  pinned: false,
  discarded: false,
  incognito: false,
  autoDiscardable: true,
};

describe('validateTab', () => {
  it('should accept valid tab with id', () => {
    const result = validateTab(baseTab);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.value.id).toBe(1);
    }
  });

  it('should reject undefined tab', () => {
    const result = validateTab(undefined);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.type).toBe('CAPTURE_FAILED');
    }
  });

  it('should reject tab without id', () => {
    const tabWithoutId: Tab = { ...baseTab, id: undefined };
    const result = validateTab(tabWithoutId);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.type).toBe('CAPTURE_FAILED');
    }
  });
});

describe('validateDataUrl', () => {
  it('should accept valid data URL', () => {
    const result = validateDataUrl('data:image/png;base64,abc');

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.value).toBe('data:image/png;base64,abc');
    }
  });

  it('should reject undefined', () => {
    const result = validateDataUrl(undefined);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.type).toBe('CAPTURE_FAILED');
    }
  });

  it('should reject non-data URL string', () => {
    const result = validateDataUrl('https://example.com');

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.type).toBe('CAPTURE_FAILED');
    }
  });

  it('should reject empty string', () => {
    const result = validateDataUrl('');

    expect(result.success).toBe(false);
  });
});
