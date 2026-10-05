"use client";
import { useEffect, useState } from 'react';
import type { Lesson, Bi } from '@/lib/lab/types';
import { useI18n } from '@/components/I18n';

type Props = { lesson: Lesson; onExplore: () => void };
const values = [12, 48, 7, 31, 95, 16, 62, 24];
export function memoryAddress(index: number) { return 4096 + index * 4; }
export function feedbackValues(gain: number) { let x = 20; return Array.from({length: 13}, (_, i) => { if (i) x += gain * (60-x); return x; }); }

export default function Simulator({lesson,onExplore}: Props) {
  const {lang} = useI18n(); const t = (en:string,zh:string) => lang === 'zh' ? zh : en;
  const b = (v:Bi) => v[lang];
  const [step,setStep] = useState(0), [playing,setPlaying] = useState(false);
  const [index,setIndex] = useState(2), [gain,setGain] = useState(.5), [freq,setFreq] = useState(2);
  const [frame,setFrame] = useState(0), [dots,setDots] = useState(false);
  const [head,setHead] = useState(0), [tape,setTape] = useState([1,0,1,0]);
  const [hidden,setHidden] = useState(false);
  useEffect(() => {
    if (!playing) return;
    const timer = setInterval(() => setStep(s => { if (s >= lesson.steps.length-1) { setPlaying(false); return s; } return s+1; }), 1600);
    return () => clearInterval(timer);
  }, [playing,lesson.steps.length]);
  function advance() { setStep(s => Math.min(s+1,lesson.steps.length-1)); onExplore(); }
  const control = (content:React.ReactNode) => <div className="lab-controls">{content}</div>;
  if (lesson.simulation === 'memory') return <>
    <div className="simulation memory-sim"><div className="sim-top"><span>{t('MEMORY INSPECTOR','内存查看器')}</span><code>a = b[{index}]</code></div>
      <div className="address-flow"><span>base <b>0x1000</b></span><span>+</span><span>i × 4 <b>{index*4} bytes</b></span><span>=</span><span className="address-result"><b>0x{memoryAddress(index).toString(16).toUpperCase()}</b></span></div>
      <div className="memory-bank">{values.map((value,i)=><button key={i} onClick={()=>{setIndex(i);onExplore()}} className={index===i?'memory-cell selected':'memory-cell'} aria-pressed={index===i} aria-label={`b[${i}] = ${value}`}><small>b[{i}]</small><strong>{value}</strong><code>{memoryAddress(i).toString(16).toUpperCase()}</code></button>)}</div>
      <div className="memory-result" aria-live="polite">{t('Selected value','选中的值')} <strong>{values[index]}</strong><span>{t('8 elements · 4 bytes each · contiguous layout','8 个元素 · 每个 4 字节 · 连续布局')}</span></div>
    </div>{control(<><label htmlFor="array-index">{t('Change only the index','只改变下标')} <b>{index}</b></label><input id="array-index" type="range" min="0" max="7" value={index} onChange={e=>{setIndex(+e.target.value);onExplore()}}/><button className="lab-btn" onClick={()=>setHidden(!hidden)} aria-expanded={hidden}>{t('Show hidden steps','显示隐藏步骤')} {hidden?'−':'+'}</button></>)}{hidden&&<ol className="hidden-steps">{[t('Load the base address: 4096','载入基址：4096'),`${index} × 4 = ${index*4}`,`4096 + ${index*4} = ${memoryAddress(index)}`,`${t('Read','读取')} b[${index}] → ${values[index]}`].map(s=><li key={s}>{s}</li>)}</ol>}</>;
  if (lesson.simulation === 'perception') return <>
    <div className={`simulation pond frame-${frame} ${dots?'moving':''}`}><div className="sim-top"><span>{t('SAME STIMULUS · DIFFERENT LENS','相同刺激 · 不同视角')}</span><span>{t('Illustrative exercise','示意练习')}</span></div><div className="pond-lines"/>{[0,1,2,3,4,5].map(i=><span key={i} className={`pond-dot dot-${i}`}/>)}<div className="pond-caption">{[t('What do you see?','你看到了什么？'),t('Imagine a playful gathering.','想象一场嬉戏。'),t('Imagine an uneasy encounter.','想象一次不安的相遇。')][frame]}</div></div>
    {control(<><button className="lab-btn dark" onClick={()=>{setDots(!dots);onExplore()}}>{dots?t('Ⅱ Pause motion','Ⅱ 暂停运动'):t('▶ Play motion','▶ 播放运动')}</button><div className="lens-buttons">{[t('Neutral','中性'),t('Playful','嬉戏'),t('Uneasy','不安')].map((x,i)=><button key={x} aria-pressed={frame===i} className={frame===i?'selected':''} onClick={()=>{setFrame(i);onExplore()}}>{x}</button>)}</div></>)}<p className="sim-note">{t('Only the caption changes. Paths, speed and dots stay identical. Notice your judgment; this does not measure a change in perception.','只有文字语境改变。轨迹、速度与圆点均相同。观察你的判断；这不能测量知觉是否改变。')}</p></>;
  if (lesson.simulation === 'feedback' || lesson.simulation === 'waves') {
    const feedback = lesson.simulation === 'feedback';
    const ys = feedback ? feedbackValues(gain) : Array.from({length:241},(_,i)=>Math.sin(2*Math.PI*freq*i/240));
    const points = ys.map((y,i)=>`${40+i/(ys.length-1)*520},${feedback?220-y*2.5:140-y*60}`).join(' ');
    return <><div className="simulation chart-sim"><div className="sim-top"><span>{feedback?t('FEEDBACK EXPLORER','反馈探索器'):t('OSCILLATION EXPLORER','振荡探索器')}</span><span>{t('Toy mathematical model','简化数学模型')}</span></div>
      <svg viewBox="0 0 600 270" role="img" aria-label={feedback?t('State approaches target over discrete steps','状态逐步趋近目标'):t('Sine wave over one second','一秒内的正弦波')}><line x1="40" y1="230" x2="560" y2="230" className="chart-axis"/><line x1="40" y1="30" x2="40" y2="230" className="chart-axis"/>{[70,140,210].map(y=><line key={y} x1="40" x2="560" y1={y} y2={y} className="chart-grid"/>)}{feedback&&<><line x1="40" x2="560" y1="70" y2="70" className="target-line"/><text x="440" y="59">{t('target = 60','目标 = 60')}</text></>}<polyline points={points} fill="none" className="signal"/>{feedback&&ys.map((y,i)=><circle key={i} cx={40+i/12*520} cy={220-y*2.5} r="4" fill="#216958"/>)}<text x="40" y="252">0</text><text x="480" y="252">{feedback?t('12 steps','12 步'):t('1 second','1 秒')}</text></svg>
      <div className="formula">{feedback?`xₙ₊₁ = xₙ + ${gain.toFixed(2)} × (60 − xₙ)`:`y = sin(2π × ${freq.toFixed(1)} × t) · T = ${(1/freq).toFixed(2)} s`}</div></div>
      {control(<><label htmlFor="experiment-variable">{feedback?t('Response gain','响应增益'):t('Frequency (Hz)','频率 (Hz)')} <b>{feedback?gain.toFixed(2):freq.toFixed(1)}</b></label><input id="experiment-variable" type="range" min={feedback?.1:.5} max={feedback?1.9:6} step={feedback?.05:.5} value={feedback?gain:freq} onChange={e=>{feedback?setGain(+e.target.value):setFreq(+e.target.value);onExplore()}}/><button className="lab-btn" onClick={()=>{setGain(.5);setFreq(2)}}>{t('Reset','重置')}</button></>)}<p className="sim-note" aria-live="polite">{feedback?(gain>1?t('Overshoot: the controller crosses the target before settling. Initial value = 20; target = 60; no delay.','过冲：控制器先越过目标再回稳。初值 = 20；目标 = 60；无延迟。'):t('The controller approaches the target without overshoot. Initial value = 20; target = 60; no delay.','控制器趋近目标而无过冲。初值 = 20；目标 = 60；无延迟。')):t('Amplitude stays at 1. Frequency changes how many cycles fit into one second. This is a time plot, not audio.','振幅保持为 1。频率改变一秒内容纳的循环数。这是时间图，不是音频。')}</p></>;
  }
  if (lesson.simulation === 'state') return <><div className="simulation tape-sim"><div className="sim-top"><span>{t('BINARY FLIP MACHINE','二进制翻转机')}</span><code>{head>=4?'HALT':'SCAN'}</code></div><div className="tape">{[...tape,null].map((bit,i)=><div key={i} className={head===i?'tape-cell active':'tape-cell'}><span>{head===i?'▼':' '}</span><b>{bit===null?'□':bit}</b><small>{i}</small></div>)}</div><p>{t('Rule: flip the bit → move right. Blank → halt.','规则：翻转比特 → 向右移动。空白 → 停机。')}</p></div>{control(<><button className="lab-btn dark" disabled={head>=4} onClick={()=>{setTape(tape.map((v,i)=>i===head?1-v:v));setHead(head+1);onExplore()}}>{head>=4?t('Halted','已停机'):t('Apply one transition →','执行一次转移 →')}</button><button className="lab-btn" onClick={()=>{setTape([1,0,1,0]);setHead(0)}}>{t('Reset tape','重置纸带')}</button><span aria-live="polite">{head}/4 {t('symbols processed','符号已处理')}</span></>)}</>;
  const layers = lesson.simulation === 'layers';
  return <><div className={`simulation pipeline-sim ${layers?'layers-sim':''}`}><div className="sim-top"><span>{layers?t('EXPLANATION EXPLORER','解释探索器'):t('HIDDEN STEPS','隐藏步骤')}</span><span>{step+1} / {lesson.steps.length}</span></div><div className="pipeline-nodes">{lesson.steps.map((s,i)=><button key={i} className={`pipeline-node ${step===i?'active':''} ${step>i?'done':''}`} aria-pressed={step===i} onClick={()=>{setStep(i);setPlaying(false);onExplore()}}><span className="node-number">{String(i+1).padStart(2,'0')}</span><strong>{b(s.title)}</strong>{!layers&&i<lesson.steps.length-1&&<span className="node-arrow">→</span>}</button>)}</div><div className="step-explanation" aria-live="polite"><span>{layers?t('EXPLANATORY LENS','解释视角'):t('WHAT HAPPENS HERE','这一步发生什么')}</span><h3>{b(lesson.steps[step].title)}</h3><p>{b(lesson.steps[step].detail)}</p></div></div>{control(<>{!layers&&<button className="lab-btn dark" onClick={()=>{if(step===lesson.steps.length-1)setStep(0);setPlaying(!playing);onExplore()}}>{playing?t('Ⅱ Pause','Ⅱ 暂停'):t('▶ Play walkthrough','▶ 播放过程')}</button>}<button className="lab-btn" disabled={step===lesson.steps.length-1} onClick={advance}>{layers?t('Next lens →','下个视角 →'):t('Next step →','下一步 →')}</button><button className="lab-btn" onClick={()=>{setStep(0);setPlaying(false)}}>{t('Reset','重置')}</button></>)}<p className="sim-note">{layers?t('These are perspectives on a system, not a sequence of processing stages.','这些是看待系统的视角，不是顺序处理阶段。'):t('An illustrative walkthrough. Select any step to inspect the mechanism.','示意过程。选择任意一步，查看其中的机制。')}</p></>;
}
