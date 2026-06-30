import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { MONTHS } from "@/lib/curriculum";
import { useAppStore } from "@/lib/store";
import { Shell } from "@/components/Shell";
import { celebrate } from "@/lib/confetti";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, CheckCircle2, RotateCcw } from "lucide-react";
import { CircularProgress } from "@/components/CircularProgress";

export const Route = createFileRoute("/assessment/$monthId")({
  head: () => ({ meta: [{ title: "Assessment" }] }),
  component: AssessmentPage,
  loader: ({ params }) => {
    const m = MONTHS.find((x) => String(x.id) === params.monthId);
    if (!m || !m.assessment) throw notFound();
    return { monthId: m.id };
  },
});

function AssessmentPage() {
  const { monthId } = Route.useLoaderData();
  const month = MONTHS.find((m) => m.id === monthId)!;
  const assessment = month.assessment!;
  const record = useAppStore((s) => s.recordAssessment);

  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [open, setOpen] = useState<Record<string, string>>({});
  const [idx, setIdx] = useState(0);
  const [submitted, setSubmitted] = useState(false);

  const q = assessment.questions[idx];
  const mcqs = assessment.questions.filter((x) => x.type === "mcq");
  const score = useMemo(() => {
    if (!mcqs.length) return 0;
    const correct = mcqs.filter((m) => answers[m.id] === m.answerIndex).length;
    return Math.round((correct / mcqs.length) * 100);
  }, [answers, mcqs]);

  const answeredCount = Object.keys(answers).length + Object.keys(open).length;
  const progressPct = Math.round((answeredCount / assessment.questions.length) * 100);

  if (submitted) {
    const pass = score >= 60;
    const grade = score >= 90 ? "A" : score >= 80 ? "B" : score >= 70 ? "C" : score >= 60 ? "D" : "F";
    return (
      <Shell>
        <div className="max-w-2xl mx-auto glass-strong rounded-3xl p-10 text-center">
          <div className="flex justify-center mb-6">
            <CircularProgress value={score} size={180} />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">{pass ? "You passed!" : "Keep going"}</h1>
          <p className="text-muted-foreground mt-2">Grade {grade} · {mcqs.filter((m) => answers[m.id] === m.answerIndex).length} of {mcqs.length} correct</p>
          <div className="mt-6 flex justify-center gap-3">
            <button
              onClick={() => { setSubmitted(false); setAnswers({}); setOpen({}); setIdx(0); }}
              className="rounded-lg glass px-5 py-2.5 text-sm font-semibold inline-flex items-center gap-2"
            ><RotateCcw className="size-4" /> Retake</button>
            <Link to="/month/$id" params={{ id: String(month.id) }} className="rounded-lg bg-gradient-primary text-primary-foreground px-5 py-2.5 text-sm font-semibold">Back to month</Link>
          </div>
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <header className="mb-6">
        <Link to="/month/$id" params={{ id: String(month.id) }} className="text-xs text-muted-foreground hover:text-foreground">← Back to Month {month.id}</Link>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">{assessment.title}</h1>
        <div className="mt-4 h-2 bg-secondary rounded-full overflow-hidden">
          <div className="h-full bg-gradient-primary transition-all" style={{ width: `${progressPct}%` }} />
        </div>
        <div className="mt-1 text-xs text-muted-foreground">Question {idx + 1} of {assessment.questions.length}</div>
      </header>

      <div className="grid md:grid-cols-[1fr_220px] gap-6">
        <div className="glass-strong rounded-2xl p-6">
          <div className="text-xs uppercase tracking-wider text-primary font-semibold">{q.category}</div>
          <h2 className="mt-2 text-xl font-semibold">{q.question}</h2>

          {q.type === "mcq" ? (
            <div className="mt-6 space-y-2">
              {q.options!.map((opt, i) => {
                const selected = answers[q.id] === i;
                return (
                  <button
                    key={i}
                    onClick={() => setAnswers((a) => ({ ...a, [q.id]: i }))}
                    className={cn(
                      "w-full text-left px-4 py-3 rounded-lg border-2 transition-all text-sm",
                      selected ? "border-primary bg-primary/10" : "border-border hover:border-primary/50"
                    )}
                  >
                    <span className="inline-block size-5 rounded-md bg-secondary text-center mr-3 text-[11px] leading-5 font-semibold">{String.fromCharCode(65 + i)}</span>
                    {opt}
                  </button>
                );
              })}
            </div>
          ) : (
            <textarea
              value={open[q.id] ?? ""}
              onChange={(e) => setOpen((o) => ({ ...o, [q.id]: e.target.value }))}
              placeholder="Write your answer…"
              className="mt-6 w-full bg-secondary/40 rounded-lg p-4 text-sm outline-none border border-border min-h-[160px]"
            />
          )}

          <div className="mt-6 flex items-center justify-between">
            <button
              onClick={() => setIdx((i) => Math.max(0, i - 1))}
              disabled={idx === 0}
              className="inline-flex items-center gap-2 rounded-lg glass px-4 py-2 text-sm font-semibold disabled:opacity-40"
            ><ChevronLeft className="size-4" /> Previous</button>
            {idx < assessment.questions.length - 1 ? (
              <button
                onClick={() => setIdx((i) => i + 1)}
                className="inline-flex items-center gap-2 rounded-lg bg-gradient-primary text-primary-foreground px-4 py-2 text-sm font-semibold"
              >Next <ChevronRight className="size-4" /></button>
            ) : (
              <button
                onClick={() => { record(assessment.id, score); if (score >= 60) celebrate(); setSubmitted(true); }}
                className="inline-flex items-center gap-2 rounded-lg bg-gradient-success text-primary-foreground px-4 py-2 text-sm font-semibold"
              ><CheckCircle2 className="size-4" /> Submit</button>
            )}
          </div>
        </div>

        <aside className="glass rounded-2xl p-4">
          <div className="text-xs font-semibold uppercase text-muted-foreground mb-3">Questions</div>
          <div className="grid grid-cols-6 md:grid-cols-5 gap-1.5">
            {assessment.questions.map((qq, i) => {
              const answered = answers[qq.id] !== undefined || open[qq.id];
              return (
                <button
                  key={qq.id}
                  onClick={() => setIdx(i)}
                  className={cn(
                    "size-7 text-[11px] rounded-md font-semibold transition",
                    i === idx ? "bg-gradient-primary text-primary-foreground" : answered ? "bg-success/30 text-success" : "bg-secondary text-muted-foreground hover:bg-accent"
                  )}
                >{i + 1}</button>
              );
            })}
          </div>
        </aside>
      </div>
    </Shell>
  );
}
