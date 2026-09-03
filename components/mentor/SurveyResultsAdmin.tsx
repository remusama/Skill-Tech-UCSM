"use client";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { API_URL } from "@/lib/config";

export function SurveyResultsAdmin({ examId }: { examId: number }) {
  const [data, setData] = useState<any>(null);
  useEffect(() => {
    const token = localStorage.getItem("eleonor_token");
    fetch(`${API_URL}/api/mentor/exams/${examId}/results`, { headers: { Authorization: `Bearer ${token}` } }).then((r) => r.json()).then(setData);
  }, [examId]);
  if (!data) return <div className="p-6 text-white/60">Cargando resultados...</div>;
  const chartData = Object.entries(data.averages_by_dimension || {}).map(([k, v]) => ({ name: k, value: v as number }));
  return (
    <div className="max-w-5xl mx-auto w-full p-6 space-y-6">
      <h2 className="text-xl font-black text-white">Resultados CEPV-20 — {data.total_responses} respuestas</h2>
      <Card className="p-6 bg-white/[0.04] border-white/10 rounded-2xl">
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <XAxis dataKey="name" tick={{ fill: "#fff", fontSize: 10 }} interval={0} angle={-15} textAnchor="end" height={60} />
              <YAxis domain={[1, 5]} tick={{ fill: "#fff" }} />
              <Tooltip />
              <Bar dataKey="value" fill="#8b5cf6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-white/70">
          {chartData.map((d) => (
            <div key={d.name} className="flex justify-between p-2 rounded-lg bg-black/20"><span>{d.name}</span><b className="text-white">{d.value}/5</b></div>
          ))}
        </div>
      </Card>
      <Card className="p-6 bg-white/[0.04] border-white/10 rounded-2xl">
        <h3 className="text-sm font-black uppercase text-white mb-3">Respuestas cualitativas</h3>
        <div className="space-y-3">
          {(data.qualitative_answers || []).map((q: any, i: number) => (
            <div key={i} className="p-3 rounded-xl bg-black/20">
              <p className="text-xs text-violet-300">{q.question}</p>
              <p className="text-sm text-white/80 mt-1">{q.answer}</p>
            </div>
          ))}
          {(!data.qualitative_answers || data.qualitative_answers.length === 0) && <p className="text-sm text-white/40">Sin respuestas abiertas aún.</p>}
        </div>
      </Card>
    </div>
  );
}
