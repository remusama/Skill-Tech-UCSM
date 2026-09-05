"use client";

import React from "react";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { History, User, Bot } from "lucide-react";
import { useEleonor } from "@/contexts/eleonor-context";

type Message = {
    id: string;
    role: "user" | "assistant";
    content: string;
    timestamp: Date;
};

interface EleonorHistoryProps {
    messages: Message[];
}

export function EleonorHistory({ messages }: EleonorHistoryProps) {
    const { isHistoryOpen, setHistoryOpen } = useEleonor();

    return (
        <Sheet open={isHistoryOpen} onOpenChange={setHistoryOpen}>
            <SheetTrigger asChild>
                {/* Usamos un <button> nativo estilizado con Tailwind para evitar cualquier variante o variable CSS global (como el magenta) */}
                <button
                    type="button"
                    className={`h-8 px-4 rounded-lg border text-[9px] font-black uppercase tracking-widest transition-all flex items-center justify-center cursor-pointer ${
                        isHistoryOpen 
                            ? 'bg-[#0d971f] text-white border-[#0d971f] shadow-[0_0_15px_rgba(13,151,31,0.6)]' 
                            : 'bg-white/5 text-white/50 border-white/10 hover:text-white hover:bg-white/10 hover:border-white/20'
                    }`}
                >
                    <History className={`w-3.5 h-3.5 mr-2 ${isHistoryOpen ? 'text-white' : 'text-[#b8860b]'}`} />
                    Historial
                </button>
            </SheetTrigger>
            <SheetContent
                side="right"
                className="w-full sm:max-w-[500px] bg-black/85 border-l border-[#0d971f]/20 backdrop-blur-3xl text-white p-0 shadow-[-20px_0_50px_rgba(0,0,0,0.5)] z-[400] [&>button]:hidden"
            >
                <SheetHeader className="p-6 border-b border-white/5 relative">
                    <button 
                        onClick={() => setHistoryOpen(false)}
                        className="absolute right-6 top-6 w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/60 hover:text-[#b8860b] hover:bg-[#0d971f]/10 hover:border-[#0d971f]/40 transition-all cursor-pointer"
                    >
                        ✕
                    </button>
                    <SheetTitle className="text-[#b8860b] flex items-center gap-3 text-xl font-black uppercase tracking-tighter">
                        <div className="p-2 rounded-xl bg-[#0d971f]/10 border border-[#0d971f]/20">
                            <History className="w-5 h-5 text-[#0d971f]" />
                        </div>
                        Registro Sináptico
                    </SheetTitle>
                    <SheetDescription className="text-white/40 text-xs font-medium uppercase tracking-widest pl-1">
                        Memoria de interacción con la Unidad Eleonor
                    </SheetDescription>
                </SheetHeader>

                <ScrollArea className="h-[calc(100vh-140px)] p-6 custom-scrollbar">
                    <div className="space-y-8">
                        {messages.map((message) => (
                            <div key={message.id} className="relative group">
                                <div className={`flex items-center gap-3 mb-2 ${message.role === "assistant" ? "flex-row" : "flex-row-reverse text-right"}`}>
                                    <div className={`w-6 h-6 rounded-full flex items-center justify-center border ${message.role === "assistant" ? "bg-[#0d971f]/20 border-[#0d971f]/40" : "bg-[#b8860b]/20 border-[#b8860b]/40"
                                        }`}>
                                        {message.role === "assistant" ? (
                                            <Bot className="w-3.5 h-3.5 text-[#0d971f]" />
                                        ) : (
                                            <User className="w-3.5 h-3.5 text-[#b8860b]" />
                                        )}
                                    </div>
                                    <span className={`text-[9px] font-black uppercase tracking-[0.2em] ${message.role === "assistant" ? "text-[#0d971f]" : "text-[#b8860b]"
                                        }`}>
                                        {message.role === "assistant" ? "Unidad Eleonor" : "Sujeto de Prueba"}
                                    </span>
                                    <span className="text-[8px] text-white/20 font-medium ml-2">
                                        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                                <div className={`
                                    p-4 rounded-2xl text-xs leading-relaxed font-medium tracking-wide
                                    ${message.role === "assistant"
                                        ? "bg-white/[0.03] border border-white/10 text-white/80 rounded-tl-none"
                                        : "bg-[#0d971f]/5 border border-[#0d971f]/20 text-white/90 rounded-tr-none"}
                                    backdrop-blur-md shadow-xl transition-all group-hover:border-white/20
                                `}>
                                    {message.content.replace(/\[emocion:\s*[^\]]+\]/g, '').trim()}
                                </div>
                            </div>
                        ))}
                        {messages.length === 0 && (
                            <div className="flex flex-col items-center justify-center py-20 text-white/10 gap-4">
                                <History className="w-12 h-12 opacity-20 text-[#0d971f]" />
                                <p className="text-[10px] font-black uppercase tracking-[0.3em]">Memoria vacía</p>
                            </div>
                        )}
                    </div>
                </ScrollArea>
            </SheetContent>
        </Sheet>
    );
}