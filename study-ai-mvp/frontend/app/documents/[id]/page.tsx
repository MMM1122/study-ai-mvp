"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import LanguageToggle,{Lang} from "@/components/LanguageToggle";
import { api, Flashcard } from "@/lib/api";
import { useI18n } from "@/components/I18n";

function Bi({obj,en,zh,lang}:{obj:any,en:string,zh:string,lang:Lang}){return <>{(lang==='both'||lang==='en')&&obj?.[en]&&<p>{obj[en]}</p>}{(lang==='both'||lang==='zh')&&obj?.[zh]&&<p className="zh">{obj[zh]}</p>}</>}
function Source({page}:{page?:number|null}){return page?<span className="source">p.{page}</span>:null}

export default function DocumentPage(){
  const {t}=useI18n();
  const id=Number(useParams().id); const [doc,setDoc]=useState<any>(null); const [note,setNote]=useState<any>(null); const [cards,setCards]=useState<Flashcard[]>([]); const [lang,setLang]=useState<Lang>('both'); const [busy,setBusy]=useState(false); const [error,setError]=useState("");
  async function load(){ try{setDoc(await api.document(id)); try{setNote((await api.note(id)).content);setCards(await api.flashcards(id))}catch{} }catch(e:any){setError(e.message)} }
  useEffect(()=>{if(id)load()},[id]);
  async function generate(){setBusy(true);setError("");try{const n=await api.generate(id);setNote(n.content);setCards(await api.flashcards(id));setDoc(await api.document(id))}catch(e:any){setError(e.message)}finally{setBusy(false)}}
  if(!doc)return <div className="empty">{error||"Loading…"}</div>;
  return <div>
    <header className="top stickyTop"><div><button className="linkBtn" onClick={()=>history.back()}>← {t("Back")}</button><h1>{doc.title}</h1><p className="muted">{doc.filename}{doc.page_count?` · ${doc.page_count} pages`:''}</p></div><div className="actions"><LanguageToggle value={lang} onChange={setLang}/><button className="primary" onClick={generate} disabled={busy}>{busy?t("AI is organizing…"):note?t("Regenerate notes"):t("Generate AI notes")}</button></div></header>
    {error&&<div className="error">{error}</div>}
    {!note?<div className="heroEmpty"><div className="spark">✦</div><h2>{t("Ready to turn this file into study notes")}</h2><p>{t("StudyAI will create a bilingual summary, key points, 5 Why explanations, Cornell notes, examples, common mistakes and flashcards.")}</p><button className="primary big" onClick={generate} disabled={busy}>{busy?t("Generating…"):t("Generate study notes")}</button></div>:
    <div className="notes">
      <section className="noteSection"><div className="sectionLabel">01 · SUMMARY</div><h2>{note.title||doc.title}</h2><Bi obj={note.summary} en="en" zh="zh" lang={lang}/></section>
      <section className="noteSection"><div className="sectionLabel">02 · KEY POINTS</div><div className="keyGrid">{note.key_points?.map((k:any,i:number)=><article className="keyCard" key={i}><div className="keyTop"><span className={`importance ${k.importance}`}>{k.importance}</span><Source page={k.source_page}/></div><h3>{k.concept}</h3><Bi obj={k} en="explanation_en" zh="explanation_zh" lang={lang}/></article>)}</div></section>
      <section className="noteSection"><div className="sectionLabel">03 · 5 WHY</div><h2>{t("Go one layer deeper")}</h2><div className="whyList">{note.five_whys?.map((w:any,i:number)=><div className="why" key={i}><div className="whyNum">{i+1}</div><div className="grow">{(lang==='both'||lang==='en')&&<><b>{w.question_en}</b><p>{w.answer_en}</p></>}{(lang==='both'||lang==='zh')&&<><b className="zh">{w.question_zh}</b><p className="zh">{w.answer_zh}</p></>}<Source page={w.source_page}/></div></div>)}</div></section>
      <section className="noteSection"><div className="sectionLabel">04 · CORNELL NOTES</div><div className="cornell"><div className="cornellHead">Cue / Question</div><div className="cornellHead">Notes</div>{note.cornell?.rows?.map((r:any,i:number)=><div className="cornellRow" key={i}><div><Bi obj={r} en="cue_en" zh="cue_zh" lang={lang}/></div><div><Bi obj={r} en="notes_en" zh="notes_zh" lang={lang}/><Source page={r.source_page}/></div></div>)}</div><div className="cornellSummary"><b>{t("Summary")}</b><Bi obj={note.cornell} en="summary_en" zh="summary_zh" lang={lang}/></div></section>
      <section className="noteSection"><div className="sectionLabel">05 · EXAMPLES</div><div className="keyGrid">{note.examples?.map((x:any,i:number)=><article className="keyCard" key={i}><div className="keyTop"><h3>{x.title}</h3><Source page={x.source_page}/></div><Bi obj={x} en="explanation_en" zh="explanation_zh" lang={lang}/>{x.code&&<pre><code>{x.code}</code></pre>}</article>)}</div></section>
      <section className="noteSection"><div className="sectionLabel">06 · COMMON MISTAKES</div>{note.common_mistakes?.map((m:any,i:number)=><div className="mistake" key={i}><span>⚠</span><div>{(lang==='both'||lang==='en')&&<><b>{m.mistake_en}</b><p>Fix: {m.fix_en}</p></>}{(lang==='both'||lang==='zh')&&<><b className="zh">{m.mistake_zh}</b><p className="zh">改法：{m.fix_zh}</p></>}<Source page={m.source_page}/></div></div>)}</section>
      <section className="noteSection"><div className="sectionLabel">07 · FLASHCARDS</div><div className="flashPreview"><div><h2>{cards.length} {t("cards ready")}</h2><p className="muted">{t("Generated from this document and added to your review queue.")}</p></div><a className="primary" href="/review">{t("Review now →")}</a></div></section>
    </div>}
  </div>
}
