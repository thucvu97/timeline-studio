"use client";

import { ThemeToggle } from "@/components/theme/theme-toggle";

export default function Home() {
  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)] dark:bg-gray-900 bg-gray-100 text-gray-800 dark:text-gray-200">
      <main className="flex flex-col gap-8 row-start-2 items-center sm:items-start">
        <ThemeToggle />
        <h1 className="text-4xl font-bold dark:text-white">Welcome to Timeline</h1>
        <p className="text-lg dark:text-gray-400">Your personal timeline app.</p>
      </main>
    </div>
  );
}
