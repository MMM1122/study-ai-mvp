"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { api, DocumentItem } from "@/lib/api";
import { useI18n } from "@/components/I18n";

export default function SubjectPage(){
  const {t}=useI18n();
  const params=useParams(); const id=Number(params.id);
  const [subject,setSubject]=useState<any>(null); const [docs,setDocs]=useState<DocumentItem[]>([]); const [folder,setFolder]=useState<number|null>(null);
  const [folderName,setFolderName]=useState(""); const [file,setFile]=useState<File|null>(null); const [busy,setBusy]=useState(false); const [msg,setMsg]=useState("");
  async function load(){ const [s,d]=await Promise.all([api.subject(id),api.documents(id,folder)]); setSubject(s);setDocs(d) }
  useEffect(()=>{if(id) load().catch(e=>setMsg(e.message))},[id,folder]);
  async function addFolder(e:React.FormEvent){e.preventDefault(); if(!folderName.trim())return; await api.createFolder(id,folderName.trim()); setFolderName(""); await load()}
  async function upload(e:React.FormEvent){e.preventDefault(); if(!file)return; setBusy(true);setMsg(t("Uploading and extracting…"));try{const d=await api.upload(id,folder,file); setMsg(t("Uploaded. Opening document…")); window.location.href=`/documents/${d.id}`;}catch(e:any){setMsg(e.message)}finally{setBusy(false)}}
  return <div>
    <header className="top"><div><Link className="crumb" href="/">← Dashboard</Link><h1>{subject?.icon} {subject?.name||"Subject"}</h1><p className="muted">{t("Course workspace")}</p></div></header>
    {msg&&<div className="notice">{msg}</div>}
    <div className="workspace">
      <aside className="folders"><h3>{t("Folders")}</h3><button className={folder===null?"folder active":"folder"} onClick={()=>setFolder(null)}>{t("All files")}</button>{subject?.folders?.map((f:any)=><button key={f.id} className={folder===f.id?"folder active":"folder"} onClick={()=>setFolder(f.id)}>▸ {f.name}</button>)}<form onSubmit={addFolder} className="folderForm"><input placeholder={t("New folder")} value={folderName} onChange={e=>setFolderName(e.target.value)}/><button>＋</button></form></aside>
      <section className="contentPanel"><div className="panelHead"><div><h2>{t("Materials")}</h2><p className="muted">{t("PDF, DOCX, PPTX, TXT or Markdown")}</p></div></div>
        <form className="uploadBox" onSubmit={upload}><div><b>{t("Drop in course material")}</b><p>{t("Upload lecture slides, readings or notes.")}</p></div><input type="file" accept=".pdf,.docx,.pptx,.txt,.md" onChange={e=>setFile(e.target.files?.[0]||null)}/><button className="primary" disabled={!file||busy}>{busy?t("Processing…"):t("Upload")}</button></form>
        <div className="list">{docs.length?docs.map(d=><Link className="row" href={`/documents/${d.id}`} key={d.id}><span className="fileIcon">▤</span><div className="grow"><b>{d.title}</b><small>{d.page_count?`${d.page_count} pages · `:""}{d.filename}</small></div><span className={`status ${d.status}`}>{d.status}</span><span>→</span></Link>):<div className="empty">{t("No files in this view yet.")}</div>}</div>
      </section>
    </div>
  </div>
}
