/* global chrome */
import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  formatTimestamp,
  createFilename,
  downloadFile,
  handleContextMenuClick,
  initializeContextMenu,
} from '../src/background.js';
import type { ContextMenuInfo } from '../src/types.js';

type DownloadsDownloadPromise = (
  options: chrome.downloads.DownloadOptions,
) => Promise<number>;

type ContextMenusCreateFn = (
  createProperties: chrome.contextMenus.CreateProperties,
  callback?: () => void,
) => string | number;

const downloadsDownloadMock = chrome.downloads
  .download as unknown as jest.MockedFunction<DownloadsDownloadPromise>;

const contextMenusCreateMock = chrome.contextMenus
  .create as unknown as jest.MockedFunction<ContextMenusCreateFn>;

describe('formatTimestamp', () => {
  it('should format date to ISO string with replaced colons and dots', () => {
    const date = new Date('2024-01-15T10:30:45.123Z');
    const result = formatTimestamp(date);

    expect(result).toBe('2024-01-15T10-30-45-123Z');
  });

  it('should handle different dates consistently', () => {
    const date1 = new Date('2023-12-31T23:59:59.999Z');
    const date2 = new Date('2024-01-01T00:00:00.000Z');

    const result1 = formatTimestamp(date1);
    const result2 = formatTimestamp(date2);

    expect(result1).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}-\d{3}Z$/);
    expect(result2).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}-\d{3}Z$/);
  });
});

describe('createFilename', () => {
  it('should create valid filename with prefix and timestamp', () => {
    const prefix = 'selection-';
    const timestamp = '2024-01-15T10-30-45-123Z';
    const result = createFilename(prefix, timestamp);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.value).toBe('selection-2024-01-15T10-30-45-123Z.txt');
    }
  });

  it('should reject filename with invalid characters', () => {
    const result = createFilename('test<', 'timestamp');

    expect(result.success).toBe(false);
  });
});

describe('downloadFile', () => {
  beforeEach(() => {
    downloadsDownloadMock.mockClear();
  });

  it('should return success result on successful download', async () => {
    downloadsDownloadMock.mockResolvedValue(123);

    const result = await downloadFile('test', 'test.txt');

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.value).toBe(123);
    }
  });

  it('should return error result on download failure', async () => {
    downloadsDownloadMock.mockRejectedValue(new Error('Download failed'));

    const result = await downloadFile('test', 'test.txt');

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.type).toBe('DOWNLOAD_FAILED');
      expect(result.error.message).toBe('Download failed');
    }
  });
});

describe('handleContextMenuClick', () => {
  beforeEach(() => {
    downloadsDownloadMock.mockClear();
    downloadsDownloadMock.mockResolvedValue(1);
  });

  it('should download one file when valid selection exists', async () => {
    const info: ContextMenuInfo = {
      menuItemId: 'save-text',
      selectionText: 'Hello World',
      editable: false,
      pageUrl: 'https://example.com',
    };

    await handleContextMenuClick(info, undefined);

    expect(chrome.downloads.download).toHaveBeenCalledTimes(1);
  });

  it('should not download if no selection text', async () => {
    const info: ContextMenuInfo = {
      menuItemId: 'save-text',
      editable: false,
      pageUrl: 'https://example.com',
    };

    await handleContextMenuClick(info, undefined);

    expect(chrome.downloads.download).not.toHaveBeenCalled();
  });

  it('should not download if wrong menu item', async () => {
    const info: ContextMenuInfo = {
      menuItemId: 'other-menu',
      selectionText: 'Hello World',
      editable: false,
      pageUrl: 'https://example.com',
    };

    await handleContextMenuClick(info, undefined);

    expect(chrome.downloads.download).not.toHaveBeenCalled();
  });

  it('should handle download failures gracefully', async () => {
    downloadsDownloadMock.mockRejectedValue(new Error('Network error'));

    const info: ContextMenuInfo = {
      menuItemId: 'save-text',
      selectionText: 'Test',
      editable: false,
      pageUrl: 'https://example.com',
    };

    await expect(
      handleContextMenuClick(info, undefined),
    ).resolves.not.toThrow();
  });
});

describe('initializeContextMenu', () => {
  beforeEach(() => {
    contextMenusCreateMock.mockClear();
  });

  it('should create context menu with correct properties', () => {
    initializeContextMenu();

    expect(chrome.contextMenus.create).toHaveBeenCalledWith({
      id: 'save-text',
      title: 'Save selected text',
      contexts: ['selection'],
    });
  });

  it('should handle creation errors gracefully', () => {
    contextMenusCreateMock.mockImplementation(() => {
      throw new Error('Creation failed');
    });

    expect(() => initializeContextMenu()).not.toThrow();
  });
});
