import { useState } from "react";
import { X, ExternalLink } from "lucide-react";
import { useAppStore, KYU_VALUES, type Kyu } from "@/lib/store";
import { celebrate } from "@/lib/confetti";
import { toast } from "sonner";
import { isoWeekKey, katasThisWeek } from "@/lib/store";
import { cn } from "@/lib/utils";

const LANGUAGES = ["javascript", "typescript", "python", "java", "c++", "c#", "ruby", "go", "rust", "other"];

interface Props {
  open: boolean;
  onClose: () => void;
}

export function CodewarsLogDialog({ open, onClose }: Props) {
  const logKata = useAppStore((s) => s.logKata);
  const entries = useAppStore((s) => s.codewars.entries);
  const weeklyTarget = useAppStore((s) => s.codewars.weeklyTarget);

  const [title, setTitle] = useState("");
  const [kyu, setKyu] = useState<Kyu>(8);
  const [language, setLanguage] = useState("javascript");
  const [url, setUrl] = useState("");
  const [note, setNote] = useState("");

  if (!open) return null;

  const currentWeek = isoWeekKey(new Date().toISOString());
  const countBefore = katasThisWeek(entries, currentWeek);

  const submit = () => {
    if (!title.trim()) {
      toast.error("Kata name is required");
      return;
    }
    logKata({ title: title.trim(), kyu, language, url: url.trim() || undefined, note: note.trim() || undefined });

    const countAfter = countBefore + 1;
    if (countAfter >= weeklyTarget) {
      setTimeout(celebrate, 150);
      toast.success(`${countAfter}/${weeklyTarget} this week — target hit! 🎉`);
    } else {
      toast.success(`Kata logged — ${countAfter}/${weeklyTarget} this week`);
    }

    setTitle(""); setKyu(8); setLanguage("javascript"); setUrl(""); setNote("");
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative glass-strong rounded-2xl w-full max-w-md p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <div>
            <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Log kata</div>
            <h2 className="text-xl font-bold mt-0.5">Completed a kata?</h2>
          </div>
          <button onClick={onClose} className="size-8 rounded-lg hover:bg-accent flex items-center justify-center">
            <X className="size-4" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Kata name *</label>
            <input
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submit()}
              placeholder='e.g. "Opposite number"'
              className="mt-1.5 w-full rounded-lg bg-secondary/60 px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground/60"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Rank</label>
              <select
                value={kyu}
                onChange={(e) => setKyu(Number(e.target.value) as Kyu)}
                className="mt-1.5 w-full rounded-lg bg-secondary/60 px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary"
              >
                {KYU_VALUES.map((k) => (
                  <option key={k} value={k}>{k} kyu</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Language</label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="mt-1.5 w-full rounded-lg bg-secondary/60 px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary"
              >
                {LANGUAGES.map((l) => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Codewars URL <span className="normal-case text-muted-foreground/60">(optional)</span>
            </label>
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://www.codewars.com/kata/..."
              className="mt-1.5 w-full rounded-lg bg-secondary/60 px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground/60"
            />
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Note <span className="normal-case text-muted-foreground/60">(optional)</span>
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder='e.g. "Used reduce, tricky edge case on empty array"'
              rows={2}
              className="mt-1.5 w-full rounded-lg bg-secondary/60 px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground/60 resize-none"
            />
          </div>
        </div>

        <div className="mt-5 flex gap-2">
          <button
            onClick={submit}
            className="flex-1 rounded-lg bg-gradient-primary text-primary-foreground px-4 py-2.5 text-sm font-semibold hover-lift"
          >
            Log kata
          </button>
          <a
            href={`https://www.codewars.com/kata/search/javascript?q=${encodeURIComponent(kyu + "+kyu")}&r[]=-${kyu}`}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              "rounded-lg glass px-3 py-2.5 text-sm font-semibold flex items-center gap-1.5 hover-lift text-muted-foreground"
            )}
          >
            <ExternalLink className="size-3.5" /> Browse
          </a>
        </div>

        <div className="mt-3 text-center text-[11px] text-muted-foreground">
          This week: {countBefore} / {weeklyTarget}
        </div>
      </div>
    </div>
  );
}
