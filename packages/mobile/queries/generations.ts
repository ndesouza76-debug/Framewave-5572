import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { orpc, client } from "@/lib/api";

export type GenerationRow = Awaited<ReturnType<typeof client.generations.list>>[number];

export function useGenerations(enabled = true) {
  return useQuery(orpc.generations.list.queryOptions({ enabled }));
}

/** Poll a single generation while it is still running. */
export function useGeneration(id: string | null) {
  return useQuery(
    orpc.generations.get.queryOptions({
      input: { id: id ?? "" },
      enabled: !!id,
      refetchInterval: (query) => {
        const status = (query.state.data as GenerationRow | undefined)?.status;
        return status === "queued" || status === "processing" ? 2500 : false;
      },
    }),
  );
}

export function useCreateGeneration() {
  const qc = useQueryClient();
  return useMutation(
    orpc.generations.create.mutationOptions({
      onSuccess: () => qc.invalidateQueries({ queryKey: orpc.generations.list.key() }),
    }),
  );
}

export function useRetryGeneration() {
  const qc = useQueryClient();
  return useMutation(
    orpc.generations.retry.mutationOptions({
      onSuccess: () => qc.invalidateQueries({ queryKey: orpc.generations.list.key() }),
    }),
  );
}

export function useDeleteGeneration() {
  const qc = useQueryClient();
  return useMutation(
    orpc.generations.delete.mutationOptions({
      onSuccess: () => qc.invalidateQueries({ queryKey: orpc.generations.list.key() }),
    }),
  );
}

export function useToggleFavorite() {
  const qc = useQueryClient();
  const key = orpc.generations.list.key();
  return useMutation(
    orpc.generations.toggleFavorite.mutationOptions({
      onMutate: async ({ id }) => {
        await qc.cancelQueries({ queryKey: key });
        const prev = qc.getQueryData(key);
        qc.setQueryData(key, (old: GenerationRow[] | undefined) =>
          old?.map((g) => (g.id === id ? { ...g, isFavorite: !g.isFavorite } : g)),
        );
        return { prev };
      },
      onError: (_e, _v, ctx) => ctx && qc.setQueryData(key, ctx.prev),
      onSettled: () => qc.invalidateQueries({ queryKey: key }),
    }),
  );
}

export function useTogglePublic() {
  const qc = useQueryClient();
  return useMutation(
    orpc.generations.togglePublic.mutationOptions({
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: orpc.generations.list.key() });
        qc.invalidateQueries({ queryKey: orpc.gallery.list.key() });
      },
    }),
  );
}

export function useEnhancePrompt() {
  return useMutation(orpc.ai.enhancePrompt.mutationOptions());
}
