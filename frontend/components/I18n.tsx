"use client";
import { createContext, useContext, useEffect, useState } from "react";

type UILang = "en" | "zh";
type Ctx = { lang: UILang; setLang: (v: UILang) => void; t: (en: string) => string };

const zh: Record<string,string> = {
  "Dashboard":"主页", "Review":"复习", "Study loop":"学习闭环", "Upload → Understand → Recall → Review":"上传 → 理解 → 回忆 → 复习",
  "AI STUDY WORKSPACE":"AI 学习工作台", "Good morning 👋":"你好 👋", "Turn your course files into notes you can actually review.":"把课程资料变成真正适合复习的学习笔记。",
  "Start review →":"开始复习 →", "Subjects":"科目", "Documents":"资料", "Flashcards":"闪卡", "Due today":"今日待复习",
  "Your subjects":"你的科目", "Organize by course, then add folders for lectures, labs or papers.":"按课程分类，再为讲义、实验或论文建立文件夹。",
  "New subject, e.g. CPSC 213":"新建科目，例如 CPSC 213", "Create":"创建", "Adding…":"创建中…", "Open subject workspace":"打开科目空间",
  "Recent documents":"最近资料", "Continue where you left off.":"继续上次的学习。", "Upload your first lecture to start building your study system.":"上传第一份讲义，开始建立你的学习系统。",
  "Subject":"科目", "Course workspace":"课程学习空间", "Folders":"文件夹", "All files":"全部资料", "New folder":"新文件夹", "Materials":"学习资料",
  "PDF, DOCX, PPTX, TXT or Markdown":"支持 PDF、DOCX、PPTX、TXT 或 Markdown", "Drop in course material":"上传课程资料", "Upload lecture slides, readings or notes.":"上传课件、阅读材料或笔记。",
  "Upload":"上传", "Processing…":"处理中…", "No files in this view yet.":"这里还没有资料。", "Uploading and extracting…":"正在上传并解析…", "Uploaded. Opening document…":"上传完成，正在打开资料…",
  "Back":"返回", "Generate AI notes":"生成 AI 笔记", "Regenerate notes":"重新生成笔记", "AI is organizing…":"AI 正在整理…", "Ready to turn this file into study notes":"已准备好把资料转成学习笔记",
  "StudyAI will create a bilingual summary, key points, 5 Why explanations, Cornell notes, examples, common mistakes and flashcards.":"StudyAI 会生成中英双语 Summary、重点、5 Why、康奈尔笔记、例子、常见错误和 Flashcards。",
  "Generate study notes":"生成学习笔记", "Generating…":"生成中…", "Go one layer deeper":"再深入一层", "Summary":"总结", "Review now →":"现在复习 →",
  "cards ready":"张闪卡已生成", "Generated from this document and added to your review queue.":"已根据这份资料生成，并加入复习队列。",
  "SPACED REVIEW":"间隔复习", "Review queue":"复习队列", "Practice active recall instead of rereading.":"用主动回忆代替反复重读。", "Nothing due right now":"目前没有待复习内容",
  "Generate notes from a document and its flashcards will appear here.":"生成资料笔记后，对应 Flashcards 会出现在这里。", "Session complete":"本次复习完成", "Back to dashboard":"返回主页",
  "Click to reveal answer":"点击显示答案", "Again":"不会", "Hard":"较难", "Good":"会了", "Easy":"很熟", "normal":"正常间隔", "short interval":"短间隔", "long interval":"长间隔"
};

const I18nContext=createContext<Ctx>({lang:"en",setLang:()=>{},t:(x)=>x});
export function I18nProvider({children}:{children:React.ReactNode}){
  const [lang,setLangState]=useState<UILang>("en");
  useEffect(()=>{const saved=localStorage.getItem("studyai-ui-lang") as UILang|null;if(saved==="zh"||saved==="en")setLangState(saved)},[]);
  function setLang(v:UILang){setLangState(v);localStorage.setItem("studyai-ui-lang",v)}
  return <I18nContext.Provider value={{lang,setLang,t:(en)=>lang==="zh"?(zh[en]||en):en}}>{children}</I18nContext.Provider>
}
export function useI18n(){return useContext(I18nContext)}
