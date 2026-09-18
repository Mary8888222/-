import type { Metadata } from "next";
import { env } from "cloudflare:workers";
import { notFound } from "next/navigation";
import { CalendarDays, Flower2, Heart, MapPin, Smile } from "lucide-react";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ token: string }> };
type SharedMemory = {
  id: string;
  owner_name: string;
  title: string;
  body: string;
  location: string;
  mood: string;
  memory_date: string;
  image_key: string | null;
  share_token: string;
};

async function getMemory(token: string) {
  return env.DB.prepare(
    `SELECT id, owner_name, title, body, location, mood, memory_date,
            image_key, share_token
       FROM memories
      WHERE share_token = ? AND visibility = 'shared'`
  ).bind(token).first<SharedMemory>();
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { token } = await params;
  const memory = await getMemory(token);
  if (!memory) return { title: "这段记忆暂时不可见｜拾光档案馆" };
  return {
    title: `${memory.title}｜${memory.owner_name}的拾光档案`,
    description: memory.body.slice(0, 120) || "一段被认真收藏的生活记忆。",
  };
}

export default async function SharedMemoryPage({ params }: PageProps) {
  const { token } = await params;
  const memory = await getMemory(token);
  if (!memory) notFound();

  return (
    <main className="shared-page">
      <header className="shared-header">
        <a className="brand" href="/"><span className="brand-mark"><Flower2 size={18} /></span><span>拾光档案馆</span></a>
        <span>由 {memory.owner_name} 与你分享</span>
      </header>
      <article className="shared-memory">
        <div className="shared-label"><Heart fill="currentColor" />A MOMENT SHARED WITH YOU</div>
        {memory.image_key && <figure><img src={`/api/media/${memory.id}?share=${memory.share_token}`} alt={memory.title} /></figure>}
        <div className="shared-content">
          <p className="shared-date"><CalendarDays />{formatDate(memory.memory_date)}</p>
          <h1>{memory.title}</h1>
          {memory.body && <p className="shared-body">{memory.body}</p>}
          <div className="shared-meta">
            {memory.location && <span><MapPin />{memory.location}</span>}
            <span><Smile />{memory.mood}</span>
          </div>
          <div className="shared-sign">—— {memory.owner_name} 的一页生活</div>
        </div>
      </article>
      <a className="shared-create" href="/">我也想建立自己的生活档案 <span>→</span></a>
    </main>
  );
}

function formatDate(value: string) {
  const [year, month, day] = value.split("-");
  return `${year} 年 ${Number(month)} 月 ${Number(day)} 日`;
}
