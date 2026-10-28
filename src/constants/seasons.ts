export type Season = "winter" | "spring" | "summer" | "fall";

export const SeasonThemes = {
  winter: {
    name: "Winter",
    emoji: "❄️",
    background: "#eef4fb",
    card: "#ffffff",
    accent: "#3b6ea5",
    text: "#1c2b3a",
    soft: "#d6e4f3",
  },
  spring: {
    name: "Spring",
    emoji: "🌸",
    background: "#fdf3f6",
    card: "#ffffff",
    accent: "#d9618b",
    text: "#3a1f2b",
    soft: "#f8d9e4",
  },
  summer: {
    name: "Summer",
    emoji: "☀️",
    background: "#fff8e6",
    card: "#ffffff",
    accent: "#e59400",
    text: "#3a2a00",
    soft: "#ffe7a8",
  },
  fall: {
    name: "Fall",
    emoji: "🍂",
    background: "#fbf1e8",
    card: "#ffffff",
    accent: "#c2571a",
    text: "#3a2112",
    soft: "#f3d5bf",
  },
};

// Months are 0-11. Dec-Feb = winter, Mar-May = spring, Jun-Aug = summer, Sep-Nov = fall.
export function getSeason(date: Date = new Date()): Season {
  const m = date.getMonth();
  if (m === 11 || m <= 1) return "winter";
  if (m <= 4) return "spring";
  if (m <= 7) return "summer";
  return "fall";
}
