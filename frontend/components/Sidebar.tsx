"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useI18n } from "./I18n";

export default function Sidebar(){
  const path=usePathname(); const {lang,setLang,t}=useI18n();
  const items = [["/", "✳", lang==="zh"?"概念实验室":"Concept Lab"],["/library", "▤", lang==="zh"?"资料库":"Library"],["/review", "↻", t("Review")]];
  return <aside className="sidebar">
    <div className="brand"><span className="brandMark">S</span><div><b>StudyAI</b><small>connect the dots</small></div></div>
    <nav>{items.map(([href,icon,label])=><Link key={href} className={(path===href||(href==="/"&&path==="/lab"))?"nav active":"nav"} href={href}><span>{icon}</span>{label}</Link>)}</nav>
    <div className="uiLang"><button className={lang==="en"?"on":""} onClick={()=>setLang("en")}>EN</button><button className={lang==="zh"?"on":""} onClick={()=>setLang("zh")}>中文</button></div>
    <div className="sidebarTip"><b>{t("Study loop")}</b><p>{lang==="zh"?"理解 → 实验 → 连接 → 迁移":"Understand → Play → Connect → Transfer"}</p></div>
  </aside>
}
