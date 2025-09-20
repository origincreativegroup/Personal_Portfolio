import { randomUUID } from 'node:crypto';

export type SignedUpload = {
  url: string;
  fields: Record<string, string>;
  expiresAt: string;
};

export class FileService {
  async createSignedUpload(objectName: string, contentType: string): Promise<SignedUpload> {
    const key = `${objectName}-${randomUUID()}`;
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
    return {
      url: `https://mock-storage.local/upload/${key}`,
      fields: {
        key,
        'Content-Type': contentType,
      },
      expiresAt,
    };
  }
}

export const fileService = new FileService();
