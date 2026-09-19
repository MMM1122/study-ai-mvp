import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import { I18nProvider } from "@/components/I18n";

export const metadata: Metadata = { title: "StudyAI", description: "AI study workspace" };
export default function RootLayout({children}:{children:React.ReactNode}){
  return <html lang="en"><body><I18nProvider><div className="shell"><Sidebar/><main className="main">{children}</main></div></I18nProvider></body></html>
}
