"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

export default function StorageSearch({
  defaultValue,
  placeholder = "Ex : STK-2026-0001",
  submitLabel = "Vérifier",
}: {
  defaultValue: string;
  placeholder?: string;
  submitLabel?: string;
}) {
  const [value, setValue] = useState(defaultValue);
  const router = useRouter();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const ref = value.trim().toUpperCase();
    if (!ref) return;
    router.push(`/stockage?ref=${encodeURIComponent(ref)}`);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-lg mx-auto">
      <div className="relative flex-1">
        <Search size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder}
          className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#1A3A6B] focus:ring-2 focus:ring-[#1A3A6B]/10 transition-all bg-white"
          style={{ fontFamily: "var(--font-lato)" }}
        />
      </div>
      <button
        type="submit"
        className="px-6 py-3.5 rounded-xl font-black text-white text-sm uppercase tracking-wide hover:opacity-90 transition-all"
        style={{ backgroundColor: "#1A3A6B", fontFamily: "var(--font-montserrat)" }}
      >
        {submitLabel}
      </button>
    </form>
  );
}
