"use client";
export type Lang = "both"|"en"|"zh";
export default function LanguageToggle({value,onChange}:{value:Lang,onChange:(v:Lang)=>void}){
  return <div className="segmented">{([['both','中英'],['en','EN'],['zh','中文']] as const).map(([v,t])=><button key={v} onClick={()=>onChange(v)} className={value===v?"selected":""}>{t}</button>)}</div>
}
