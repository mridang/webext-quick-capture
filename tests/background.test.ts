/* global chrome */
import { describe, it, expect, beforeEach, jest } from '@jest/globals';

const mockChrome = {
  runtime: {
    onInstalled: {
      addListener: jest.fn(),
    },
    getContexts: jest.fn(),
    sendMessage: jest.fn(),
    ContextType: {
      OFFSCREEN_DOCUMENT: 'OFFSCREEN_DOCUMENT',
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
  tabs: {
    captureVisibleTab: jest.fn(),
  },
  scripting: {
    executeScript: jest.fn(),
  },
  offscreen: {
    createDocument: jest.fn(),
    hasDocument: jest.fn(),
    Reason: {
      AUDIO_PLAYBACK: 'AUDIO_PLAYBACK',
    },
  },
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any).chrome = mockChrome;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any).Blob = class Blob {
  size: number;
  type: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(parts: any[], options?: { type?: string }) {
    this.size = parts.reduce((acc: number, part: unknown) => {
      if (typeof part === 'string') {
        return acc + new TextEncoder().encode(part).length;
      }
      return acc;
    }, 0);
    this.type = options?.type || '';
  }
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any).FileReader = class FileReader {
  onloadend: (() => void) | null = null;
  onerror: (() => void) | null = null;
  result: string | null = null;

  readAsDataURL() {
    setTimeout(() => {
      this.result = 'data:text/plain;base64,dGVzdA==';
      if (this.onloadend) {
        this.onloadend();
      }
    }, 0);
  }
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any).URL = {
  createObjectURL: jest.fn(() => 'blob:test'),
  revokeObjectURL: jest.fn(),
};

const {
  captureScreenshot,
  copyImageToClipboard,
  handleContextMenuClick,
  initializeContextMenu,
} = await import('../src/background.js');
type BackgroundTypes = typeof import('../src/types.js');
type ContextMenuInfo = BackgroundTypes['ContextMenuInfo'];
type Tab = BackgroundTypes['Tab'];

type CaptureVisibleTabPromise = (
  windowId: number,
  options: chrome.tabs.CaptureVisibleTabOptions,
) => Promise<string>;

type ContextMenusCreateFn = (
  createProperties: chrome.contextMenus.CreateProperties,
  callback?: () => void,
) => string | number;

type ExecuteScriptPromise = (
  injection: chrome.scripting.Injection,
) => Promise<chrome.scripting.InjectionResult[]>;

const captureVisibleTabMock = chrome.tabs
  .captureVisibleTab as unknown as jest.MockedFunction<CaptureVisibleTabPromise>;

const contextMenusCreateMock = chrome.contextMenus
  .create as unknown as jest.MockedFunction<ContextMenusCreateFn>;

const executeScriptMock = chrome.scripting
  .executeScript as unknown as jest.MockedFunction<ExecuteScriptPromise>;

const getContextsMock = chrome.runtime.getContexts as jest.MockedFunction<
  typeof chrome.runtime.getContexts
>;

const sendMessageMock = chrome.runtime.sendMessage as jest.MockedFunction<
  typeof chrome.runtime.sendMessage
>;

const createDocumentMock = chrome.offscreen
  .createDocument as jest.MockedFunction<
  typeof chrome.offscreen.createDocument
>;

describe('captureScreenshot', () => {
  beforeEach(() => {
    captureVisibleTabMock.mockClear();
  });

  it('should return success result with data URL on successful capture', async () => {
    captureVisibleTabMock.mockResolvedValue('data:image/png;base64,mock-image');

    const result = await captureScreenshot(1);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.value).toBe('data:image/png;base64,mock-image');
    }
  });

  it('should return error result on capture failure', async () => {
    captureVisibleTabMock.mockRejectedValue(new Error('Capture failed'));

    const result = await captureScreenshot(1);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.type).toBe('CAPTURE_FAILED');
      expect(result.error.message).toBe('Capture failed');
    }
  });
});

