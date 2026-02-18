"use client";

import toast from "react-hot-toast";
import { Search, Plus, Link2, Type, X, Loader2 } from "lucide-react";
import { useCallback, useRef, useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { motion, AnimatePresence } from "framer-motion";

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

type Props = {
  state: BookmarksState;
  updateState: (
    updates:
      | Partial<BookmarksState>
      | ((prev: BookmarksState) => Partial<BookmarksState>),
  ) => void;
  dataLoaded: boolean;
};

// Generate microlink screenshot URL for a given page URL
const getMicrolinkScreenshot = (pageUrl: string) =>
  `https://api.microlink.io/?url=${encodeURIComponent(pageUrl)}&screenshot=true&meta=false&embed=screenshot.url`;

export function BookmarkForm({ state, updateState, dataLoaded }: Props) {
  const [localSearch, setLocalSearch] = useState(state.searchTerm);
  const [isFocused, setIsFocused] = useState<"title" | "url" | "search" | null>(
    null,
  );

  const isSubmittingRef = useRef(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout>();

  const debouncedSearch = useCallback(
    (term: string) => {
      updateState({ searchTerm: term, currentPage: 1 });
    },
    [updateState],
  );

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value;
    setLocalSearch(term);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => debouncedSearch(term), 300);
  };

  useEffect(() => {
    setLocalSearch(state.searchTerm);
  }, [state.searchTerm]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const validateAndFormatURL = (input: string): string | null => {
    let formatted = input.trim();
    if (!formatted.startsWith("http://") && !formatted.startsWith("https://")) {
      formatted = "https://" + formatted;
    }
    try {
      const urlObj = new URL(formatted);
      const hostname = urlObj.hostname;
      if (
        !hostname.includes(".") ||
        urlObj.hostname.split(".").pop()?.length! < 2
      ) {
        return null;
      }
      return formatted;
    } catch {
      return null;
    }
  };

  const addBookmark = async () => {
    if (isSubmittingRef.current) return;
    if (!dataLoaded) return;

    if (!state.title || !state.url) {
      toast.error("Title and URL are required");
      return;
    }

    const formattedURL = validateAndFormatURL(state.url);
    if (!formattedURL) {
      toast.error("Invalid domain format (e.g., example.com)");
      return;
    }

    isSubmittingRef.current = true;
    setIsSubmitting(true);

    try {
      const optimisticId = `temp-${Date.now()}`;
      // Generate the thumbnail URL immediately — it will be stored in the DB
      // so future loads don't need to backfill
      const thumbnail_url = getMicrolinkScreenshot(formattedURL);

      const optimisticBookmark: Bookmark = {
        id: optimisticId,
        title: state.title.trim(),
        url: formattedURL,
        user_id: "",
        created_at: new Date().toISOString(),
        thumbnail_url, // include in optimistic update so the card shows shimmer→image
      };

      updateState({
        bookmarks: [optimisticBookmark, ...state.bookmarks],
        totalCount: state.totalCount + 1,
      });

      toast.loading("Saving bookmark...", { id: "adding" });

      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.user) throw new Error("No user session");

      // Store thumbnail_url in the DB at insert time — no backfill needed later
      const { error } = await supabase.from("bookmarks").insert([
        {
          title: state.title.trim(),
          url: formattedURL,
          user_id: session.user.id,
          thumbnail_url,
        },
      ]);

      toast.dismiss("adding");

      if (error) {
        // Rollback optimistic update
        updateState((prev: any) => ({
          ...prev,
          bookmarks: prev.bookmarks.filter(
            (b: Bookmark) => b.id !== optimisticId,
          ),
          totalCount: prev.totalCount - 1,
        }));
        toast.error(`Failed to save: ${error.message}`);
      } else {
        toast.success("Bookmark added!");
        updateState({ title: "", url: "" });
      }
    } catch {
      toast.dismiss("adding");
      toast.error("Failed to add bookmark");
    } finally {
      isSubmittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  const canAdd = dataLoaded && !!state.title && !!state.url && !isSubmitting;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="mb-6"
    >
      {/* ── Add form card ── */}
      <div
        className="rounded-2xl border p-5 mb-3 transition-all duration-300"
        style={{
          background: "white",
          borderColor: "rgba(7,144,232,0.12)",
          boxShadow: "0 4px 24px rgba(7,144,232,0.06)",
        }}
      >
        <p
          className="text-xs font-semibold uppercase tracking-widest mb-3.5"
          style={{ color: "#0790e8", fontFamily: "'Outfit', sans-serif" }}
        >
          Add Bookmark
        </p>

        <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-end">
          <div className="flex-1 flex flex-col sm:flex-row gap-3">
            {/* Title */}
            <div className="relative flex-1">
              <Type
                className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors duration-200"
                style={{ color: isFocused === "title" ? "#0790e8" : "#94a3b8" }}
              />
              <input
                className="w-full pl-10 pr-4 py-3 rounded-xl text-sm font-medium outline-none transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
                style={{
                  background: isFocused === "title" ? "white" : "#f8fafc",
                  border: `1.5px solid ${isFocused === "title" ? "#0790e8" : "#e2e8f0"}`,
                  boxShadow:
                    isFocused === "title"
                      ? "0 0 0 3px rgba(7,144,232,0.1)"
                      : "none",
                  color: "#1e293b",
                  fontFamily: "'Outfit', sans-serif",
                }}
                placeholder="Bookmark title"
                value={state.title}
                onChange={(e) => updateState({ title: e.target.value })}
                onFocus={() => setIsFocused("title")}
                onBlur={() => setIsFocused(null)}
                disabled={!dataLoaded || isSubmitting}
                onKeyDown={(e) => e.key === "Enter" && addBookmark()}
              />
            </div>

            {/* URL */}
            <div className="relative flex-1">
              <Link2
                className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors duration-200"
                style={{ color: isFocused === "url" ? "#0790e8" : "#94a3b8" }}
              />
              <input
                className="w-full pl-10 pr-4 py-3 rounded-xl text-sm font-medium outline-none transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
                style={{
                  background: isFocused === "url" ? "white" : "#f8fafc",
                  border: `1.5px solid ${isFocused === "url" ? "#0790e8" : "#e2e8f0"}`,
                  boxShadow:
                    isFocused === "url"
                      ? "0 0 0 3px rgba(7,144,232,0.1)"
                      : "none",
                  color: "#1e293b",
                  fontFamily: "'Outfit', sans-serif",
                }}
                placeholder="https://example.com"
                value={state.url}
                onChange={(e) => updateState({ url: e.target.value })}
                onFocus={() => setIsFocused("url")}
                onBlur={() => setIsFocused(null)}
                disabled={!dataLoaded || isSubmitting}
                onKeyDown={(e) => e.key === "Enter" && addBookmark()}
              />
            </div>
          </div>

          {/* Submit */}
          <motion.button
            onClick={addBookmark}
            disabled={!canAdd}
            whileHover={
              canAdd
                ? { scale: 1.02, boxShadow: "0 8px 24px rgba(7,144,232,0.3)" }
                : {}
            }
            whileTap={canAdd ? { scale: 0.97 } : {}}
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold transition-colors duration-200 disabled:cursor-not-allowed whitespace-nowrap min-w-[148px]"
            style={{
              background: canAdd
                ? "linear-gradient(135deg, #0790e8, #055aad)"
                : "#e2e8f0",
              color: canAdd ? "white" : "#94a3b8",
              boxShadow: canAdd ? "0 4px 14px rgba(7,144,232,0.2)" : "none",
              fontFamily: "'Outfit', sans-serif",
            }}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving…
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                Add Bookmark
              </>
            )}
          </motion.button>
        </div>
      </div>

      {/* ── Search bar ── */}
      <div
        className="relative rounded-2xl border transition-all duration-200"
        style={{
          background: "white",
          borderColor:
            isFocused === "search" ? "#0790e8" : "rgba(7,144,232,0.1)",
          boxShadow:
            isFocused === "search"
              ? "0 0 0 3px rgba(7,144,232,0.08), 0 4px 20px rgba(7,144,232,0.06)"
              : "0 2px 12px rgba(7,144,232,0.04)",
        }}
      >
        <Search
          className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors duration-200"
          style={{ color: isFocused === "search" ? "#0790e8" : "#94a3b8" }}
        />
        <input
          className="w-full pl-11 pr-12 py-3.5 bg-transparent outline-none text-sm font-medium placeholder-slate-400 disabled:opacity-40 rounded-2xl"
          style={{ color: "#1e293b", fontFamily: "'Outfit', sans-serif" }}
          placeholder="Search bookmarks by title or URL…"
          value={localSearch}
          onChange={handleSearchChange}
          onFocus={() => setIsFocused("search")}
          onBlur={() => setIsFocused(null)}
          disabled={!dataLoaded}
        />
        <AnimatePresence>
          {localSearch && (
            <motion.button
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.7 }}
              onClick={() => {
                setLocalSearch("");
                updateState({ searchTerm: "", currentPage: 1 });
              }}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full flex items-center justify-center"
              style={{ background: "rgba(7,144,232,0.1)", color: "#0790e8" }}
            >
              <X className="w-3.5 h-3.5" />
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
