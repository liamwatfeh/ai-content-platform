"use client";

import { useEffect, useState } from "react";

export default function DarkModeToggle() {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const stored = localStorage.getItem("theme");
    if (stored === "light" || stored === "dark") {
      setTheme(stored);
      document.documentElement.dataset.theme = stored;
    } else {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      const initial = prefersDark ? "dark" : "light";
      setTheme(initial);
      document.documentElement.dataset.theme = initial;
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    document.documentElement.dataset.theme = newTheme;
  };

  return (
    <button
      aria-label="Toggle Dark Mode"
      onClick={toggleTheme}
      className="fixed bottom-4 right-4 p-2 rounded-full bg-gray-200 text-gray-800"
    >
      {theme === "dark" ? "🌙" : "☀️"}
    </button>
  );
}
