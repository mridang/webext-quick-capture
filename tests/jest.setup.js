import { jest } from '@jest/globals';

const mockChrome = {
  runtime: {
    onInstalled: {
      addListener: jest.fn(),
    },
  },
  contextMenus: {
    create: jest.fn(),
    onClicked: {
      addListener: jest.fn(),
    },
  },
  downloads: {
    download: jest.fn(),
  },
};

globalThis.chrome = mockChrome;

globalThis.Blob = class Blob {
  constructor(parts, options) {
    this.size = parts.reduce((acc, part) => {
      if (typeof part === 'string') {
        return acc + new TextEncoder().encode(part).length;
      }
      return acc;
    }, 0);
    this.type = options?.type || '';
  }
};

globalThis.FileReader = class FileReader {
  constructor() {
    this.onloadend = null;
    // noinspection JSUnusedGlobalSymbols
    this.onerror = null;
    this.result = null;
  }

  // noinspection JSUnusedGlobalSymbols
  readAsDataURL() {
    setTimeout(() => {
      this.result = 'data:text/plain;base64,dGVzdA==';
      if (this.onloadend) {
        this.onloadend();
      }
    }, 0);
  }
};

globalThis.URL = {
  createObjectURL: jest.fn(() => 'blob:test'),
  revokeObjectURL: jest.fn(),
};
