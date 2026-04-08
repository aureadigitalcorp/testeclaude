"use client";

import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function useRealtime<T>(url: string, refreshInterval = 10000) {
  const { data, error, isLoading, mutate } = useSWR<T>(url, fetcher, {
    refreshInterval,
    revalidateOnFocus: true,
    dedupingInterval: 5000,
  });

  return { data, error, isLoading, mutate };
}
