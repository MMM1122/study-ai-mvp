"use client";
import type {Lesson} from '@/lib/lab/types';
import {useI18n} from '@/components/I18n';

const patternOrder = ['representation','systems','feedback','constraints','levels'];
const patternNames:Record<string,[string,string]> = {
 representation:['Representation','表征'],systems:['Systems & change','系统与变化'],
 feedback:['Feedback','反馈'],constraints:['Constraints','约束'],levels:['Levels & parts','层次与部分'],
};
export default function KnowledgeMap({lessons,selected,onSelect}:{lessons:Lesson[];selected:string|undefined;onSelect:(id:string)=>void}){
 const {lang}=useI18n();const t=(en:string,zh:string)=>lang==='zh'?zh:en;
 const groups=patternOrder.filter(pattern=>lessons.some(lesson=>lesson.pattern===pattern));
 const width=Math.max(580,groups.length*178);
 const height=115+Math.max(1,...groups.map(pattern=>lessons.filter(l=>l.pattern===pattern).length))*96;
 const nodes=groups.flatMap((pattern,column)=>lessons.filter(l=>l.pattern===pattern).map((lesson,row)=>({lesson,x:(column+.5)*width/groups.length,y:145+row*96})));
 return <section className="knowledge-map" aria-label={t('Interactive concept map','互动概念地图')}>
   <div className="map-description"><b>{t('Follow the structure, cross a boundary.','沿着共同结构，跨过学科边界。')}</b><p>{t('Each line groups lessons under a shared thinking pattern. Select a concept to explore its cross-disciplinary lenses and limits.','连线按共同思维模式组织课程。选择概念，探索它的跨学科视角与边界。')}</p></div>
   <div className="map-scroll" tabIndex={0} aria-label={t('Scroll concept map','滚动查看概念地图')}><div className="map-canvas" style={{width,height}}>
     <svg viewBox={`0 0 ${width} ${height}`} width={width} height={height} aria-hidden="true">{nodes.map(({lesson,x,y})=><path key={lesson.id} d={`M ${x} 75 L ${x} ${y}`} className={lesson.id===selected?'map-edge active':'map-edge'}/>)}</svg>
     {groups.map((pattern,column)=><div key={pattern} className="map-pattern" style={{left:(column+.5)*width/groups.length,top:37}}>{patternNames[pattern][lang==='zh'?1:0]}</div>)}
     {nodes.map(({lesson,x,y})=><button key={lesson.id} className={`map-node ${lesson.id===selected?'selected':''}`} style={{left:x,top:y}} aria-pressed={lesson.id===selected} onClick={()=>onSelect(lesson.id)}><strong>{lesson.title[lang]}</strong><small>{lesson.fields.slice(0,2).join(' · ')}</small><span aria-hidden="true">↗</span></button>)}
   </div></div><p className="map-caption">{t('Connections organize learning; they do not assert that two disciplines are equivalent.','连接用于组织学习，不意味着两个学科等同。')}</p>
 </section>
}
