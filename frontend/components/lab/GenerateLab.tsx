"use client";
import {useState} from 'react';
import {useRouter} from 'next/navigation';
import {API} from '@/lib/api';
import {useI18n} from '@/components/I18n';
export default function GenerateLab({documentId}:{documentId:number}){
 const {lang}=useI18n();const t=(en:string,zh:string)=>lang==='zh'?zh:en;const router=useRouter();
 const [busy,setBusy]=useState(false),[error,setError]=useState('');
 async function generate(){setBusy(true);setError('');try{const res=await fetch(`${API}/documents/${documentId}/lab`,{method:'POST'});if(!res.ok){const data=await res.json();throw new Error(res.status===503?t('AI is not configured. Add OPENAI_API_KEY to the backend; you can explore curated labs now.','尚未配置 AI。请在后端添加 OPENAI_API_KEY；现在可以先体验精选实验课。'):data.detail||t('Generation failed. Please retry.','生成失败，请重试。'))}router.push(`/lab?document=${documentId}`)}catch(e){setError(e instanceof Error?e.message:t('Cannot reach the backend.','无法连接后端。'))}finally{setBusy(false)}}
 return <section className="document-lab-invite"><div><span>✳ CONCEPT LAB</span><h2>{t('Turn this material into an experience.','把这份资料变成一次探索。')}</h2><p>{t('Get an interactive walkthrough, cross-disciplinary lenses and a challenge grounded in this document.','生成基于资料的互动过程、跨学科视角和理解挑战。')}</p></div><button className="primary" disabled={busy} onClick={generate}>{busy?t('Building your lesson…','正在生成实验课…'):t('Open / generate Concept Lab →','打开 / 生成实验课 →')}</button>{error&&<div className="error" role="alert">{error} <a href="/lab">{t('Explore curated labs','体验精选实验课')}</a></div>}</section>
}
