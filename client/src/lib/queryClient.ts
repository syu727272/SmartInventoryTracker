import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    try {
      // Try to parse as JSON first
      const data = await res.json();
      console.error("API Error:", {
        status: res.status,
        statusText: res.statusText,
        data
      });
      
      // ログイン失敗のエラーメッセージをより詳細に変換
      if (res.status === 401 && data.message) {
        console.log("Authentication error:", data.message);
        throw new Error(data.message);
      }
      
      // Return more detailed error message if available
      if (data.errors && Array.isArray(data.errors)) {
        const errorMessages = data.errors.map((e: any) => e.message || e).join(", ");
        throw new Error(errorMessages);
      }
      
      throw new Error(data.message || data.error || `${res.status}: ${res.statusText}`);
    } catch (jsonError) {
      if (jsonError instanceof Error && jsonError.message) {
        throw jsonError; // 既に処理済みのエラーをそのまま再スロー
      }
      // If JSON parsing fails, fallback to text
      const text = await res.text().catch(() => res.statusText);
      throw new Error(`${res.status}: ${text}`);
    }
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const res = await fetch(url, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    // 最初の要素はAPIパスで、残りはクエリパラメータとして扱う
    const baseUrl = queryKey[0] as string;
    
    // クエリパラメータを構築
    let url = baseUrl;
    if (queryKey.length > 1) {
      const params = new URLSearchParams();
      
      // queryKeyの残りの要素を2つずつ取り出してパラメータとして追加
      for (let i = 1; i < queryKey.length; i += 2) {
        const key = queryKey[i]?.toString();
        const value = queryKey[i + 1]?.toString();
        
        if (key && value !== undefined && value !== null && value !== "all") {
          params.append(key, value);
        }
      }
      
      const queryString = params.toString();
      if (queryString) {
        url = `${baseUrl}?${queryString}`;
      }
    }
    
    console.log("Fetching from URL:", url);
    
    const res = await fetch(url, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
