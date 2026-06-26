import {
  useQuery,
  useMutation,
  useQueryClient,
  type QueryClient,
} from "@tanstack/react-query";
import { apiFetch } from "./client";
import type {
  ApplicationIn,
  ApplicationOut,
  StatsOut,
  WishlistItemIn,
  WishlistItemOut,
} from "./types";

const APPS_KEY = ["applications"] as const;
const STATS_KEY = ["stats"] as const;

function invalidateBothKeys(qc: QueryClient) {
  qc.invalidateQueries({ queryKey: APPS_KEY });
  qc.invalidateQueries({ queryKey: STATS_KEY });
}

export function useApplications() {
  return useQuery<ApplicationOut[]>({
    queryKey: APPS_KEY,
    queryFn: () => apiFetch<ApplicationOut[]>("/applications"),
    staleTime: 0,
  });
}

export function useStats() {
  return useQuery<StatsOut>({
    queryKey: STATS_KEY,
    queryFn: () => apiFetch<StatsOut>("/stats"),
    staleTime: 0,
  });
}

export function useCreateApp() {
  const qc = useQueryClient();
  return useMutation<ApplicationOut, Error, ApplicationIn>({
    mutationFn: (data) =>
      apiFetch<ApplicationOut>("/applications", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => invalidateBothKeys(qc),
  });
}

export function useUpdateApp() {
  const qc = useQueryClient();
  return useMutation<ApplicationOut, Error, { id: string; data: ApplicationIn }>({
    mutationFn: ({ id, data }) =>
      apiFetch<ApplicationOut>(`/applications/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    onSuccess: () => invalidateBothKeys(qc),
  });
}

export function useDeleteApp() {
  const qc = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: (id) =>
      apiFetch<void>(`/applications/${id}`, { method: "DELETE" }),
    onSuccess: () => invalidateBothKeys(qc),
  });
}

export function useCycleStatus() {
  const qc = useQueryClient();
  return useMutation<
    ApplicationOut,
    Error,
    { id: string; data: ApplicationIn; next: string },
    { snapshot: ApplicationOut[] | undefined }
  >({
    onMutate: async ({ id, next }) => {
      await qc.cancelQueries({ queryKey: APPS_KEY });
      const snapshot = qc.getQueryData<ApplicationOut[]>(APPS_KEY);
      qc.setQueryData<ApplicationOut[]>(APPS_KEY, (rows) =>
        rows?.map((r) =>
          r.id === id ? { ...r, estado: next as ApplicationOut["estado"] } : r
        )
      );
      return { snapshot };
    },
    mutationFn: ({ id, data }) =>
      apiFetch<ApplicationOut>(`/applications/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    onError: (_e, _v, ctx) => {
      if (ctx?.snapshot !== undefined) {
        qc.setQueryData(APPS_KEY, ctx.snapshot);
      }
    },
    onSettled: () => invalidateBothKeys(qc),
  });
}

export function useUploadCV() {
  return useMutation<{ filename: string }, Error, File>({
    mutationFn: async (file) => {
      const formData = new FormData();
      formData.append("file", file);
      // Fetch directly to avoid JSON headers in apiFetch if it enforces them
      const res = await fetch("/api/upload-cv", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        throw new Error("Upload failed");
      }
      return res.json();
    },
  });
}

const WISHLIST_KEY = ["wishlist"] as const;

export function useWishlist() {
  return useQuery<WishlistItemOut[]>({
    queryKey: WISHLIST_KEY,
    queryFn: () => apiFetch<WishlistItemOut[]>("/wishlist"),
    staleTime: 0,
  });
}

export function useCreateWishlistItem() {
  const qc = useQueryClient();
  return useMutation<WishlistItemOut, Error, WishlistItemIn>({
    mutationFn: (data) =>
      apiFetch<WishlistItemOut>("/wishlist", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: WISHLIST_KEY });
    },
  });
}

export function useUpdateWishlistItem() {
  const qc = useQueryClient();
  return useMutation<
    WishlistItemOut,
    Error,
    { id: string; data: WishlistItemIn }
  >({
    mutationFn: ({ id, data }) =>
      apiFetch<WishlistItemOut>(`/wishlist/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: WISHLIST_KEY });
    },
  });
}

export function useDeleteWishlistItem() {
  const qc = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: (id) =>
      apiFetch<void>(`/wishlist/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: WISHLIST_KEY });
    },
  });
}
