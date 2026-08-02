import { z } from "zod";
import { authed } from "../middleware/auth";
import { signPutUrl } from "../lib/s3";

/** Presigned direct-upload URLs for source images (image-to-video mode). */
export const upload = {
  presign: authed
    .input(z.object({ filename: z.string(), contentType: z.string() }))
    .handler(async ({ input, context }) => {
      const safe = input.filename.replace(/[^a-zA-Z0-9._-]/g, "_");
      const key = `uploads/${context.user.id}/${Date.now()}-${safe}`;
      const url = await signPutUrl(key, input.contentType);
      return { url, key };
    }),
};
