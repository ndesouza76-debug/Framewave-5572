import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { orpc, client } from "@/lib/api";

export type GalleryItem = Awaited<ReturnType<typeof client.gallery.list>>[number];

type ListInput = { search?: string; category?: string; sort?: "trending" | "recent" };

export function useGallery(input: ListInput) {
  return useQuery(
    orpc.gallery.list.queryOptions({
      input: { ...input, limit: 60 },
      staleTime: 10_000,
    }),
  );
}

export function useGalleryItem(id: string) {
  return useQuery(orpc.gallery.get.queryOptions({ input: { id }, enabled: !!id }));
}

export function useToggleLike(listInput: ListInput) {
  const qc = useQueryClient();
  const key = orpc.gallery.list.queryOptions({ input: { ...listInput, limit: 60 } }).queryKey;
  return useMutation(
    orpc.gallery.toggleLike.mutationOptions({
      onMutate: async ({ id }) => {
        await qc.cancelQueries({ queryKey: key });
        const prev = qc.getQueryData(key);
        qc.setQueryData(key, (old: GalleryItem[] | undefined) =>
          old?.map((g) =>
            g.id === id
              ? { ...g, liked: !g.liked, likeCount: g.liked ? g.likeCount - 1 : g.likeCount + 1 }
              : g,
          ),
        );
        return { prev };
      },
      onError: (_e, _v, ctx) => ctx && qc.setQueryData(key, ctx.prev),
      onSettled: () => qc.invalidateQueries({ queryKey: key }),
    }),
  );
}
