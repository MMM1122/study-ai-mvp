"use client";
import {useEffect, useState} from 'react';
import Link from 'next/link';
import {useSearchParams} from 'next/navigation';
import {useI18n} from '@/components/I18n';
import Simulator from './Simulators';
import KnowledgeMap from './KnowledgeMap';
import catalog from '@/lib/lab/catalog.json';
import type {Lesson, Bi, LabDocument} from '@/lib/lab/types';
import {API} from '@/lib/api';
import './lab.css';

const curated = catalog as Lesson[];
const patterns = [
  ['all','All connections','全部连接','✳'],['representation','Representation','表征','◎'],
  ['systems','Systems & change','系统与变化','⇄'],['feedback','Feedback','反馈','↻'],
  ['constraints','Constraints','约束','◫'],['levels','Levels & parts','层次与部分','▱']
];
const symbols:Record<string,string> = {representation:'◎',systems:'⇄',feedback:'↻',constraints:'◫',levels:'▱'};
type Progress = Record<string,{explored?:boolean;solved?:boolean}>;

function LessonView({lesson,progress,update,document}:{lesson:Lesson;progress:Progress;update:(kind:'explored'|'solved')=>void;document?:LabDocument}) {
  const {lang}=useI18n(); const t=(en:string,zh:string)=>lang==='zh'?zh:en; const b=(v:Bi)=>v[lang];
  const [mode,setMode]=useState('play'), [lens,setLens]=useState(0), [choice,setChoice]=useState<number|null>(null), [checked,setChecked]=useState(false);
  const bridge=lesson.bridges[lens]; const correct=choice===lesson.challenge.answer;
  return <>
    <div className="lesson-heading"><div><div className="overline">{t('YOUR EXPERIMENT','你的实验')} <span> / {document?t('FROM YOUR MATERIAL','来自你的资料'):t('CURATED LESSON','精选课程')}</span></div><h2>{b(lesson.title)}</h2><p>{b(lesson.question)}</p></div><div className="lesson-status">{progress[lesson.id]?.solved?'✓ '+t('Challenge passed','挑战已通过'):t('Explore at your own pace','按自己的节奏探索')}</div></div>
    <div className="lesson-layout"><section className="experiment-panel"><div className="mode-tabs" role="tablist" aria-label={t('Learning mode','学习模式')}>{[['understand','01','Understand','理解'],['play','02','Play','实验'],['challenge','03','Challenge','挑战']].map(([key,n,en,zh])=><button id={`tab-${key}`} role="tab" aria-controls={`panel-${key}`} aria-selected={mode===key} key={key} onClick={()=>setMode(key)}><small>{n}</small>{t(en,zh)}<span>{key==='play'?'↗':''}</span></button>)}</div>
      <div className="lesson-body" id={`panel-${mode}`} role="tabpanel" aria-labelledby={`tab-${mode}`}>
      {mode==='understand'?<div className="understand"><span className="overline">{t('START WITH INTUITION','从直觉开始')}</span><h3>{b(lesson.question)}</h3><p>{b(lesson.intuition)}</p><ol>{lesson.steps.map((s,i)=><li key={i}><span>{i+1}</span><div><b>{b(s.title)}</b><p>{b(s.detail)}</p></div></li>)}</ol><button className="lab-btn dark" onClick={()=>setMode('play')}>{t('Make it visible →','把它变得可见 →')}</button></div>:mode==='play'?<><div className="play-intro"><span className="live-dot"/>{t('Change one thing. Notice what follows.','改变一件事，观察接下来发生什么。')}</div><Simulator lesson={lesson} onExplore={()=>update('explored')}/><button className="challenge-link" onClick={()=>setMode('challenge')}>{t('Ready to test your understanding?','准备检验理解了吗？')} <span>{t('Try a challenge →','接受挑战 →')}</span></button></>:<div className="challenge-panel"><span className="overline">{t('PREDICT → CHECK → EXPLAIN','预测 → 检验 → 解释')}</span><h3>{b(lesson.challenge.question)}</h3><div className="answer-options">{lesson.challenge.options.map((option,i)=><button key={i} disabled={checked} aria-pressed={choice===i} className={`${choice===i?'chosen':''} ${checked&&i===lesson.challenge.answer?'correct':''}`} onClick={()=>setChoice(i)}><span>{String.fromCharCode(65+i)}</span>{b(option)}</button>)}</div>{!checked?<button className="lab-btn dark" disabled={choice===null} onClick={()=>{setChecked(true);if(correct)update('solved')}}>{t('Check my prediction','检验我的预测')}</button>:<div className={`answer-feedback ${correct?'success':''}`} role="status"><b>{correct?t('✓ Connection made.','✓ 连接建立了。'):t('A useful wrong turn.','这次试错很有价值。')}</b><p>{b(lesson.challenge.explanation)}</p><button className="lab-btn" onClick={()=>{setChecked(false);setChoice(null);setMode('play')}}>{t('Return to the experiment','回到实验')}</button></div>}</div>}
      </div>
    </section><aside className="bridge-panel"><div className="overline">{t('SAME IDEA, NEW LENS','同一个想法，新的视角')} <span>↗</span></div><h3>{t('Knowledge travels.','让知识流动。')}</h3><p className="bridge-intro">{t('Carry the structure into another field.','把共同结构带到另一个领域。')}</p><div className="bridge-tabs">{lesson.bridges.map((item,i)=><button key={i} aria-pressed={lens===i} className={lens===i?'selected':''} onClick={()=>{setLens(i);update('explored')}}>{b(item.field)}</button>)}</div><div className="bridge-example"><span>{symbols[lesson.pattern]}</span><h4>{b(bridge.example)}</h4></div><div className="bridge-detail"><b>{t('THE SHARED STRUCTURE','共同结构')}</b><p>{b(bridge.mapping)}</p></div><div className="bridge-boundary"><b>↳ {t('WHERE THE ANALOGY STOPS','类比的边界')}</b><p>{b(bridge.boundary)}</p></div><p className="bridge-footer">{t('A bridge for thinking. Not a claim of equivalence.','帮助思考的桥梁，不是等同关系。')}</p></aside></div>
    <details className="lesson-sources"><summary>{t('Teaching notes & sources','教学说明与来源')} <span>+</span></summary><p>{document?t('AI-generated teaching draft. Quotes were checked against extracted text; this does not verify the explanation or analogy. Check the original material.','AI 生成的教学草稿。引文已与提取文本匹配；这并不验证讲解或类比的正确性，请核对原始资料。'):t('Curated, simplified teaching examples. These are not extracted from your course files. Cross-domain examples are teaching analogies.','精选的简化教学示例，并非提取自你的课程文件。跨学科例子属于教学类比。')}</p>{document&&<Link href={`/documents/${document.document_id}`}>{document.document_title} ↗</Link>}{document?.truncated&&<p>{t('Only the beginning of the document fit within the generation limit.','生成时仅使用了字符上限以内的资料开头部分。')}</p>}{lesson.source_facts.map((fact,i)=><blockquote key={i}>{fact.quote}{fact.page&&<small> · p. {fact.page}</small>}</blockquote>)}{lesson.sources.map(source=><a key={source.url} href={source.url} target="_blank" rel="noreferrer">{source.label} ↗</a>)}</details>
  </>;
}

