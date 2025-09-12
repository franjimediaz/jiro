export const API_BASE =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") || "";

type RequestOptions = Omit<RequestInit, "body"> & {
  body?: any; // JSON o FormData
  redirectOn403?: boolean; // true por defecto
};

async function request<T = any>(path: string, opts: RequestOptions = {}) {
  const url = `${API_BASE}${path.startsWith("/") ? path : `/${path}`}`;
  const isFormData =
    typeof window !== "undefined" && opts.body instanceof FormData;

  const res = await fetch(url, {
    method: opts.method || "GET",
    credentials: "include",
    headers: {
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      ...(opts.headers || {}),
    },
    body: isFormData
      ? opts.body
      : opts.body != null
        ? JSON.stringify(opts.body)
        : undefined,
    cache: "no-store",
  });

  if (res.status === 401 && typeof window !== "undefined") {
    window.location.href = "/login";
    throw new Error("No autenticado");
  }

  if (
    (opts.redirectOn403 ?? true) &&
    res.status === 403 &&
    typeof window !== "undefined"
  ) {
    window.location.href = "/403";
    throw new Error("Permiso denegado");
  }

  const text = await res.text();
  const data = text ? JSON.parse(text) : null;

  if (!res.ok) {
    const err = new Error(
      (data && (data.error || data.message)) || res.statusText
    ) as Error & {
      status?: number;
      data?: any;
    };
    err.status = res.status;
    err.data = data;
    throw err;
  }

  return data as T;
}

export const api = {
  get: <T = any>(path: string, opts?: RequestOptions) =>
    request<T>(path, { ...opts, method: "GET" }),
  post: <T = any>(path: string, body?: any, opts?: RequestOptions) =>
    request<T>(path, { ...opts, method: "POST", body }),
  put: <T = any>(path: string, body?: any, opts?: RequestOptions) =>
    request<T>(path, { ...opts, method: "PUT", body }),
  patch: <T = any>(path: string, body?: any, opts?: RequestOptions) =>
    request<T>(path, { ...opts, method: "PATCH", body }),
  del: <T = any>(path: string, opts?: RequestOptions) =>
    request<T>(path, { ...opts, method: "DELETE" }),
};
