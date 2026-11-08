"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  UserIcon,
  LockIcon,
  MailIcon,
  EyeIcon,
  EyeOffIcon,
  ArrowRightIcon,
  CheckIcon,
} from "@/components/ui/icons";
import { authService } from "@/services/auth.service";
import { useAuth } from "@/context/AuthContext";
import { LoginInput, RegisterInput } from "@/types/auth";

interface AuthCardProps {
  initialMode?: "login" | "register";
}

export const AuthCard: React.FC<AuthCardProps> = ({ initialMode = "login" }) => {
  const router = useRouter();
  const { login } = useAuth();

  const [mode, setMode] = useState<"login" | "register">(initialMode);

  // Sinkronkan mode jika initialMode berubah dari URL
  useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);

  // Fungsi ganti mode dengan update URL tanpa reload
  const switchMode = (newMode: "login" | "register") => {
    setMode(newMode);
    if (typeof window !== "undefined") {
      window.history.pushState(null, "", `/${newMode}`);
    }
  };

  // State Form Login
  const [loginData, setLoginData] = useState<LoginInput>({
    identifier: "",
    password: "",
  });
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [isLoginLoading, setIsLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState("");

  // State Form Register
  const [registerData, setRegisterData] = useState<RegisterInput>({
    name: "",
    username: "",
    email: "",
    password: "",
    newPassword: "",
  });
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isRegisterLoading, setIsRegisterLoading] = useState(false);
  const [registerError, setRegisterError] = useState("");

  // Handler Submit Login
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoginLoading(true);
    setLoginError("");

    try {
      const response = await authService.login(loginData);
      if (response.success && response.token && response.user) {
        login(response.token, response.user);
        router.push("/");
      } else {
        setLoginError(response.message || "Kredensial login tidak valid.");
      }
    } catch (err) {
      console.error("[AuthCard.Login] Error:", err);
      setLoginError("Tidak dapat terhubung ke server backend.");
    } finally {
      setIsLoginLoading(false);
    }
  };

  // Handler Submit Register
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (registerData.password !== registerData.newPassword) {
      setRegisterError("Password dan Konfirmasi Password tidak cocok.");
      return;
    }

    if (registerData.password.length < 6) {
      setRegisterError("Password minimal 6 karakter.");
      return;
    }

    setIsRegisterLoading(true);
    setRegisterError("");

    try {
      const response = await authService.register(registerData);
      if (response.success) {
        // Otomatis login dengan kredensial baru
        const loginRes = await authService.login({
          identifier: registerData.email,
          password: registerData.password,
        });

        if (loginRes.success && loginRes.token && loginRes.user) {
          login(loginRes.token, loginRes.user);
          router.push("/");
        } else {
          switchMode("login");
        }
      } else {
        setRegisterError(response.message || "Pendaftaran gagal diverifikasi.");
      }
    } catch (err) {
      console.error("[AuthCard.Register] Error:", err);
      setRegisterError("Terjadi kendala saat menghubungi server pendaftaran.");
    } finally {
      setIsRegisterLoading(false);
    }
  };

  return (
    <div className="w-full max-w-[480px] mx-auto py-8 px-4">
      
      {/* Container Utama Auth: Obsidian Dark Navy (#0b132b) Selaras dengan Desain Navbar */}
      <div className="relative rounded-3xl bg-[#0b132b] border border-white/10 p-6 sm:p-9 shadow-[0_24px_60px_-12px_rgba(11,19,43,0.45),inset_0_1px_1px_rgba(255,255,255,0.08)] backdrop-blur-md">
        
        {/* Ambient Top Glow Halus */}
        <div className="pointer-events-none absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-blue-500/50 to-transparent" />

        {/* Pill Dock Mode Switcher: Geser Antara Login & Register */}
        <div className="flex justify-center mb-7">
          <div className="relative flex items-center p-1.5 rounded-full bg-slate-900/90 border border-white/10 shadow-inner w-full max-w-[280px]">
            {/* Glider Biru Royal Sapphire yang Meluncur Mengikuti Mode Aktif */}
            <div
              className="absolute left-1.5 top-1.5 bottom-1.5 w-[calc(50%-6px)] rounded-full bg-gradient-to-b from-blue-500 to-blue-600 border-t border-white/30 border-x border-b border-blue-600/50 shadow-[0_2px_12px_rgba(37,99,235,0.45)] transition-transform duration-400 ease-[cubic-bezier(0.2,0.8,0.2,1)]"
              style={{
                transform: mode === "login" ? "translateX(0%)" : "translateX(100%)",
              }}
              aria-hidden="true"
            />

            <button
              type="button"
              onClick={() => switchMode("login")}
              className={`relative z-10 flex-1 py-1.5 text-center text-[13px] font-semibold tracking-tight transition-colors duration-200 select-none rounded-full ${
                mode === "login" ? "text-white" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Login
            </button>

            <button
              type="button"
              onClick={() => switchMode("register")}
              className={`relative z-10 flex-1 py-1.5 text-center text-[13px] font-semibold tracking-tight transition-colors duration-200 select-none rounded-full ${
                mode === "register" ? "text-white" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Register
            </button>
          </div>
        </div>

        {/* Viewport Geser Horizontal Antara Login dan Register */}
        <div className="overflow-hidden w-full">
          <div
            className="flex transition-transform duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)]"
            style={{
              width: "200%",
              transform: mode === "login" ? "translateX(0%)" : "translateX(-50%)",
            }}
          >
            {/* PANEL 1: LOGIN NEXTSHOPID */}
            <div className="w-1/2 flex-shrink-0 px-1 sm:px-2">
              <div className="mb-6">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 px-2.5 py-0.5 text-[11px] font-medium text-blue-400 mb-2">
                  <span>Selamat Datang</span>
                </span>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                  Login NextShopID
                </h1>
                <p className="text-xs sm:text-sm text-slate-400 mt-1">
                  Masuk ke akun Anda untuk mulai berbelanja dan melacak pesanan.
                </p>
              </div>

              {loginError && (
                <div className="mb-5 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">
                  {loginError}
                </div>
              )}

              <form onSubmit={handleLoginSubmit} className="space-y-4">
                {/* Field Username / Email */}
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Username atau Email
                  </label>
                  <div className="relative flex items-center">
                    <span className="absolute left-3.5 text-slate-400 pointer-events-none">
                      <UserIcon size={16} />
                    </span>
                    <input
                      type="text"
                      required
                      value={loginData.identifier}
                      onChange={(e) => {
                        setLoginData((p) => ({ ...p, identifier: e.target.value }));
                        if (loginError) setLoginError("");
                      }}
                      placeholder="Masukkan username atau email"
                      className="w-full rounded-xl bg-slate-900/70 border border-white/10 px-4 py-2.5 pl-10 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                    />
                  </div>
                </div>

                {/* Field Password */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-medium text-slate-300">
                      Password
                    </label>
                    <a
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        alert("Silakan hubungi administrator untuk mereset password akun demo Anda.");
                      }}
                      className="text-[11px] text-blue-400 hover:text-blue-300 transition-colors"
                    >
                      Lupa password?
                    </a>
                  </div>
                  <div className="relative flex items-center">
                    <span className="absolute left-3.5 text-slate-400 pointer-events-none">
                      <LockIcon size={16} />
                    </span>
                    <input
                      type={showLoginPassword ? "text" : "password"}
                      required
                      value={loginData.password}
                      onChange={(e) => {
                        setLoginData((p) => ({ ...p, password: e.target.value }));
                        if (loginError) setLoginError("");
                      }}
                      placeholder="Masukkan password"
                      className="w-full rounded-xl bg-slate-900/70 border border-white/10 px-4 py-2.5 pl-10 pr-10 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowLoginPassword((p) => !p)}
                      className="absolute right-3.5 text-slate-400 hover:text-white transition-colors"
                      aria-label="Tampilkan atau sembunyikan password"
                    >
                      {showLoginPassword ? <EyeOffIcon size={16} /> : <EyeIcon size={16} />}
                    </button>
                  </div>
                </div>

                {/* Tombol Masuk */}
                <button
                  type="submit"
                  disabled={isLoginLoading}
                  className="w-full mt-2 rounded-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-600 text-white font-semibold py-3 text-sm shadow-[0_4px_20px_rgba(37,99,235,0.35)] active:scale-[0.98] transition-all disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isLoginLoading ? (
                    <span>Memverifikasi akun...</span>
                  ) : (
                    <>
                      <span>Masuk ke NextShopID</span>
                      <ArrowRightIcon size={16} />
                    </>
                  )}
                </button>
              </form>

              {/* Tautan Geser ke Register */}
              <div className="mt-6 pt-5 border-t border-white/10 text-center">
                <p className="text-xs text-slate-400">
                  Belum memiliki akun NextShopID?{" "}
                  <button
                    type="button"
                    onClick={() => switchMode("register")}
                    className="font-semibold text-blue-400 hover:text-blue-300 transition-colors cursor-pointer inline-flex items-center gap-1 ml-0.5"
                  >
                    <span>Daftar Akun Baru</span>
                    <span>→</span>
                  </button>
                </p>
              </div>
            </div>

            {/* PANEL 2: REGISTER NEXTSHOPID */}
            <div className="w-1/2 flex-shrink-0 px-1 sm:px-2">
              <div className="mb-6">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 px-2.5 py-0.5 text-[11px] font-medium text-blue-400 mb-2">
                  <span>Mulai Berbelanja</span>
                </span>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                  Register NextShopID
                </h1>
                <p className="text-xs sm:text-sm text-slate-400 mt-1">
                  Buat akun baru dan nikmati berbagai promo eksklusif.
                </p>
              </div>

              {registerError && (
                <div className="mb-5 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">
                  {registerError}
                </div>
              )}

              <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
                {/* Field Nama Lengkap */}
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Nama Lengkap
                  </label>
                  <div className="relative flex items-center">
                    <span className="absolute left-3.5 text-slate-400 pointer-events-none">
                      <UserIcon size={16} />
                    </span>
                    <input
                      type="text"
                      required
                      value={registerData.name}
                      onChange={(e) => {
                        setRegisterData((p) => ({ ...p, name: e.target.value }));
                        if (registerError) setRegisterError("");
                      }}
                      placeholder="Nama lengkap Anda"
                      className="w-full rounded-xl bg-slate-900/70 border border-white/10 px-4 py-2 pl-10 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                    />
                  </div>
                </div>

                {/* Field Baris Ganda: Username & Email */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Username
                    </label>
                    <div className="relative flex items-center">
                      <span className="absolute left-3.5 text-slate-400 pointer-events-none text-xs">
                        @
                      </span>
                      <input
                        type="text"
                        required
                        value={registerData.username}
                        onChange={(e) => {
                          setRegisterData((p) => ({ ...p, username: e.target.value }));
                          if (registerError) setRegisterError("");
                        }}
                        placeholder="username"
                        className="w-full rounded-xl bg-slate-900/70 border border-white/10 px-4 py-2 pl-8 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Email
                    </label>
                    <div className="relative flex items-center">
                      <span className="absolute left-3.5 text-slate-400 pointer-events-none">
                        <MailIcon size={16} />
                      </span>
                      <input
                        type="email"
                        required
                        value={registerData.email}
                        onChange={(e) => {
                          setRegisterData((p) => ({ ...p, email: e.target.value }));
                          if (registerError) setRegisterError("");
                        }}
                        placeholder="nama@email.com"
                        className="w-full rounded-xl bg-slate-900/70 border border-white/10 px-4 py-2 pl-10 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                      />
                    </div>
                  </div>
                </div>

                {/* Field Baris Ganda: Password & Konfirmasi Password */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Password
                    </label>
                    <div className="relative flex items-center">
                      <span className="absolute left-3.5 text-slate-400 pointer-events-none">
                        <LockIcon size={16} />
                      </span>
                      <input
                        type={showRegisterPassword ? "text" : "password"}
                        required
                        value={registerData.password}
                        onChange={(e) => {
                          setRegisterData((p) => ({ ...p, password: e.target.value }));
                          if (registerError) setRegisterError("");
                        }}
                        placeholder="Min 6 karakter"
                        className="w-full rounded-xl bg-slate-900/70 border border-white/10 px-3.5 py-2 pl-9 pr-9 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowRegisterPassword((p) => !p)}
                        className="absolute right-3 text-slate-400 hover:text-white transition-colors"
                        aria-label="Tampilkan atau sembunyikan password"
                      >
                        {showRegisterPassword ? <EyeOffIcon size={14} /> : <EyeIcon size={14} />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Ulangi Password
                    </label>
                    <div className="relative flex items-center">
                      <span className="absolute left-3.5 text-slate-400 pointer-events-none">
                        <CheckIcon size={16} />
                      </span>
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        required
                        value={registerData.newPassword}
                        onChange={(e) => {
                          setRegisterData((p) => ({ ...p, newPassword: e.target.value }));
                          if (registerError) setRegisterError("");
                        }}
                        placeholder="Konfirmasi"
                        className="w-full rounded-xl bg-slate-900/70 border border-white/10 px-3.5 py-2 pl-9 pr-9 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword((p) => !p)}
                        className="absolute right-3 text-slate-400 hover:text-white transition-colors"
                        aria-label="Tampilkan atau sembunyikan password konfirmasi"
                      >
                        {showConfirmPassword ? <EyeOffIcon size={14} /> : <EyeIcon size={14} />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Tombol Buat Akun */}
                <button
                  type="submit"
                  disabled={isRegisterLoading}
                  className="w-full mt-2 rounded-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-600 text-white font-semibold py-3 text-sm shadow-[0_4px_20px_rgba(37,99,235,0.35)] active:scale-[0.98] transition-all disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isRegisterLoading ? (
                    <span>Mendaftarkan akun...</span>
                  ) : (
                    <>
                      <span>Daftar Akun NextShopID</span>
                      <ArrowRightIcon size={16} />
                    </>
                  )}
                </button>
              </form>

              {/* Tautan Geser ke Login */}
              <div className="mt-5 pt-4 border-t border-white/10 text-center">
                <p className="text-xs text-slate-400">
                  Sudah memiliki akun?{" "}
                  <button
                    type="button"
                    onClick={() => switchMode("login")}
                    className="font-semibold text-blue-400 hover:text-blue-300 transition-colors cursor-pointer inline-flex items-center gap-1 ml-0.5"
                  >
                    <span>← Masuk ke Akun Anda</span>
                  </button>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
