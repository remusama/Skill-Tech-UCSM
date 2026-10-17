"use client"

import React from "react"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { ScrollArea } from "@/components/ui/scroll-area"
import { History, User, Bot, Sparkles, X } from "lucide-react"
import { useEleonor } from "@/contexts/eleonor-context"

type Message = {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
}

interface EleonorHistoryProps {
  messages: Message[]
}

export function EleonorHistory({ messages }: EleonorHistoryProps) {
  const { isHistoryOpen, setHistoryOpen } = useEleonor()

  return (
    <Sheet open={isHistoryOpen} onOpenChange={setHistoryOpen}>
      <SheetTrigger asChild>
        <button
          type="button"
          className={`h-8 px-3 rounded-xl border text-[11px] font-semibold transition-all flex items-center justify-center cursor-pointer ${
            isHistoryOpen
              ? "bg-[hsl(74,100%,47%)] text-slate-950 border-[hsl(74,100%,47%)] shadow-[0_0_15px_rgba(186,239,0,0.4)] font-bold"
              : "bg-[hsl(161,40%,15%)]/70 text-white/80 border-[hsl(153,30%,75%)]/20 hover:text-[hsl(74,100%,47%)] hover:border-[hsl(74,100%,47%)]/40 hover:bg-[hsl(74,100%,47%)]/10"
          }`}
        >
          <History className={`w-3.5 h-3.5 mr-1.5 ${isHistoryOpen ? "text-slate-950" : "text-[hsl(74,100%,47%)]"}`} />
          <span>Historial</span>
          {messages.length > 0 && (
            <span className={`ml-1.5 px-1.5 py-0.2 rounded-full text-[9px] font-mono font-bold ${
              isHistoryOpen ? "bg-slate-950/20 text-slate-950" : "bg-[hsl(74,100%,47%)]/20 text-[hsl(74,100%,47%)]"
            }`}>
              {messages.length}
            </span>
          )}
        </button>
      </SheetTrigger>
      <SheetContent
        side="right"
        className="w-full sm:max-w-[480px] bg-[hsl(161,67%,9%)]/95 border-l border-[hsl(74,100%,47%)]/25 backdrop-blur-3xl text-white p-0 shadow-[-20px_0_50px_rgba(0,0,0,0.7)] z-[400] [&>button]:hidden"
      >
        <SheetHeader className="p-6 border-b border-[hsl(153,30%,75%)]/15 relative">
          <button
            onClick={() => setHistoryOpen(false)}
            className="absolute right-6 top-6 w-8 h-8 rounded-xl bg-[hsl(161,40%,15%)]/70 border border-[hsl(153,30%,75%)]/20 flex items-center justify-center text-white/60 hover:text-[hsl(74,100%,47%)] hover:border-[hsl(74,100%,47%)]/40 transition-all cursor-pointer"
          >
            <X size={16} />
          </button>
          <SheetTitle className="text-white flex items-center gap-3 text-lg font-bold tracking-tight">
            <div className="p-2 rounded-xl bg-[hsl(74,100%,47%)]/15 border border-[hsl(74,100%,47%)]/30">
              <History className="w-4 h-4 text-[hsl(74,100%,47%)]" />
            </div>
            <span>Historial de Conversación</span>
          </SheetTitle>
          <SheetDescription className="text-white/40 text-xs font-normal pl-1">
            Registro de la sesión actual con Tororo
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-140px)] p-6 custom-scrollbar">
          <div className="space-y-6">
            {messages.map((message) => (
              <div key={message.id} className="relative group">
                <div
                  className={`flex items-center gap-2 mb-2 ${
                    message.role === "assistant" ? "flex-row" : "flex-row-reverse text-right"
                  }`}
                >
                  <div
                    className={`w-6 h-6 rounded-lg flex items-center justify-center border text-[10px] font-bold ${
                      message.role === "assistant"
                        ? "bg-[hsl(161,40%,15%)] border-[hsl(74,100%,47%)]/30 text-[hsl(74,100%,47%)]"
                        : "bg-[hsl(74,100%,47%)] border-[hsl(74,100%,47%)] text-slate-950 font-black"
                    }`}
                  >
                    {message.role === "assistant" ? <Bot size={13} /> : <User size={13} />}
                  </div>
                  <span className="text-xs font-semibold text-white/80">
                    {message.role === "assistant" ? "Tororo" : "Tú"}
                  </span>
                  <span className="text-[10px] text-white/30 ml-2">
                    {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
                <div
                  className={`
                    p-3.5 rounded-2xl text-xs leading-relaxed font-normal tracking-wide shadow-md transition-all
                    ${
                      message.role === "assistant"
                        ? "bg-[hsl(161,40%,15%)]/70 border border-[hsl(153,30%,75%)]/20 text-white/90 rounded-tl-none"
                        : "bg-gradient-to-r from-[hsl(74,100%,47%)] to-[hsl(84,90%,42%)] text-slate-950 font-medium border border-[hsl(74,100%,47%)]/40 rounded-tr-none"
                    }
                  `}
                >
                  {message.content.replace(/\[emocion:\s*[^\]]+\]/g, "").trim()}
                </div>
              </div>
            ))}
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 text-white/20 gap-3">
                <History className="w-10 h-10 opacity-30 text-[hsl(74,100%,47%)]" />
                <p className="text-xs font-semibold uppercase tracking-widest text-white/40">
                  Sin mensajes aún
                </p>
              </div>
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}