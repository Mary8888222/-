import { env } from "cloudflare:workers";
import { getChatGPTUser } from "@/app/chatgpt-auth";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: Params) {
  const user = await getChatGPTUser();
  if (!user) return Response.json({ error: "请先登录" }, { status: 401 });

  const { id } = await context.params;
  const input = await request.json().catch(() => ({}));
  const visibility = input.visibility === "shared" ? "shared" : "private";

  const row = await env.DB.prepare(
    "SELECT share_token FROM memories WHERE id = ? AND user_id = ?"
  ).bind(id, user.id).first<{ share_token: string | null }>();
  if (!row) return Response.json({ error: "没有找到这段记录" }, { status: 404 });

  const shareToken = visibility === "shared" ? (row.share_token ?? makeToken()) : row.share_token;
  await env.DB.prepare(
    "UPDATE memories SET visibility = ?, share_token = ?, updated_at = ? WHERE id = ? AND user_id = ?"
  ).bind(visibility, shareToken, new Date().toISOString(), id, user.id).run();

  return Response.json({ visibility, sharePath: shareToken ? `/share/${shareToken}` : null });
}

export async function DELETE(_request: Request, context: Params) {
  const user = await getChatGPTUser();
  if (!user) return Response.json({ error: "请先登录" }, { status: 401 });
  const { id } = await context.params;

  const row = await env.DB.prepare(
    "SELECT image_key FROM memories WHERE id = ? AND user_id = ?"
  ).bind(id, user.id).first<{ image_key: string | null }>();
  if (!row) return Response.json({ error: "没有找到这段记录" }, { status: 404 });

  await env.DB.prepare("DELETE FROM memories WHERE id = ? AND user_id = ?").bind(id, user.id).run();
  if (row.image_key) await env.BUCKET.delete(row.image_key);
  return Response.json({ ok: true });
}

function makeToken() {
  const bytes = crypto.getRandomValues(new Uint8Array(18));
  return Array.from(bytes, (byte) => byte.toString(36).padStart(2, "0")).join("");
}
