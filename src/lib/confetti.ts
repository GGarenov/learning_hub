import confetti from "canvas-confetti";

export const celebrate = () => {
  confetti({
    particleCount: 120,
    spread: 80,
    origin: { y: 0.6 },
    colors: ["#a78bfa", "#60a5fa", "#34d399", "#fbbf24", "#f472b6"],
  });
  setTimeout(() => {
    confetti({ particleCount: 80, angle: 60, spread: 55, origin: { x: 0 } });
    confetti({ particleCount: 80, angle: 120, spread: 55, origin: { x: 1 } });
  }, 250);
};
