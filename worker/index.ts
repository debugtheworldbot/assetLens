import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { ENV, setRuntimeEnv, type RuntimeEnv } from "../server/_core/env";
import { setStorageBucket } from "../server/storage";
import { appRouter } from "../server/routers";

type Env = RuntimeEnv & {
  ASSETS: { fetch: (request: Request) => Promise<Response> };
  ASSET_BUCKET?: {
    get: (key: string) => Promise<{
      body: BodyInit | null;
      httpMetadata?: { contentType?: string };
      writeHttpMetadata?: (headers: Headers) => void;
    } | null>;
    put: (
      key: string,
      value: ReadableStream | ArrayBuffer | ArrayBufferView | string | Blob,
      options?: { httpMetadata?: { contentType?: string } },
    ) => Promise<unknown>;
  };
};

async function handleTrpc(request: Request) {
  return fetchRequestHandler({
    endpoint: "/api/trpc",
    req: request,
    router: appRouter,
    createContext: () => ({}),
  });
}

async function handleStorageProxy(request: Request, env: Env) {
  const url = new URL(request.url);
  const key = url.pathname.slice("/manus-storage/".length);

  if (!key) {
    return new Response("Missing storage key", { status: 400 });
  }

  if (env.ASSET_BUCKET) {
    const object = await env.ASSET_BUCKET.get(key);
    if (!object?.body) {
      return new Response("Not found", { status: 404 });
    }

    const headers = new Headers({ "Cache-Control": "public, max-age=31536000, immutable" });
    if (object.writeHttpMetadata) object.writeHttpMetadata(headers);
    if (!headers.has("Content-Type") && object.httpMetadata?.contentType) {
      headers.set("Content-Type", object.httpMetadata.contentType);
    }

    return new Response(object.body, { headers });
  }

  if (!ENV.forgeApiUrl || !ENV.forgeApiKey) {
    return new Response("Storage proxy not configured", { status: 500 });
  }

  try {
    const forgeUrl = new URL("v1/storage/presign/get", ENV.forgeApiUrl.replace(/\/+$/, "") + "/");
    forgeUrl.searchParams.set("path", key);

    const forgeResp = await fetch(forgeUrl, {
      headers: { Authorization: `Bearer ${ENV.forgeApiKey}` },
    });

    if (!forgeResp.ok) {
      const body = await forgeResp.text().catch(() => "");
      console.error(`[StorageProxy] forge error: ${forgeResp.status} ${body}`);
      return new Response("Storage backend error", { status: 502 });
    }

    const { url: signedUrl } = (await forgeResp.json()) as { url: string };
    if (!signedUrl) {
      return new Response("Empty signed URL from backend", { status: 502 });
    }

    return new Response(null, {
      status: 307,
      headers: {
        "Cache-Control": "no-store",
        Location: signedUrl,
      },
    });
  } catch (error) {
    console.error("[StorageProxy] failed:", error);
    return new Response("Storage proxy error", { status: 502 });
  }
}

export default {
  async fetch(request: Request, env: Env) {
    setRuntimeEnv({ ...env, NODE_ENV: "production" });
    setStorageBucket(env.ASSET_BUCKET ?? null);

    const { pathname } = new URL(request.url);

    if (pathname.startsWith("/api/trpc")) return handleTrpc(request);
    if (pathname.startsWith("/manus-storage/")) return handleStorageProxy(request, env);

    return env.ASSETS.fetch(request);
  },
};
