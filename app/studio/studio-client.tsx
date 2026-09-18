"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  CalendarDays, Camera, Copy, ExternalLink, Flower2, ImagePlus, Link2,
  Loader2, LockKeyhole, MapPin, Plus, Share2, Smile, Sparkles, Trash2, Upload, X,
} from "lucide-react";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader,
  DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type Memory = {
  id: string;
  title: string;
  body: string;
  location: string;
  mood: string;
  memory_date: string;
  visibility: "private" | "shared";
  sharePath: string | null;
  imageUrl: string | null;
  created_at: string;
};

export default function StudioClient({ displayName, signOutPath }: { displayName: string; signOutPath: string }) {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [visibility, setVisibility] = useState("private");
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Memory | null>(null);

  const sharedCount = useMemo(() => memories.filter((item) => item.visibility === "shared").length, [memories]);

  useEffect(() => {
    fetch("/api/memories", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error("读取记录失败");
        return response.json();
      })
      .then((data) => setMemories(data.memories))
      .catch(() => toast.error("暂时无法读取记录，请稍后重试"))
      .finally(() => setLoading(false));
  }, []);

  const chooseFile = (selected: File | null) => {
    if (preview) URL.revokeObjectURL(preview);
    if (!selected) { setFile(null); setPreview(null); return; }
    if (selected.size > 8 * 1024 * 1024) { toast.error("图片不能超过 8MB"); return; }
    setFile(selected);
    setPreview(URL.createObjectURL(selected));
  };

  const submitMemory = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    const formData = new FormData(event.currentTarget);
    formData.set("visibility", visibility);
    if (file) formData.set("image", file);
    try {
      const response = await fetch("/api/memories", { method: "POST", body: formData });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "保存失败");
      setMemories((current) => [data.memory, ...current]);
      setDialogOpen(false);
      chooseFile(null);
      setVisibility("private");
      toast.success(visibility === "shared" ? "记忆已保存，可以分享给朋友了" : "记忆已私密保存");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "保存失败");
    } finally {
      setSaving(false);
    }
  };

  const shareMemory = async (memory: Memory) => {
    try {
      let updated = memory;
      if (memory.visibility !== "shared" || !memory.sharePath) {
        const response = await fetch(`/api/memories/${memory.id}`, {
          method: "PATCH", headers: { "content-type": "application/json" },
          body: JSON.stringify({ visibility: "shared" }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "开启分享失败");
        updated = { ...memory, visibility: "shared", sharePath: data.sharePath };
        setMemories((items) => items.map((item) => item.id === memory.id ? updated : item));
      }
      const url = `${window.location.origin}${updated.sharePath}`;
      if (navigator.share) {
        await navigator.share({ title: updated.title, text: "与你分享我的一页生活", url });
      } else {
        await navigator.clipboard.writeText(url);
        toast.success("分享链接已复制");
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      toast.error(error instanceof Error ? error.message : "分享失败");
    }
  };

  const makePrivate = async (memory: Memory) => {
    const response = await fetch(`/api/memories/${memory.id}`, {
      method: "PATCH", headers: { "content-type": "application/json" },
      body: JSON.stringify({ visibility: "private" }),
    });
    if (!response.ok) return toast.error("设置失败，请重试");
    setMemories((items) => items.map((item) => item.id === memory.id ? { ...item, visibility: "private" } : item));
    toast.success("已设为仅自己可见，原分享链接立即失效");
  };

  const deleteMemory = async (memory: Memory) => {
    const response = await fetch(`/api/memories/${memory.id}`, { method: "DELETE" });
    if (!response.ok) return toast.error("删除失败，请重试");
    setMemories((items) => items.filter((item) => item.id !== memory.id));
    setDeleteTarget(null);
    toast.success("这段记录已删除");
  };

  return (
    <main className="studio-page">
      <Toaster position="top-center" richColors />
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>删除这段记忆？</AlertDialogTitle><AlertDialogDescription>“{deleteTarget?.title}”及其照片将永久删除，无法恢复。</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>先保留</AlertDialogCancel><AlertDialogAction variant="destructive" onClick={() => deleteTarget && deleteMemory(deleteTarget)}>确认删除</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <header className="studio-header">
        <a className="brand" href="/"><span className="brand-mark"><Flower2 size={18} /></span><span>拾光档案馆</span></a>
        <div className="studio-account"><span>{displayName} 的私人空间</span><a href={signOutPath}>退出</a></div>
      </header>

      <section className="studio-top">
        <div><p className="eyebrow">MY PRIVATE LIFE ARCHIVE</p><h1>你好，{displayName}<br /><span>今天想收藏什么？</span></h1></div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild><Button className="studio-add"><Plus />记录此刻</Button></DialogTrigger>
          <DialogContent className="memory-dialog">
            <form onSubmit={submitMemory}>
              <DialogHeader><DialogTitle>收藏一段生活</DialogTitle><DialogDescription>文字和照片会进入你自己的档案空间。</DialogDescription></DialogHeader>
              <div className="memory-form">
                <label className="upload-zone">
                  {preview ? <><img src={preview} alt="照片预览" /><button type="button" onClick={(event) => { event.preventDefault(); chooseFile(null); }} aria-label="移除图片"><X /></button></> : <><ImagePlus /><b>选择一张照片</b><span>支持 JPG、PNG、WebP、GIF，最大 8MB</span></>}
                  <input type="file" name="image" accept="image/jpeg,image/png,image/webp,image/gif" onChange={(event) => chooseFile(event.target.files?.[0] ?? null)} />
                </label>
                <label>标题<input name="title" maxLength={80} required placeholder="这一刻，发生了什么？" /></label>
                <label>想记住的话<textarea name="body" maxLength={3000} rows={4} placeholder="写下那些不想忘记的细节……" /></label>
                <div className="form-row"><label>日期<input name="memoryDate" type="date" defaultValue={new Date().toISOString().slice(0, 10)} /></label><label>地点<input name="location" maxLength={80} placeholder="重庆" /></label></div>
                <label>此刻的心情<select name="mood" defaultValue="平静"><option>平静</option><option>开心</option><option>期待</option><option>感动</option><option>疲惫</option></select></label>
                <fieldset className="privacy-choice"><legend>谁可以看到？</legend>
                  <RadioGroup value={visibility} onValueChange={setVisibility}>
                    <label className={visibility === "private" ? "selected" : ""}><RadioGroupItem value="private" /><LockKeyhole /><span><b>仅自己可见</b><small>默认私密，只有你能打开</small></span></label>
                    <label className={visibility === "shared" ? "selected" : ""}><RadioGroupItem value="shared" /><Link2 /><span><b>链接可见</b><small>保存后可分享给别人查看</small></span></label>
                  </RadioGroup>
                </fieldset>
              </div>
              <DialogFooter><Button className="studio-save" type="submit" disabled={saving}>{saving ? <><Loader2 className="spin" />正在收藏</> : <><Upload />保存到我的档案</>}</Button></DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </section>

      <section className="studio-stats" aria-label="档案统计">
        <article><span>我的记录</span><b>{memories.length}</b><small>篇</small></article>
        <article><span>收藏照片</span><b>{memories.filter((item) => item.imageUrl).length}</b><small>张</small></article>
        <article><span>正在分享</span><b>{sharedCount}</b><small>篇</small></article>
        <div><LockKeyhole /><p><b>你拥有独立使用权</b><span>不同账户的数据完全分开，未分享的内容只有你能看到。</span></p></div>
      </section>

      <section className="archive-section">
        <div className="archive-title"><div><span>我的时间轴</span><h2>认真生活过的证据</h2></div><p>{memories.length ? `已收藏 ${memories.length} 段记忆` : "从第一段记忆开始"}</p></div>
        {loading ? <div className="archive-loading"><Loader2 className="spin" />正在打开你的档案……</div> : memories.length === 0 ? (
          <div className="archive-empty"><div><Camera /></div><h3>你的档案馆还是空的</h3><p>上传第一张照片，写下今天想记住的事。</p><Button className="studio-add" onClick={() => setDialogOpen(true)}><Sparkles />收藏第一段记忆</Button></div>
        ) : (
          <div className="archive-grid">{memories.map((memory) => (
            <article className="archive-card" key={memory.id}>
              {memory.imageUrl ? <figure><img src={memory.imageUrl} alt={memory.title} /></figure> : <div className="no-photo"><Flower2 /><span>这一页没有照片，<br />文字替你记得。</span></div>}
              <div className="archive-card-body">
                <div className="card-status"><span className={memory.visibility}>{memory.visibility === "shared" ? <><Link2 />链接可见</> : <><LockKeyhole />仅自己可见</>}</span><time>{formatDate(memory.memory_date)}</time></div>
                <h3>{memory.title}</h3>{memory.body && <p>{memory.body}</p>}
                <div className="memory-meta">{memory.location && <span><MapPin />{memory.location}</span>}<span><Smile />{memory.mood}</span></div>
                <div className="card-actions">
                  <button className="share-action" onClick={() => shareMemory(memory)}>{memory.visibility === "shared" ? <Copy /> : <Share2 />}{memory.visibility === "shared" ? "复制或分享" : "开启分享"}</button>
                  {memory.visibility === "shared" && <button onClick={() => makePrivate(memory)}><LockKeyhole />收回分享</button>}
                  {memory.visibility === "shared" && memory.sharePath && <a href={memory.sharePath} target="_blank" rel="noreferrer"><ExternalLink />预览</a>}
                  <button className="delete-action" onClick={() => setDeleteTarget(memory)} aria-label={`删除${memory.title}`}><Trash2 /></button>
                </div>
              </div>
            </article>
          ))}</div>
        )}
      </section>
    </main>
  );
}

function formatDate(value: string) {
  const [, month, day] = value.split("-");
  return `${Number(month)}月${Number(day)}日`;
}
