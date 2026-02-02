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
