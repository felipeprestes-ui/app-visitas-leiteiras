const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3001/api";

export async function apiRequest<T>(path: string, init?: RequestInit) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {})
    },
    ...init
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`${response.status}:${text || "Falha na API."}`);
  }

  return (await response.json()) as T;
}