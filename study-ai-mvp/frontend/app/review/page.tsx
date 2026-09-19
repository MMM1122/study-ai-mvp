"use client";
import { useEffect,useState } from "react";
import { api, Flashcard } from "@/lib/api";
import { useI18n } from "@/components/I18n";

export default function Review(){
  const {t}=useI18n();
  const [cards,setCards]=useState<Flashcard[]>([]); const [i,setI]=useState(0); const [show,setShow]=useState(false); const [busy,setBusy]=useState(false);
  useEffect(()=>{api.due().then(setCards).catch(()=>{})},[]);
  const card=cards[i];
  async function rate(r:string){if(!card)return;setBusy(true);await api.review(card.id,r);setShow(false);setI(v=>v+1);setBusy(false)}
  if(!cards.length)return <div><header className="top"><div><p className="eyebrow">{t("SPACED REVIEW")}</p><h1>{t("Review queue")}</h1><p className="muted">{t("Practice active recall instead of rereading.")}</p></div></header><div className="heroEmpty"><div className="spark">✓</div><h2>{t("Nothing due right now")}</h2><p>{t("Generate notes from a document and its flashcards will appear here.")}</p></div></div>;
  if(!card)return <div className="heroEmpty"><div className="spark">✓</div><h2>{t("Session complete")}</h2><p>You reviewed {cards.length} cards.</p><a className="primary" href="/">{t("Back to dashboard")}</a></div>;
  return <div><header className="top"><div><p className="eyebrow">{t("SPACED REVIEW")}</p><h1>Review</h1><p className="muted">Card {i+1} of {cards.length}</p></div><div className="progress"><span style={{width:`${((i)/cards.length)*100}%`}}/></div></header>
    <div className="reviewWrap"><div className={`reviewCard ${show?"flipped":""}`} onClick={()=>setShow(true)}><small>{card.card_type.toUpperCase()}{card.source_page?` · p.${card.source_page}`:""}</small><h2>{card.front}</h2>{show?<div className="answer"><div className="divider"/><p>{card.back}</p></div>:<p className="tap">{t("Click to reveal answer")}</p>}</div>
    {show&&<div className="ratings"><button disabled={busy} onClick={()=>rate('again')}><b>{t("Again")}</b><small>~1 hour</small></button><button disabled={busy} onClick={()=>rate('hard')}><b>{t("Hard")}</b><small>{t("short interval")}</small></button><button disabled={busy} onClick={()=>rate('good')}><b>{t("Good")}</b><small>{t("normal")}</small></button><button disabled={busy} onClick={()=>rate('easy')}><b>{t("Easy")}</b><small>{t("long interval")}</small></button></div>}</div>
  </div>
}
