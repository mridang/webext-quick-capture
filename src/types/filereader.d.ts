/**
 * @file Ambient typings that restore the FileReader members the extension relies on.
 */
declare global {
  interface FileReader {
    readAsDataURL(blob: Blob): void;
    onloadend: (() => void) | null;
    onerror: (() => void) | null;
    result: string | ArrayBuffer | null;
  }

  const FileReader: {
    new (): FileReader;
  };
}

export {};
