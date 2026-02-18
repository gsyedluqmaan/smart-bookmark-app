"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import toast from "react-hot-toast";
import { motion } from "framer-motion";
import { Header } from "@/components/Header";
import { BookmarkForm } from "@/components/BookmarkForm";
import { BookmarksView } from "@/components/BookmarksView";

export type ViewMode = "grid" | "list";
export type Bookmark = {
  id: string;
  title: string;
  url: string;
  user_id: string;
  created_at: string;
  thumbnail_url?: string;
};
export type BookmarksState = {
  bookmarks: Bookmark[];
  title: string;
  url: string;
  checkingAuth: boolean;
  dataLoaded: boolean;
  searchTerm: string;
  currentPage: number;
  totalCount: number;
  loading: boolean;
  viewMode: ViewMode;
};

export default function Dashboard() {
  const [state, setState] = useState<BookmarksState>({
    bookmarks: [],
    title: "",
    url: "",
    checkingAuth: true,
    dataLoaded: false,
    searchTerm: "",
    currentPage: 1,
    totalCount: 0,
    loading: false,
    viewMode: "grid",
  });

  const channelRef = useRef<any>(null);
  // Always-current ref so the realtime handler never reads stale state
  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const updateState = useCallback(
    (
      updates:
        | Partial<BookmarksState>
        | ((prev: BookmarksState) => Partial<BookmarksState>),
    ) => {
      setState((prev) => {
        const resolvedUpdates =
          typeof updates === "function" ? updates(prev) : updates;
        return { ...prev, ...resolvedUpdates };
      });
    },
    [],
  );

  // DB-first delete — UI update comes from the Realtime DELETE event handler
  const deleteBookmark = useCallback(async (id: string) => {
    try {
      const { error } = await supabase.from("bookmarks").delete().eq("id", id);
      if (error) throw error;
      toast.success("Bookmark deleted");
    } catch {
      toast.error("Failed to delete");
    }
  }, []);

  // Stable init — runs exactly once on mount
  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        window.location.href = "/";
        return;
      }

      if (cancelled) return;

      const urlParams = new URLSearchParams(window.location.search);
      const page = parseInt(urlParams.get("page") || "1");
      const view = (urlParams.get("view") as ViewMode) || "grid";

      setState((prev) => ({
        ...prev,
        checkingAuth: false,
        dataLoaded: true,
        currentPage: page > 0 ? page : 1,
        viewMode: view === "grid" || view === "list" ? view : "grid",
      }));

      // Subscribe to all changes on the user's bookmarks
      channelRef.current = supabase
        .channel(`bookmarks-${session.user.id}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "bookmarks",
            filter: `user_id=eq.${session.user.id}`,
          },
          (payload) => {
            if (payload.eventType === "INSERT") {
              const newBookmark = payload.new as Bookmark;

              setState((prev) => {
                // Avoid duplicates — optimistic inserts use temp- IDs so
                // this check only deduplicates real DB echoes on the same tab
                const alreadyExists = prev.bookmarks.some(
                  (b) => b.id === newBookmark.id,
                );
                if (alreadyExists) return prev;

                // Remove the matching optimistic placeholder (same url+title,
                // temp id) that the form added, then prepend the real record
                const withoutOptimistic = prev.bookmarks.filter(
                  (b) =>
                    !(
                      b.id.startsWith("temp-") &&
                      b.url === newBookmark.url &&
                      b.title === newBookmark.title
                    ),
                );

                return {
                  ...prev,
                  bookmarks: [newBookmark, ...withoutOptimistic],
                  totalCount: prev.totalCount + (alreadyExists ? 0 : 1),
                };
              });
            }

            if (payload.eventType === "DELETE") {
              const deletedId = payload.old.id;
              setState((prev) => ({
                ...prev,
                bookmarks: prev.bookmarks.filter((b) => b.id !== deletedId),
                totalCount: Math.max(0, prev.totalCount - 1),
              }));
            }

            if (payload.eventType === "UPDATE") {
              const updated = payload.new as Bookmark;
              setState((prev) => ({
                ...prev,
                bookmarks: prev.bookmarks.map((b) =>
                  b.id === updated.id ? { ...b, ...updated } : b,
                ),
              }));
            }
          },
        )
        .subscribe((status) => {
          if (status === "SUBSCRIBED") {
            console.log("Realtime connected");
          }
        });
    };

    init();

    return () => {
      cancelled = true;
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, []); // ← empty deps: runs once, never re-subscribes

  const headerProps = {
    totalCount: state.totalCount,
    currentPage: state.currentPage,
    totalPages: Math.ceil(state.totalCount / 10),
  };

  const formProps = { state, updateState, dataLoaded: state.dataLoaded };
  const viewProps = { state, updateState, deleteBookmark };

  // ── Loading screen ──────────────────────────────────────────────────────
  if (state.checkingAuth) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center gap-4"
        style={{ background: "white", fontFamily: "'Outfit', sans-serif" }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-xl shadow-[#0790e8]/20"
          style={{ background: "linear-gradient(135deg, #0790e8, #055aad)" }}
        >
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          >
            <svg viewBox="0 0 24 24" width="28" height="28" fill="white">
              <path d="M17 3H7a2 2 0 0 0-2 2v16l7-3 7 3V5a2 2 0 0 0-2-2Z" />
            </svg>
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          className="flex flex-col items-center gap-1"
        >
          <p className="text-lg font-bold text-slate-700">
            Loading your bookmarks
          </p>
          <p className="text-sm text-slate-400">Just a moment…</p>
        </motion.div>

        <motion.div className="flex gap-1.5 mt-1">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-2 h-2 rounded-full"
              style={{ background: "#0790e8" }}
              animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1, 0.8] }}
              transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
            />
          ))}
        </motion.div>
      </div>
    );
  }

  // ── Main dashboard ─────────────────────────────────────────────────────
  return (
    <div
      className="min-h-screen"
      style={{
        fontFamily: "'Outfit', sans-serif",
        background:
          "linear-gradient(160deg, #f8faff 0%, #eef6ff 50%, #f8faff 100%)",
      }}
    >
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap');`}</style>

      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute -top-32 -right-32 w-96 h-96 rounded-full opacity-30"
          style={{
            background:
              "radial-gradient(circle, rgba(7,144,232,0.12) 0%, transparent 70%)",
          }}
        />
        <div
          className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full opacity-20"
          style={{
            background:
              "radial-gradient(circle, rgba(7,144,232,0.1) 0%, transparent 70%)",
          }}
        />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <Header {...headerProps} />
        <BookmarkForm {...formProps} />
        <BookmarksView {...viewProps} />
      </div>
    </div>
  );
}
