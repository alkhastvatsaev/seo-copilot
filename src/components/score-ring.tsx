import { cn } from "@/lib/utils";

type ScoreRingProps = {
  score: number;
  className?: string;
  size?: number;
};

export function ScoreRing({ score, className, size = 140 }: ScoreRingProps) {
  const clamped = Math.max(0, Math.min(100, score));
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clamped / 100) * circumference;

  return (
    <div
      className={cn("relative inline-flex items-center justify-center", className)}
      style={{ width: size, height: size }}
      role="img"
      aria-label={`Score ${clamped} sur 100`}
    >
      <svg
        viewBox="0 0 100 100"
        className="h-full w-full -rotate-90"
        aria-hidden
      >
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="8"
          className="text-muted"
        />
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="animate-score-ring text-[color:var(--ring)]"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center" aria-hidden>
        <span className="font-[family-name:var(--font-display)] text-4xl font-bold leading-none">
          {clamped}
        </span>
        <span className="mt-1 text-xs text-muted-foreground">/ 100</span>
      </div>
    </div>
  );
}
