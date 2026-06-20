"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";

interface Props {
  title: string;
  subtitle?: string;
  backHref?: string;
  action?: React.ReactNode;
}

export default function AdminHeader({ title, subtitle, backHref, action }: Props) {
  const router = useRouter();

  return (
    <div className="bg-white border-b border-gray-200 px-6 py-5 sticky top-0 z-10">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          {backHref && (
            <button
              onClick={() => router.push(backHref)}
              className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-all shrink-0"
            >
              <ChevronLeft size={16} />
            </button>
          )}
          <div className="min-w-0">
            <h1
              className="text-base font-black uppercase truncate"
              style={{ color: "#1A3A6B", fontFamily: "var(--font-montserrat)" }}
            >
              {title}
            </h1>
            {subtitle && (
              <p className="text-xs text-gray-500 mt-0.5" style={{ fontFamily: "var(--font-lato)" }}>
                {subtitle}
              </p>
            )}
          </div>
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
    </div>
  );
}
