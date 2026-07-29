import type { IssueEffort, IssuePriority } from "@/lib/audits/issue-schema";

/** French labels — reduce cognitive load vs English jargon. */
export function effortLabel(effort: IssueEffort): string {
  switch (effort) {
    case "low":
      return "simple";
    case "medium":
      return "modéré";
    case "high":
      return "conséquent";
    default: {
      const _exhaustive: never = effort;
      return _exhaustive;
    }
  }
}

export function difficultyLabel(difficulty: IssueEffort): string {
  switch (difficulty) {
    case "low":
      return "facile";
    case "medium":
      return "moyen";
    case "high":
      return "technique";
    default: {
      const _exhaustive: never = difficulty;
      return _exhaustive;
    }
  }
}

export function priorityLabel(priority: IssuePriority): string {
  switch (priority) {
    case "critical":
      return "À traiter d’abord";
    case "high":
      return "Important";
    case "medium":
      return "Utile";
    case "low":
      return "Bonus";
    default: {
      const _exhaustive: never = priority;
      return _exhaustive;
    }
  }
}
