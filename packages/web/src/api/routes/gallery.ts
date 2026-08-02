import { z } from "zod";
import { and, desc, eq, like, sql } from "drizzle-orm";
import { ORPCError } from "@orpc/server";
import { base } from "../__core/app";
import { withUser, authed } from "../middleware/auth";
import { db } from "../database";
import * as schema from "../database/schema";
import type { Generation } from "../database/schema";
import { signGetUrl } from "../lib/s3";

async function withUrls(g: Generation & { creatorName?: string | null; liked?: boolean }) {
  const videoUrl = g.videoKey ? await signGetUrl(g.videoKey, 21_600) : null;
  return { ...g, videoUrl };
}

export const gallery = {
  /** Public gallery listing with search, category filter and sort. */
  list: withUser
    .input(
      z.object({
        search: z.string().max(120).optional(),
        category: z.string().max(40).optional(),
        sort: z.enum(["trending", "recent"]).default("trending"),
        limit: z.number().int().min(1).max(60).default(30),
      }),
    )
    .handler(async ({ input, context }) => {
      const conds = [eq(schema.generations.isPublic, true)];
      if (input.category && input.category !== "all") {
        conds.push(eq(schema.generations.category, input.category));
      }
      if (input.search) {
        conds.push(like(schema.generations.prompt, `%${input.search}%`));
      }

      const rows = await db
        .select({
          gen: schema.generations,
          creatorName: schema.user.name,
        })
        .from(schema.generations)
        .innerJoin(schema.user, eq(schema.generations.userId, schema.user.id))
        .where(and(...conds))
        .orderBy(
          input.sort === "trending"
            ? desc(schema.generations.likeCount)
            : desc(schema.generations.createdAt),
        )
        .limit(input.limit);

      // Which of these has the current user liked?
      let likedSet = new Set<string>();
      if (context.user && rows.length) {
        const liked = await db
          .select({ id: schema.likes.generationId })
          .from(schema.likes)
          .where(eq(schema.likes.userId, context.user.id));
        likedSet = new Set(liked.map((l) => l.id));
      }

      return Promise.all(
        rows.map((r) =>
          withUrls({ ...r.gen, creatorName: r.creatorName, liked: likedSet.has(r.gen.id) }),
        ),
      );
    }),

  /** Distinct categories present in the public gallery, with counts. */
  categories: base.handler(async () => {
    const rows = await db
      .select({
        category: schema.generations.category,
        count: sql<number>`count(*)`,
      })
      .from(schema.generations)
      .where(eq(schema.generations.isPublic, true))
      .groupBy(schema.generations.category);
    return rows;
  }),

  /** A single public video (shareable detail page). */
  get: withUser.input(z.object({ id: z.string() })).handler(async ({ input, context }) => {
    const [row] = await db
      .select({ gen: schema.generations, creatorName: schema.user.name })
      .from(schema.generations)
      .innerJoin(schema.user, eq(schema.generations.userId, schema.user.id))
      .where(and(eq(schema.generations.id, input.id), eq(schema.generations.isPublic, true)));
    if (!row) throw new ORPCError("NOT_FOUND");

    let liked = false;
    if (context.user) {
      const [l] = await db
        .select()
        .from(schema.likes)
        .where(and(eq(schema.likes.userId, context.user.id), eq(schema.likes.generationId, input.id)));
      liked = !!l;
    }
    return withUrls({ ...row.gen, creatorName: row.creatorName, liked });
  }),

  /** Like / unlike a public video. */
  toggleLike: authed.input(z.object({ id: z.string() })).handler(async ({ input, context }) => {
    const [g] = await db.select().from(schema.generations).where(eq(schema.generations.id, input.id));
    if (!g || !g.isPublic) throw new ORPCError("NOT_FOUND");

    const [existing] = await db
      .select()
      .from(schema.likes)
      .where(and(eq(schema.likes.userId, context.user.id), eq(schema.likes.generationId, input.id)));

    if (existing) {
      await db
        .delete(schema.likes)
        .where(and(eq(schema.likes.userId, context.user.id), eq(schema.likes.generationId, input.id)));
      await db
        .update(schema.generations)
        .set({ likeCount: Math.max(0, g.likeCount - 1) })
        .where(eq(schema.generations.id, input.id));
      return { liked: false, likeCount: Math.max(0, g.likeCount - 1) };
    }

    await db.insert(schema.likes).values({ userId: context.user.id, generationId: input.id });
    await db
      .update(schema.generations)
      .set({ likeCount: g.likeCount + 1 })
      .where(eq(schema.generations.id, input.id));
    return { liked: true, likeCount: g.likeCount + 1 };
  }),
};
