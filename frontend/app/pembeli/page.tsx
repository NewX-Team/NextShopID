"use client";

import React, { useState } from "react";
import {
  PembeliSidebar,
  PembeliMenuKey,
} from "@/components/pembeli/PembeliSidebar";
import { PembeliDashboardView } from "@/components/pembeli/PembeliDashboardView";
import { PembeliOrdersView } from "@/components/pembeli/PembeliOrdersView";
import { PembeliProfileView } from "@/components/pembeli/PembeliProfileView";
import { PembeliSettingsView } from "@/components/pembeli/PembeliSettingsView";

export default function PembeliPage() {
  const [activeMenu, setActiveMenu] = useState<PembeliMenuKey>("dashboard");

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-[#070b14] py-6 sm:py-8 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 items-start">
          {/* Sidebar Navigasi Pembeli */}
          <PembeliSidebar
            activeMenu={activeMenu}
            onSelectMenu={(menu) => setActiveMenu(menu)}
          />

          {/* Konten Halaman Pembeli Sesuai Menu Terpilih */}
          <main className="flex-1 w-full min-w-0">
            {activeMenu === "dashboard" && (
              <PembeliDashboardView
                onNavigateTab={(tab) => setActiveMenu(tab)}
              />
            )}
            {activeMenu === "orders" && <PembeliOrdersView />}
            {activeMenu === "profile" && <PembeliProfileView />}
            {activeMenu === "settings" && <PembeliSettingsView />}
          </main>
        </div>
      </div>
    </div>
  );
}