export default function ConceptLab(){
  const {lang}=useI18n();const t=(en:string,zh:string)=>lang==='zh'?zh:en;const b=(v:Bi)=>v[lang];
  const params=useSearchParams();
  const [view,setView]=useState<'cards'|'map'>('cards');
  const [pattern,setPattern]=useState('all'),[search,setSearch]=useState(''),[field,setField]=useState('all');
  const [selected,setSelected]=useState('representation'),[progress,setProgress]=useState<Progress>({}),[ready,setReady]=useState(false);
  const [saved,setSaved]=useState<LabDocument[]>([]),[source,setSource]=useState('curated'),[loadError,setLoadError]=useState(''),[loading,setLoading]=useState(false);
  useEffect(()=>{try{const p=JSON.parse(localStorage.getItem('studyai-lab-progress-v1')||'{}');if(p&&typeof p==='object'&&!Array.isArray(p))setProgress(p)}catch{}setReady(true)},[]);
  useEffect(()=>{if(ready)try{localStorage.setItem('studyai-lab-progress-v1',JSON.stringify(progress))}catch{}},[progress,ready]);
  async function loadSaved(){setLoading(true);setLoadError('');try{const res=await fetch(`${API}/labs`);if(!res.ok)throw new Error();const data:LabDocument[]=await res.json();setSaved(data);const requested=params.get('document');if(requested){setSource(requested);const doc=data.find(d=>String(d.document_id)===requested);if(doc?.concepts[0])setSelected(`doc-${doc.document_id}-${doc.concepts[0].id}`)}}catch{setLoadError(t('Could not load saved labs. Start the backend and retry. Curated lessons are available.','无法加载已保存的实验课。请启动后端并重试。精选课程仍可使用。'))}finally{setLoading(false)}}
  useEffect(()=>{if(params.get('document'))void loadSaved()},[params]); // eslint-disable-line react-hooks/exhaustive-deps
  const doc=saved.find(d=>String(d.document_id)===source);
  const lessons:Lesson[]=source==='curated'?curated:(doc?.concepts||[]).map(c=>({...c,id:`doc-${doc!.document_id}-${c.id}`}));
  const fields=Array.from(new Set(lessons.flatMap(c=>c.fields))).sort();
  const visible=lessons.filter(c=>(pattern==='all'||c.pattern===pattern)&&(field==='all'||c.fields.includes(field))&&`${c.title.en} ${c.title.zh} ${c.fields.join(' ')} ${c.question.en} ${c.question.zh}`.toLowerCase().includes(search.toLowerCase()));
  const lesson=visible.find(c=>c.id===selected)||visible[0];
  const solved=lessons.filter(c=>progress[c.id]?.solved).length;
  function update(kind:'explored'|'solved'){if(lesson)setProgress(p=>p[lesson.id]?.[kind]?p:({...p,[lesson.id]:{...p[lesson.id],[kind]:true}}))}
  return <div className="concept-lab">
    <header className="lab-topline"><div><span className="tiny-star">✳</span> {t('A SPACE FOR CURIOUS MINDS','给好奇心一个空间')}</div><Link href="/library">＋ {t('Add course material','添加课程资料')}</Link></header>
    <section className="lab-hero"><div className="hero-copy"><div className="overline">STUDYAI / CONCEPT LAB</div><h1>{t('Different subjects.','不同学科。')}<br/><em>{t('Connected ideas.','相通的想法。')}</em></h1><p>{t('See the invisible. Play with an idea. Discover it somewhere unexpected.','看见隐藏的过程，亲手探索一个想法，在意想不到的学科中再次遇见它。')}</p><div className="hero-meta"><span><i/>{t('Learn by experimenting','在实验中学习')}</span><span>{curated.length} {t('curated concept worlds','个精选概念世界')}</span></div></div><div className="constellation" aria-label={t('Disciplines connected by shared patterns','由共同模式连接的学科')}><svg viewBox="0 0 430 240" aria-hidden="true"><path d="M215 120 L85 52 M215 120 L341 49 M215 120 L360 174 M215 120 L97 195 M215 120 L215 20 M215 120 L215 226"/><circle cx="215" cy="120" r="63"/><circle cx="215" cy="120" r="83"/></svg><div className="constellation-core">✳<small>{t('ONE IDEA','一个想法')}</small></div><span className="planet p1">{t('Cognition','认知科学')}</span><span className="planet p2">{t('Biology','生物学')}</span><span className="planet p3">{t('Economics','经济学')}</span><span className="planet p4">{t('Computing','计算机')}</span><span className="planet p5">{t('Philosophy','哲学')}</span><span className="planet p6">{t('Music & physics','音乐与物理')}</span></div></section>
    <div className="discovery-heading"><div><h2>{t('Follow a connection','沿着连接去探索')}</h2><p>{t('Start with a pattern, not a subject boundary.','从共同模式出发，让理解跨越学科边界。')}</p></div><div className="progress-pill"><span>✦</span> {solved}/{lessons.length} {t('challenges passed','个挑战已通过')}</div></div>
    <div className="lab-filters"><div className="pattern-tabs" aria-label={t('Concept patterns','概念模式')}>{patterns.map(([key,en,zh,icon])=><button key={key} aria-pressed={pattern===key} className={pattern===key?'selected':''} onClick={()=>setPattern(key)}><span>{icon}</span>{t(en,zh)}</button>)}</div><div className="search-row"><label className="search-box"><span>⌕</span><input type="search" value={search} onChange={e=>setSearch(e.target.value)} placeholder={t('Find an idea…','寻找一个想法…')} aria-label={t('Search concepts','搜索概念')}/></label><select aria-label={t('Filter by discipline','按学科筛选')} value={field} onChange={e=>setField(e.target.value)}><option value="all">{t('All disciplines','全部学科')}</option>{fields.map(f=><option key={f}>{f}</option>)}</select><button className="lab-btn" disabled={loading} onClick={loadSaved}>{loading?t('Loading…','加载中…'):t('My generated labs ↗','我的生成实验课 ↗')}</button></div></div>
    {(saved.length>0||source!=='curated')&&<div className="saved-labs"><button className={source==='curated'?'selected':''} onClick={()=>{setSource('curated');setPattern('all');setField('all');setSearch('')}}>{t('Curated collection','精选课程')}</button>{saved.map(d=><button key={d.document_id} className={source===String(d.document_id)?'selected':''} onClick={()=>{setSource(String(d.document_id));setPattern('all');setField('all');setSearch('')}}>{d.document_title}</button>)}</div>}
    {loadError&&<div className="lab-alert" role="alert">{loadError}</div>}
    <div className="collection-toolbar"><span>{visible.length} {t('concepts to explore','个概念可探索')}</span><div className="view-switch" aria-label={t('Collection view','概念浏览方式')}><button aria-pressed={view==='cards'} onClick={()=>setView('cards')}>{t('Cards','卡片')}</button><button aria-pressed={view==='map'} onClick={()=>setView('map')}>{t('Connection map','连接地图')}</button></div></div>
    {view==='map'&&visible.length>0&&<KnowledgeMap lessons={visible} selected={lesson?.id} onSelect={setSelected}/>}
    <div className="concept-strip" hidden={view==='map'}>{visible.map((c,i)=><button key={c.id} aria-pressed={lesson?.id===c.id} className={`concept-card ${lesson?.id===c.id?'selected':''}`} onClick={()=>setSelected(c.id)}><div className="concept-card-top"><span>{symbols[c.pattern]}</span><small>{progress[c.id]?.solved?'✓':String(i+1).padStart(2,'0')}</small></div><h3>{b(c.title)}</h3><div><span>{c.fields.slice(0,2).map(f=>f.replace('computer science','computing').replace('cognitive science','cognition')).join(' ↔ ')}</span><b>↗</b></div></button>)}</div>
    {!visible.length&&<div className="lab-empty">{t('No matching concepts. Try another pattern or search.','没有匹配的概念，请更换模式或搜索词。')}<button className="lab-btn" onClick={()=>{setPattern('all');setSearch('');setField('all')}}>{t('Clear filters','清除筛选')}</button></div>}
    {lesson&&<LessonView key={lesson.id} lesson={lesson} progress={progress} update={update} document={doc}/>}
    {!lessons.length&&!loading&&!loadError&&<div className="lab-empty">{t('No saved lesson for this document. Generate one from its document page.','此资料暂无实验课，请到资料页面生成。')}<Link href="/library">{t('Open library →','打开资料库 →')}</Link></div>}
    <footer className="lab-footer"><span>✳ STUDYAI</span><p>{t('Understanding grows at the edges of what you know.','理解，生长在已知与未知的交界处。')}</p><small>{t('Progress saved on this browser','进度保存在当前浏览器')}</small></footer>
  </div>;
}
