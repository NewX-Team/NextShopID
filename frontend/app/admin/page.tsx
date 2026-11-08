"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function AdminPage() {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.replace("/login");
      } else if (user?.role !== "admin") {
        router.replace("/");
      }
    }
  }, [isLoading, isAuthenticated, user, router]);

  if (isLoading || !isAuthenticated || user?.role !== "admin") {
    return <div className="min-h-screen bg-white dark:bg-[#0b0f19]" />;
  }

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  return (
    <main className="min-h-screen w-full flex flex-col items-center justify-center bg-white dark:bg-[#0b0f19] px-4 transition-colors duration-200">
      <div className="text-center">
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-slate-900 dark:text-white mb-6 transition-colors duration-200">
          ini page admin
        </h1>
        <button
          type="button"
          onClick={handleLogout}
          className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 px-6 py-2.5 text-sm font-medium text-white shadow-sm transition-all active:scale-95 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
        >
          Logout
        </button>
      </div>
    </main>
  );
}
