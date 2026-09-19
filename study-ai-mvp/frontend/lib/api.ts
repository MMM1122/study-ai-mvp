export const API = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000";

export type Subject = { id:number; name:string; description?:string|null; icon:string; color:string; created_at:string };
export type Folder = { id:number; subject_id:number; name:string; created_at:string };
export type DocumentItem = { id:number; subject_id:number; folder_id?:number|null; title:string; filename:string; mime_type?:string|null; page_count?:number|null; status:string; created_at:string };
export type Flashcard = { id:number; document_id:number; front:string; back:string; card_type:string; source_page?:number|null; due_at:string; interval_days:number; ease_factor:number; repetitions:number; last_reviewed_at?:string|null };

async function request<T>(path:string, init?:RequestInit): Promise<T> {
  const res = await fetch(`${API}${path}`, { ...init, headers: { ...(init?.body instanceof FormData ? {} : {"Content-Type":"application/json"}), ...(init?.headers || {}) } });
  if (!res.ok) { const detail = await res.json().catch(()=>({detail:res.statusText})); throw new Error(detail.detail || "Request failed"); }
  return res.json();
}

export const api = {
  dashboard: () => request<any>("/dashboard"),
  subjects: () => request<Subject[]>("/subjects"),
  subject: (id:number) => request<any>(`/subjects/${id}`),
  createSubject: (data:any) => request<Subject>("/subjects", {method:"POST", body:JSON.stringify(data)}),
  createFolder: (subjectId:number, name:string) => request<Folder>(`/subjects/${subjectId}/folders`, {method:"POST", body:JSON.stringify({name})}),
  documents: (subjectId:number, folderId?:number|null) => request<DocumentItem[]>(`/subjects/${subjectId}/documents${folderId?`?folder_id=${folderId}`:""}`),
  upload: (subjectId:number, folderId:number|null, file:File) => { const fd=new FormData(); fd.append("subject_id", String(subjectId)); if(folderId) fd.append("folder_id",String(folderId)); fd.append("file",file); return request<DocumentItem>("/documents/upload", {method:"POST", body:fd}); },
  document: (id:number) => request<any>(`/documents/${id}`),
  note: (id:number) => request<any>(`/documents/${id}/note`),
  generate: (id:number) => request<any>(`/documents/${id}/generate`, {method:"POST", body:JSON.stringify({bilingual:true, include_flashcards:true})}),
  flashcards: (id:number) => request<Flashcard[]>(`/documents/${id}/flashcards`),
  due: () => request<Flashcard[]>("/review/due"),
  review: (id:number, rating:string) => request<Flashcard>(`/flashcards/${id}/review`, {method:"POST", body:JSON.stringify({rating})}),
};
