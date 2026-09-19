"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useI18n } from "./I18n";

export default function Sidebar(){
  const path=usePathname(); const {lang,setLang,t}=useI18n();
  const items = [["/", "⌂", t("Dashboard")],["/review", "↻", t("Review")]];
  return <aside className="sidebar">
    <div className="brand"><span className="brandMark">S</span><div><b>StudyAI</b><small>learn deeply</small></div></div>
    <nav>{items.map(([href,icon,label])=><Link key={href} className={path===href?"nav active":"nav"} href={href}><span>{icon}</span>{label}</Link>)}</nav>
    <div className="uiLang"><button className={lang==="en"?"on":""} onClick={()=>setLang("en")}>EN</button><button className={lang==="zh"?"on":""} onClick={()=>setLang("zh")}>中文</button></div>
    <div className="sidebarTip"><b>{t("Study loop")}</b><p>{t("Upload → Understand → Recall → Review")}</p></div>
  </aside>
}
