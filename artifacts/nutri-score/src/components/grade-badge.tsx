import React from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

interface GradeBadgeProps {
  grade: "A" | "B" | "C" | "D" | "E";
  className?: string;
}

const GRADES = [
  { letter: "A", color: "#1E7E34" },
  { letter: "B", color: "#80C41C" },
  { letter: "C", color: "#F5C518" },
  { letter: "D", color: "#E87722" },
  { letter: "E", color: "#D32F2F" },
] as const;

export function GradeBadge({ grade, className }: GradeBadgeProps) {
  return (
    <div className={cn("flex items-center rounded-2xl overflow-hidden bg-white dark:bg-card p-1 shadow-md border border-border", className)}>
      {GRADES.map((g, idx) => {
        const isActive = g.letter === grade;
        return (
          <div
            key={g.letter}
            className={cn(
              "flex items-center justify-center font-display transition-all duration-300 ease-out",
              isActive ? "w-16 h-16 sm:w-20 sm:h-20 text-3xl sm:text-4xl shadow-lg z-10 scale-105" : "w-10 h-12 sm:w-12 sm:h-14 text-lg opacity-80",
              idx === 0 ? "rounded-l-xl" : "",
              idx === GRADES.length - 1 ? "rounded-r-xl" : ""
            )}
            style={{ 
              backgroundColor: g.color,
              color: g.letter === "C" && isActive ? "#212121" : "white",
              fontWeight: isActive ? 900 : 700
            }}
          >
            {g.letter}
          </div>
        );
      })}
    </div>
  );
}
