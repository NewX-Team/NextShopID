"use client";

import React from "react";
import { PembeliSidebar } from "@/components/pembeli/PembeliSidebar";
import { PembeliProfileView } from "@/components/pembeli/PembeliProfileView";

export default function PembeliProfilePage() {
  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-[#070b14] py-6 sm:py-8 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 items-start">
          <PembeliSidebar activeMenu="profile" />
          <main className="flex-1 w-full min-w-0">
            <PembeliProfileView />
          </main>
        </div>
      </div>
    </div>
  );
}
