export type Letter =
  | "EIN"
  | "ABS"
  | "NS"
  | "NC"
  | "P"
  | "S"
  | "F"
  | "D-"
  | "D"
  | "D+"
  | "C-"
  | "C"
  | "C+"
  | "B-"
  | "B"
  | "B+"
  | "A-"
  | "A"
  | "A+";

export class Grade {
  static NON_NUMERICAL_GRADES: Letter[] = ["P", "S", "NS"];

  static NUMERICAL_GRADES: Letter[] = [
    "F", "D-", "D", "D+", "C-", "C", "C+", "B-", "B", "B+", "A-", "A", "A+",
  ];

  static GRADE_VALUES: Record<Letter, number> = {
    ABS: NaN, EIN: NaN, NS: NaN, NC: NaN, P: NaN, S: NaN,
    F: 0, "D-": 1, D: 2, "D+": 3, "C-": 4, C: 5, "C+": 6,
    "B-": 7, B: 8, "B+": 9, "A-": 10, A: 11, "A+": 12,
  };

  static BADGE_GRADE_COLOR: Record<string, string> = {
    "A+": "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    A: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    "A-": "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    "B+": "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
    B: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
    "B-": "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
    "C+": "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
    C: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
    "C-": "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
    "D+": "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
    D: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
    "D-": "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
    F: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
    P: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
    S: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-400",
    NS: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
    ABS: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400",
    EIN: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400",
  };

  static BAR_GRADE_COLOR: Record<string, string> = {
    P: "bg-purple-400",
    S: "bg-cyan-400",
    NS: "bg-red-400",
  };

  /** HSL color values for histogram bars */
  static BAR_HSL_COLOR: Record<string, string> = {
    "A+": "hsl(142, 70%, 40%)",
    A:    "hsl(142, 60%, 45%)",
    "A-": "hsl(142, 50%, 50%)",
    "B+": "hsl(80, 55%, 45%)",
    B:    "hsl(60, 60%, 45%)",
    "B-": "hsl(50, 55%, 45%)",
    "C+": "hsl(40, 70%, 48%)",
    C:    "hsl(30, 75%, 48%)",
    "C-": "hsl(25, 70%, 48%)",
    "D+": "hsl(20, 75%, 50%)",
    D:    "hsl(10, 70%, 50%)",
    "D-": "hsl(5, 65%, 48%)",
    F:    "hsl(0, 75%, 42%)",
    P:    "hsl(270, 50%, 55%)",
    S:    "hsl(190, 55%, 50%)",
    NS:   "hsl(0, 60%, 50%)",
    ABS:  "hsl(0, 0%, 50%)",
    EIN:  "hsl(0, 0%, 40%)",
    NC:   "hsl(0, 0%, 45%)",
  };

  static badgeColor(grade: Letter | number) {
    const letterGrade = Grade.letter(grade);
    if (letterGrade in Grade.BADGE_GRADE_COLOR) {
      return Grade.BADGE_GRADE_COLOR[letterGrade];
    }
    throw new Error(`No badge color for '${grade}'.`);
  }

  /** Returns a Tailwind class for non-numerical bar colors */
  static barColor(grade: Letter | number): string {
    const letterGrade = Grade.letter(grade);
    if (letterGrade in Grade.BAR_HSL_COLOR) {
      return Grade.BAR_HSL_COLOR[letterGrade];
    }
    if (letterGrade in Grade.BAR_GRADE_COLOR) {
      return Grade.BAR_GRADE_COLOR[letterGrade];
    }
    return "hsl(0, 0%, 50%)";
  }

  static letter(grade: Letter | number): Letter {
    if (typeof grade === "string") return grade;
    if (0 <= grade && grade <= 12) return Grade.NUMERICAL_GRADES[Math.round(grade)];
    throw new Error(`Grade '${grade}' is invalid.`);
  }

  static value(grade: Letter | number): number {
    if (typeof grade === "string") return Grade.GRADE_VALUES[grade];
    if (0 <= grade && grade <= 12) return Math.round(grade);
    throw new Error(`Grade '${grade}' is invalid.`);
  }
}

/** Column names in DB mapped to Letter grades */
export const DB_GRADE_COLUMNS: Record<string, Letter> = {
  a_plus: "A+", a: "A", a_minus: "A-",
  b_plus: "B+", b: "B", b_minus: "B-",
  c_plus: "C+", c: "C", c_minus: "C-",
  d_plus: "D+", d: "D", d_minus: "D-",
  f: "F",
  ein: "EIN", ns: "NS", nc: "NC", abs: "ABS", p: "P", s: "S",
};
