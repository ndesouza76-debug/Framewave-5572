import { client } from "./api";

/** Upload a file directly to Tigris via a presigned PUT URL. Returns the object key. */
export async function uploadFile(file: File): Promise<string> {
  const { url, key } = await client.upload.presign({
    filename: file.name,
    contentType: file.type,
  });
  const res = await fetch(url, {
    method: "PUT",
    body: file,
    headers: { "Content-Type": file.type },
  });
  if (!res.ok) throw new Error("Upload failed");
  return key;
}
