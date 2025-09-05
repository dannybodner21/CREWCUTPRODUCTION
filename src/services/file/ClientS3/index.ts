import { createStore, del, get, set } from 'idb-keyval';

const BROWSER_S3_DB_NAME = 'lobechat-local-s3';

export class BrowserS3Storage {
  private store;

  constructor() {
    // skip server-side rendering
    if (typeof window === 'undefined') return;

    this.store = createStore(BROWSER_S3_DB_NAME, 'objects');
  }

  /**
   * 上传文件
   * @param key 文件 hash
   * @param file File 对象
   */
  putObject = async (key: string, file: File): Promise<void> => {
    try {
      // For text files, ensure proper UTF-8 encoding
      const ext = file.name.split('.').pop()?.toLowerCase();
      const isTextFile = ['txt', 'md', 'markdown', 'json', 'js', 'ts', 'jsx', 'tsx', 'html', 'css', 'xml'].includes(ext || '');

      let data: ArrayBuffer;
      if (isTextFile) {
        // For text files, read as text first to ensure proper UTF-8 encoding
        const textContent = await file.text();
        const encoder = new TextEncoder();
        data = encoder.encode(textContent).buffer as ArrayBuffer;
      } else {
        // For binary files, use arrayBuffer directly
        data = await file.arrayBuffer();
      }

      await set(key, { data, name: file.name, type: file.type }, this.store);
    } catch (e) {
      throw new Error(`Failed to put file ${file.name}: ${(e as Error).message}`);
    }
  };

  /**
   * 获取文件
   * @param key 文件 hash
   * @returns File 对象
   */
  getObject = async (key: string): Promise<File | undefined> => {
    try {
      const res = await get<{ data: ArrayBuffer; name: string; type: string }>(key, this.store);
      if (!res) return;

      // For text files, ensure proper UTF-8 decoding
      const ext = res.name.split('.').pop()?.toLowerCase();
      const isTextFile = ['txt', 'md', 'markdown', 'json', 'js', 'ts', 'jsx', 'tsx', 'html', 'css', 'xml'].includes(ext || '');

      let fileData: ArrayBuffer | string;
      if (isTextFile) {
        // For text files, decode as UTF-8 string first
        const decoder = new TextDecoder('utf8');
        fileData = decoder.decode(res.data);
      } else {
        // For binary files, use ArrayBuffer directly
        fileData = res.data;
      }

      return new File([fileData], res.name, { type: res.type });
    } catch (e) {
      console.log(`Failed to get object (key=${key}):`, e);
      return undefined;
    }
  };

  /**
   * 删除文件
   * @param key 文件 hash
   */
  deleteObject = async (key: string): Promise<void> => {
    try {
      await del(key, this.store);
    } catch (e) {
      throw new Error(`Failed to delete object (key=${key}): ${(e as Error).message}`);
    }
  };
}

export const clientS3Storage = new BrowserS3Storage();
