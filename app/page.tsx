import { ArrowRight, Flower2, ImagePlus, Link2, LockKeyhole, Sparkles, Users } from "lucide-react";
import { chatGPTSignInPath, getChatGPTUser } from "./chatgpt-auth";

export const dynamic = "force-dynamic";

export default async function Home() {
  const user = await getChatGPTUser();
  const destination = user ? "/studio" : chatGPTSignInPath("/studio");

  return (
    <main className="welcome-page">
      <header className="site-header welcome-header">
        <a className="brand" href="/" aria-label="拾光档案馆首页">
          <span className="brand-mark"><Flower2 size={18} /></span><span>拾光档案馆</span>
        </a>
        <div className="welcome-actions">
          <span className="privacy-note"><LockKeyhole />你的内容由你决定谁能看</span>
          <a className="record-button welcome-enter" href={destination} target={user ? undefined : "_top"}>
            {user ? "进入我的档案" : "登录并创建"}<ArrowRight />
          </a>
        </div>
      </header>

      <section className="welcome-hero">
        <div className="welcome-copy">
          <p className="eyebrow">A LIFE ARCHIVE OF YOUR OWN</p>
          <h1>每个人，都值得拥有一座<br /><span>自己的生活档案馆。</span></h1>
          <p>写下日常，上传照片，生成只属于你的个人画面。它可以永远私藏，也可以在你愿意的时候分享给重要的人。</p>
          <a className="welcome-cta" href={destination} target={user ? undefined : "_top"}>
            <Sparkles />{user ? "继续记录我的生活" : "开始建立我的档案"}<ArrowRight />
          </a>
          <div className="trust-row"><span><LockKeyhole />默认私密</span><span><Users />一人一档</span><span><Link2 />自主分享</span></div>
        </div>
        <div className="welcome-visual">
          <figure className="welcome-photo photo-one"><img src="/images/chongqing.jpg" alt="山城生活照片" /><figcaption>晚风绕过山城</figcaption></figure>
          <figure className="welcome-photo photo-two"><img src="/images/picnic.jpg" alt="朋友相聚的生活照片" /><figcaption>和喜欢的人浪费下午</figcaption></figure>
          <div className="welcome-ticket"><ImagePlus /><b>记录此刻</b><span>照片 · 文字 · 心情 · 地点</span></div>
        </div>
      </section>

      <section className="welcome-steps">
        <article><span>01</span><div><b>填写与上传</b><p>记录文字、时间、心情与照片。</p></div></article>
        <article><span>02</span><div><b>生成个人画面</b><p>每位使用者看到的，都是自己的生活档案。</p></div></article>
        <article><span>03</span><div><b>决定是否分享</b><p>默认仅自己可见，需要时再生成分享链接。</p></div></article>
      </section>
    </main>
  );
}
