"use client";
export function LikertScale5({ value, onChange }: { value?: number; onChange: (v: number) => void }) {
  const opts = [1, 2, 3, 4, 5];
  const labels = ["TD", "D", "N", "A", "TA"];
  return (
    <div className="flex gap-1">
      {opts.map((v, i) => (
        <button key={v} type="button" onClick={() => onChange(v)} className={`w-10 h-10 rounded-lg text-xs font-black border ${value === v ? "bg-[#bf00ff] border-[#bf00ff] text-white" : "bg-white/5 border-white/10 text-white/60 hover:bg-white/10"}`}>
          {labels[i]}
        </button>
      ))}
    </div>
  );
}
