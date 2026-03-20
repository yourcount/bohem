function readToken(name: string) {
  return process.env[name]?.trim() ?? "";
}

export function getMediaBlobToken() {
  return readToken("MEDIA_BLOB_READ_WRITE_TOKEN") || readToken("BLOB_READ_WRITE_TOKEN");
}

export function shouldUseBlobMediaStorage() {
  return Boolean(process.env.VERCEL && getMediaBlobToken());
}

export function isVercelWithoutMediaBlobStorage() {
  return Boolean(process.env.VERCEL) && !getMediaBlobToken();
}