describe('copyImageToClipboard', () => {
  beforeEach(() => {
    executeScriptMock.mockClear();
  });

  it('should return success result on successful clipboard write', async () => {
    executeScriptMock.mockResolvedValue([]);

    const result = await copyImageToClipboard(1, 'data:image/png;base64,mock');

    expect(result.success).toBe(true);
  });

  it('should return error result on clipboard failure', async () => {
    executeScriptMock.mockRejectedValue(new Error('Script injection failed'));

    const result = await copyImageToClipboard(1, 'data:image/png;base64,mock');

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.type).toBe('CLIPBOARD_FAILED');
    }
  });
});

describe('handleContextMenuClick', () => {
  beforeEach(() => {
    captureVisibleTabMock.mockClear();
    executeScriptMock.mockClear();
    getContextsMock.mockClear();
    sendMessageMock.mockClear();
    createDocumentMock.mockClear();

    captureVisibleTabMock.mockResolvedValue('data:image/png;base64,mock-image');
    executeScriptMock.mockResolvedValue([]);
    getContextsMock.mockResolvedValue([]);
    createDocumentMock.mockResolvedValue();
  });

  const tab: Tab = {
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

  it('should capture screenshot, play sound and copy to clipboard when correct menu item is clicked', async () => {
    const info: ContextMenuInfo = {
      menuItemId: 'capture-screenshot',
      editable: false,
      pageUrl: 'https://example.com',
    };

    await handleContextMenuClick(info, tab);

    expect(chrome.tabs.captureVisibleTab).toHaveBeenCalledTimes(1);
    expect(chrome.scripting.executeScript).toHaveBeenCalledTimes(1);
    expect(createDocumentMock).toHaveBeenCalledTimes(1);
    expect(sendMessageMock).toHaveBeenCalledTimes(1);
  });

  it('should not do anything if wrong menu item is clicked', async () => {
    const info: ContextMenuInfo = {
      menuItemId: 'other-menu',
      editable: false,
      pageUrl: 'https://example.com',
    };

    await handleContextMenuClick(info, tab);

    expect(chrome.tabs.captureVisibleTab).not.toHaveBeenCalled();
    expect(chrome.scripting.executeScript).not.toHaveBeenCalled();
  });

  it('should not do anything if tab is not available', async () => {
    const info: ContextMenuInfo = {
      menuItemId: 'capture-screenshot',
      editable: false,
      pageUrl: 'https://example.com',
    };

    await handleContextMenuClick(info, undefined);

    expect(chrome.tabs.captureVisibleTab).not.toHaveBeenCalled();
    expect(chrome.scripting.executeScript).not.toHaveBeenCalled();
  });

  it('should not do anything if tab id is undefined', async () => {
    const info: ContextMenuInfo = {
      menuItemId: 'capture-screenshot',
      editable: false,
      pageUrl: 'https://example.com',
    };

    const tabWithoutId: Tab = { ...tab, id: undefined };

    await handleContextMenuClick(info, tabWithoutId);

    expect(chrome.tabs.captureVisibleTab).not.toHaveBeenCalled();
    expect(chrome.scripting.executeScript).not.toHaveBeenCalled();
  });

  it('should handle screenshot capture failures gracefully', async () => {
    captureVisibleTabMock.mockRejectedValue(new Error('Capture failed'));

    const info: ContextMenuInfo = {
      menuItemId: 'capture-screenshot',
      editable: false,
      pageUrl: 'https://example.com',
    };

    await expect(handleContextMenuClick(info, tab)).resolves.not.toThrow();
    expect(chrome.scripting.executeScript).not.toHaveBeenCalled();
    expect(sendMessageMock).not.toHaveBeenCalled();
  });
});

describe('initializeContextMenu', () => {
  beforeEach(() => {
    contextMenusCreateMock.mockClear();
  });

  it('should create context menu with correct properties', () => {
    initializeContextMenu();

    expect(chrome.contextMenus.create).toHaveBeenCalledWith({
      id: 'capture-screenshot',
      title: 'Capture screenshot',
      contexts: ['all'],
    });
  });

  it('should handle creation errors gracefully', () => {
    contextMenusCreateMock.mockImplementation(() => {
      throw new Error('Creation failed');
    });

    expect(() => initializeContextMenu()).not.toThrow();
  });
});
