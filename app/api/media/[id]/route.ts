import { env } from "cloudflare:workers";
import { getChatGPTUser } from "@/app/chatgpt-auth";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };
type MediaRow = {
  user_id: string;
  visibility: string;
  share_token: string | null;
  image_key: string | null;
  image_type: string | null;
};

export async function GET(request: Request, context: Params) {
  const { id } = await context.params;
  const row = await env.DB.prepare(
    `SELECT user_id, visibility, share_token, image_key, image_type
       FROM memories WHERE id = ?`
  ).bind(id).first<MediaRow>();
  if (!row?.image_key) return new Response("Not found", { status: 404 });

  const user = await getChatGPTUser();
  const suppliedToken = new URL(request.url).searchParams.get("share");
  const isOwner = user?.id === row.user_id;
  const hasShareAccess = row.visibility === "shared" && !!row.share_token && suppliedToken === row.share_token;
  if (!isOwner && !hasShareAccess) return new Response("Forbidden", { status: 403 });

  const object = await env.BUCKET.get(row.image_key);
  if (!object) return new Response("Not found", { status: 404 });
  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("content-type", row.image_type ?? headers.get("content-type") ?? "application/octet-stream");
  headers.set("cache-control", hasShareAccess ? "public, max-age=3600" : "private, no-store");
  headers.set("x-content-type-options", "nosniff");
  return new Response(object.body, { headers });
}
