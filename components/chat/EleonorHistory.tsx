'use client';

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
import { Button } from "@/components/ui/button";
import { History, User, Bot, Clock, Trash2, X } from "lucide-react";
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
                <Button
                    variant="outline"
                    className={`h-8 px-4 rounded-lg border-white/10 text-[9px] font-black uppercase tracking-widest transition-all ${isHistoryOpen ? 'bg-[#B500D1] text-white shadow-[0_0_15px_rgba(181,0,209,0.4)]' : 'bg-white/5 text-white/40 hover:text-white hover:bg-white/10'}`}
                >
                    <History className={`w-3.5 h-3.5 mr-2 ${isHistoryOpen ? 'text-white' : 'text-[#60d4ea]'}`} />
                    Historial
                </Button>
            </SheetTrigger>
            <SheetContent
                side="right"
                className="w-full sm:max-w-[500px] bg-black/40 border-l border-white/10 backdrop-blur-3xl text-white p-0 shadow-[-20px_0_50px_rgba(0,0,0,0.5)] z-[400]"
            >
                <SheetHeader className="p-6 border-b border-white/5">
                    <SheetTitle className="text-[#60d4ea] flex items-center gap-3 text-xl font-black uppercase tracking-tighter">
                        <div className="p-2 rounded-xl bg-[#60d4ea]/10">
                            <History className="w-5 h-5" />
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
                                    <div className={`w-6 h-6 rounded-full flex items-center justify-center border ${message.role === "assistant" ? "bg-[#B500D1]/20 border-[#B500D1]/30" : "bg-cyan-500/20 border-cyan-500/30"
                                        }`}>
                                        {message.role === "assistant" ? (
                                            <Bot className="w-3.5 h-3.5 text-[#B500D1]" />
                                        ) : (
                                            <User className="w-3.5 h-3.5 text-cyan-400" />
                                        )}
                                    </div>
                                    <span className={`text-[9px] font-black uppercase tracking-[0.2em] ${message.role === "assistant" ? "text-[#B500D1]" : "text-cyan-400"
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
                                        : "bg-cyan-500/5 border border-cyan-500/10 text-cyan-50/70 rounded-tr-none"}
                                    backdrop-blur-md shadow-xl transition-all group-hover:border-white/20
                                `}>
                                    {message.content.replace(/\[emocion:\s*[^\]]+\]/g, '').trim()}
                                </div>
                            </div>
                        ))}
                        {messages.length === 0 && (
                            <div className="flex flex-col items-center justify-center py-20 text-white/10 gap-4">
                                <History className="w-12 h-12 opacity-20" />
                                <p className="text-[10px] font-black uppercase tracking-[0.3em]">Memoria vacía</p>
                            </div>
                        )}
                    </div>
                </ScrollArea>
            </SheetContent>
        </Sheet>
    );
}
