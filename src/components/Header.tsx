"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { motion } from "framer-motion";
import { LogOut, Bookmark, LayoutGrid, Hash } from "lucide-react";

type HeaderProps = {
  totalCount: number;
  currentPage: number;
  totalPages: number;
};

export function Header({ totalCount, currentPage, totalPages }: HeaderProps) {
  const [loggingOut, setLoggingOut] = useState(false);

  const logout = async () => {
    setLoggingOut(true);
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="mb-8"
    >
      <div className="flex items-center justify-between">
        {/* Logo + title */}
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg shadow-[#0790e8]/20"
            style={{ background: "linear-gradient(135deg, #0790e8, #055aad)" }}
          >
            <Bookmark className="w-5 h-5 text-white fill-white" />
          </div>
          <div>
            <h1
              className="text-2xl font-extrabold tracking-tight"
              style={{
                fontFamily: "'Outfit', sans-serif",
                background: "linear-gradient(135deg, #0790e8 0%, #055aad 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Bookmarks
            </h1>
          </div>
        </div>

        {/* Stats pills + logout */}
        <div className="flex items-center gap-3">
          {/* Logout */}
          <motion.button
            onClick={logout}
            disabled={loggingOut}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              background: loggingOut ? "#f1f5f9" : "rgba(239,68,68,0.08)",
              color: loggingOut ? "#94a3b8" : "#ef4444",
              border: "1px solid",
              borderColor: loggingOut ? "#e2e8f0" : "rgba(239,68,68,0.2)",
            }}
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">
              {loggingOut ? "Signing out…" : "Sign out"}
            </span>
          </motion.button>
        </div>
      </div>
    </motion.header>
  );
}
