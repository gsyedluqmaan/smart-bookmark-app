"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { motion, AnimatePresence } from "framer-motion";
import {
  LogOut,
  Bookmark,
  LayoutGrid,
  Hash,
  User,
  Mail,
  ChevronDown,
} from "lucide-react";

type HeaderProps = {
  totalCount: number;
  currentPage: number;
  totalPages: number;
};

type UserProfile = {
  name: string;
  email: string;
  avatarUrl?: string;
};

export function Header({ totalCount, currentPage, totalPages }: HeaderProps) {
  const [loggingOut, setLoggingOut] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [showProfile, setShowProfile] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        setProfile({
          name:
            user.user_metadata?.full_name || user.user_metadata?.name || "User",
          email: user.email || "",
          avatarUrl:
            user.user_metadata?.avatar_url || user.user_metadata?.picture,
        });
      }
    };
    fetchUser();
  }, []);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        profileRef.current &&
        !profileRef.current.contains(e.target as Node)
      ) {
        setShowProfile(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const logout = async () => {
    setLoggingOut(true);
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  const initials = profile?.name
    ? profile.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "U";

  return (
    <motion.div
      initial={{ opacity: 0, y: -16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="flex items-center justify-between mb-8"
      style={{ fontFamily: "'Outfit', sans-serif" }}
    >
      {/* Logo + title */}
      <div className="flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg shadow-[#0790e8]/20"
          style={{ background: "linear-gradient(135deg, #0790e8, #055aad)" }}
        >
          <Bookmark className="w-5 h-5 text-white" />
        </div>
        <span className="text-xl font-bold text-slate-800 tracking-tight">
          Bookmarks
        </span>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-3">
        {/* Profile avatar with hover card */}
        <div ref={profileRef} className="relative">
          <button
            onClick={() => setShowProfile((v) => !v)}
            onMouseEnter={() => setShowProfile(true)}
            className="flex items-center gap-2 rounded-xl px-2 py-1.5 transition-all duration-200 hover:bg-[rgba(7,144,232,0.06)]"
          >
            {profile?.avatarUrl ? (
              <img
                src={profile.avatarUrl}
                alt={profile.name}
                className="w-8 h-8 rounded-full object-cover border-2 border-white shadow-md"
              />
            ) : (
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-md"
                style={{
                  background: "linear-gradient(135deg, #0790e8, #055aad)",
                }}
              >
                {initials}
              </div>
            )}
            <ChevronDown
              className="w-3.5 h-3.5 text-slate-400 transition-transform duration-200"
              style={{
                transform: showProfile ? "rotate(180deg)" : "rotate(0deg)",
              }}
            />
          </button>

          <AnimatePresence>
            {showProfile && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 6, scale: 0.95 }}
                transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                onMouseLeave={() => setShowProfile(false)}
                className="absolute right-0 top-full mt-2 w-64 rounded-2xl bg-white border z-50 overflow-hidden"
                style={{
                  borderColor: "rgba(7,144,232,0.12)",
                  boxShadow:
                    "0 16px 40px rgba(7,144,232,0.12), 0 4px 16px rgba(0,0,0,0.06)",
                }}
              >
                {/* Profile header */}
                <div
                  className="px-5 py-4 border-b"
                  style={{
                    borderColor: "rgba(7,144,232,0.08)",
                    background: "rgba(7,144,232,0.03)",
                  }}
                >
                  <div className="flex items-center gap-3">
                    {profile?.avatarUrl ? (
                      <img
                        src={profile.avatarUrl}
                        alt={profile?.name}
                        className="w-11 h-11 rounded-full object-cover border-2 border-white shadow"
                      />
                    ) : (
                      <div
                        className="w-11 h-11 rounded-full flex items-center justify-center text-white font-bold text-sm shadow"
                        style={{
                          background:
                            "linear-gradient(135deg, #0790e8, #055aad)",
                        }}
                      >
                        {initials}
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <User
                          className="w-3 h-3 flex-shrink-0"
                          style={{ color: "#0790e8" }}
                        />
                        <p className="text-sm font-semibold text-slate-800 truncate">
                          {profile?.name || "Loading…"}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Mail
                          className="w-3 h-3 flex-shrink-0"
                          style={{ color: "#94a3b8" }}
                        />
                        <p className="text-xs text-slate-400 truncate">
                          {profile?.email || ""}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Sign out */}
                <div className="p-2">
                  <button
                    onClick={logout}
                    disabled={loggingOut}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 transition-colors duration-150 disabled:opacity-50"
                  >
                    <LogOut className="w-4 h-4" />
                    {loggingOut ? "Signing out…" : "Sign out"}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}
