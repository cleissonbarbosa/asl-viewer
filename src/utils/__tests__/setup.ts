// Jest setup file to polyfill browser APIs for Node.js environment

// Polyfill for File constructor
global.File = class File {
  public name: string;
  public type: string;
  private content: string;

  constructor(chunks: BlobPart[], filename: string, options?: FilePropertyBag) {
    this.name = filename;
    this.type = options?.type || '';
    this.content = chunks.join('');
  }

  text(): Promise<string> {
    return Promise.resolve(this.content);
  }

  arrayBuffer(): Promise<ArrayBuffer> {
    const encoder = new TextEncoder();
    return Promise.resolve(encoder.encode(this.content).buffer);
  }

  stream(): ReadableStream {
    return new ReadableStream({
      start(controller) {
        controller.enqueue(this.content);
        controller.close();
      }
    });
  }

  slice(): Blob {
    return this as any;
  }

  get size(): number {
    return this.content.length;
  }
} as any;
