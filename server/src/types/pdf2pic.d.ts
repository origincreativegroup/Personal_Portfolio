declare module 'pdf2pic' {
  export interface ConvertOptions {
    density?: number;
    saveFilename?: string;
    savePath?: string;
    format?: string;
    width?: number;
    height?: number;
  }

  export interface FromBufferResult {
    bulk: (pageRange: number) => Promise<Array<{ name: string; size: number; path: string }>>;
  }

  export function fromBuffer(data: Buffer, options?: ConvertOptions): FromBufferResult;
  export const fromPath: unknown;
  export default function pdf2pic(): void;
}
