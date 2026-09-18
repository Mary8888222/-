import { env } from "cloudflare:workers";
import { getChatGPTUser } from "@/app/chatgpt-auth";

export const dynamic = "force-dynamic";

type MemoryRow = {
  id: string;
  title: string;
  body: string;
  location: string;
  mood: string;
  memory_date: string;
  visibility: "private" | "shared";
  share_token: string | null;
  image_key: string | null;
  created_at: string;
};

const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const moods = new Set(["平静", "开心", "期待", "感动", "疲惫"]);

export async function GET() {
  const user = await getChatGPTUser();
  if (!user) return Response.json({ error: "请先登录" }, { status: 401 });

  const result = await env.DB.prepare(
    `SELECT id, title, body, location, mood, memory_date, visibility,
            share_token, image_key, created_at
       FROM memories
      WHERE user_id = ?
      ORDER BY memory_date DESC, created_at DESC`
  ).bind(user.id).all<MemoryRow>();

  return Response.json({
    memories: result.results.map((row) => ({
      ...row,
      imageUrl: row.image_key ? `/api/media/${row.id}` : null,
      sharePath: row.share_token ? `/share/${row.share_token}` : null,
    })),
  });
}

export async function POST(request: Request) {
  const user = await getChatGPTUser();
  if (!user) return Response.json({ error: "请先登录" }, { status: 401 });

  const form = await request.formData();
  const title = clean(form.get("title"), 80);
  const body = clean(form.get("body"), 3000);
  const location = clean(form.get("location"), 80);
  const moodValue = clean(form.get("mood"), 10);
  const mood = moods.has(moodValue) ? moodValue : "平静";
  const dateValue = clean(form.get("memoryDate"), 10);
  const memoryDate = /^\d{4}-\d{2}-\d{2}$/.test(dateValue)
    ? dateValue
    : new Date().toISOString().slice(0, 10);
  const visibility = form.get("visibility") === "shared" ? "shared" : "private";
  const file = form.get("image");

  if (!title) return Response.json({ error: "请填写标题" }, { status: 400 });
  if (file instanceof File && file.size > 8 * 1024 * 1024) {
    return Response.json({ error: "图片不能超过 8MB" }, { status: 400 });
  }
  if (file instanceof File && file.size > 0 && !allowedTypes.has(file.type)) {
    return Response.json({ error: "请上传 JPG、PNG、WebP 或 GIF 图片" }, { status: 400 });
  }

  const id = crypto.randomUUID();
  const shareToken = visibility === "shared" ? makeToken() : null;
  const now = new Date().toISOString();
  let imageKey: string | null = null;
  let imageType: string | null = null;

  if (file instanceof File && file.size > 0) {
    const extension = extensionFor(file.type);
    imageKey = `users/${user.id}/${id}/photo.${extension}`;
    imageType = file.type;
    await env.BUCKET.put(imageKey, await file.arrayBuffer(), {
      httpMetadata: { contentType: file.type },
    });
  }

  try {
    await env.DB.prepare(
      `INSERT INTO memories
       (id, user_id, owner_name, title, body, location, mood, memory_date,
        visibility, share_token, image_key, image_type, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      id, user.id, user.displayName, title, body, location, mood, memoryDate,
      visibility, shareToken, imageKey, imageType, now, now,
    ).run();
  } catch (error) {
    if (imageKey) await env.BUCKET.delete(imageKey);
    throw error;
  }

  return Response.json({
    memory: {
      id, title, body, location, mood, memory_date: memoryDate, visibility,
      share_token: shareToken, imageUrl: imageKey ? `/api/media/${id}` : null,
      sharePath: shareToken ? `/share/${shareToken}` : null, created_at: now,
    },
  }, { status: 201 });
}

function clean(value: FormDataEntryValue | null, max: number) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function makeToken() {
  const bytes = crypto.getRandomValues(new Uint8Array(18));
  return Array.from(bytes, (byte) => byte.toString(36).padStart(2, "0")).join("");
}

function extensionFor(type: string) {
  if (type === "image/png") return "png";
  if (type === "image/webp") return "webp";
  if (type === "image/gif") return "gif";
  return "jpg";
}
