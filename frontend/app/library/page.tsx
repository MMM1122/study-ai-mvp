"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { api, Subject } from "@/lib/api";
import { useI18n } from "@/components/I18n";

export default function Dashboard(){
  const {t}=useI18n();
  const [stats,setStats]=useState<any>(null); const [subjects,setSubjects]=useState<Subject[]>([]);
  const [name,setName]=useState(""); const [busy,setBusy]=useState(false); const [error,setError]=useState("");
  async function load(){ try{ const [d,s]=await Promise.all([api.dashboard(),api.subjects()]); setStats(d); setSubjects(s);}catch(e:any){setError(e.message)} }
  useEffect(()=>{load()},[]);
  async function addSubject(e:React.FormEvent){e.preventDefault(); if(!name.trim())return; setBusy(true); try{await api.createSubject({name:name.trim(),icon:"📚",color:"indigo"}); setName(""); await load();}catch(e:any){setError(e.message)}finally{setBusy(false)}}
  return <div>
    <header className="top"><div><p className="eyebrow">{t("AI STUDY WORKSPACE")}</p><h1>{t("Good morning 👋")}</h1><p className="muted">{t("Turn your course files into notes you can actually review.")}</p></div><Link className="primary" href="/review">{t("Start review →")}</Link></header>
    {error&&<div className="error">{error}</div>}
    <section className="stats">
      <div className="stat"><b>{stats?.subjects??0}</b><span>{t("Subjects")}</span></div><div className="stat"><b>{stats?.documents??0}</b><span>{t("Documents")}</span></div><div className="stat"><b>{stats?.flashcards??0}</b><span>{t("Flashcards")}</span></div><div className="stat accent"><b>{stats?.due??0}</b><span>{t("Due today")}</span></div>
    </section>
    <section className="sectionHead"><div><h2>{t("Your subjects")}</h2><p className="muted">{t("Organize by course, then add folders for lectures, labs or papers.")}</p></div></section>
    <div className="subjectGrid">
      {subjects.map(s=><Link className="subjectCard" href={`/subjects/${s.id}`} key={s.id}><div className="subjectIcon">{s.icon}</div><div><h3>{s.name}</h3><p>{s.description||t("Open subject workspace")}</p></div><span className="arrow">→</span></Link>)}
      <form className="subjectCard newCard" onSubmit={addSubject}><div className="plus">＋</div><input value={name} onChange={e=>setName(e.target.value)} placeholder={t("New subject, e.g. CPSC 213")}/><button disabled={busy||!name.trim()}>{busy?t("Adding…"):t("Create")}</button></form>
    </div>
    <section className="sectionHead"><div><h2>{t("Recent documents")}</h2><p className="muted">{t("Continue where you left off.")}</p></div></section>
    <div className="list">{stats?.recent_documents?.length?stats.recent_documents.map((d:any)=><Link className="row" href={`/documents/${d.id}`} key={d.id}><span className="fileIcon">▤</span><div className="grow"><b>{d.title}</b><small>{d.filename}</small></div><span className={`status ${d.status}`}>{d.status}</span><span>→</span></Link>):<div className="empty">{t("Upload your first lecture to start building your study system.")}</div>}</div>
  </div>
}
