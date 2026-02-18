"use client";

import toast from "react-hot-toast";
import {
  ChevronLeft,
  ChevronRight,
  Trash2,
  Search,
  LayoutGrid,
  List,
  BookmarkX,
  ExternalLink,
} from "lucide-react";
import { useEffect, useCallback, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { motion } from "framer-motion";

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
  updateState: (updates: Partial<BookmarksState>) => void;
  deleteBookmark: (id: string) => Promise<void>;
};

const getFaviconUrl = (bookmarkUrl: string) => {
  try {
    const hostname = new URL(bookmarkUrl).hostname;
    return `https://www.google.com/s2/favicons?domain=${hostname}&sz=128`;
  } catch {
    return "";
  }
};

const getMicrolinkScreenshot = (pageUrl: string) =>
  `https://api.microlink.io/?url=${encodeURIComponent(pageUrl)}&screenshot=true&meta=false&embed=screenshot.url`;

function ThumbnailShimmer() {
  return (
    <div
      className="w-full h-full"
      style={{
        background:
          "linear-gradient(90deg, #f1f5f9 25%, #e8f4fd 50%, #f1f5f9 75%)",
        backgroundSize: "200% 100%",
        animation: "bv-shimmer 1.6s infinite",
      }}
    >
      <style>{`
        @keyframes bv-shimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  );
}

function BookmarkThumbnail({
  bookmark,
  isPending,
}: {
  bookmark: Bookmark;
  isPending: boolean;
}) {
  const [imgState, setImgState] = useState<"loading" | "loaded" | "error">(
    "loading",
  );

  const prevUrl = useRef(bookmark.thumbnail_url);
  useEffect(() => {
    if (bookmark.thumbnail_url !== prevUrl.current) {
      prevUrl.current = bookmark.thumbnail_url;
      setImgState("loading");
    }
  }, [bookmark.thumbnail_url]);

  if (!bookmark.thumbnail_url || isPending) {
    return <ThumbnailShimmer />;
  }

  return (
    <>
      {imgState === "loading" && (
        <div className="absolute inset-0">
          <ThumbnailShimmer />
        </div>
      )}
      <img
        src={bookmark.thumbnail_url}
        alt="Thumbnail"
        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        style={{
          opacity: imgState === "loaded" ? 1 : 0,
          transition: "opacity 0.3s",
        }}
        onLoad={() => setImgState("loaded")}
        onError={(e) => {
          setImgState("error");
          const el = e.target as HTMLImageElement;
          el.src = getFaviconUrl(bookmark.url);
          el.style.opacity = "1";
          el.className = "w-12 h-12 object-contain";
        }}
        loading="lazy"
      />
    </>
  );
}

export function BookmarksView({ state, updateState, deleteBookmark }: Props) {
  const [fetching, setFetching] = useState(false);
  const [pendingThumbnails, setPendingThumbnails] = useState<Set<string>>(
    new Set(),
  );

  const bookmarksRef = useRef<Bookmark[]>(state.bookmarks);
  useEffect(() => {
    bookmarksRef.current = state.bookmarks;
  }, [state.bookmarks]);

  const backfillThumbnails = useCallback(
    async (bookmarks: Bookmark[]) => {
      const missing = bookmarks.filter((b) => !b.thumbnail_url);
      if (missing.length === 0) return;

      setPendingThumbnails((prev) => {
        const next = new Set(prev);
        missing.forEach((b) => next.add(b.id));
        return next;
      });

      const clearPending = () =>
        setPendingThumbnails((prev) => {
          const next = new Set(prev);
          missing.forEach((b) => next.delete(b.id));
          return next;
        });

      const updates = missing.map((b) => ({
        id: b.id,
        thumbnail_url: getMicrolinkScreenshot(b.url),
      }));

      const results = await Promise.allSettled(
        updates.map(({ id, thumbnail_url }) =>
          supabase.from("bookmarks").update({ thumbnail_url }).eq("id", id),
        ),
      );

      const anyFailed = results.some(
        (r) =>
          r.status === "rejected" ||
          (r.status === "fulfilled" && r.value.error),
      );

      if (anyFailed) {
        console.error("One or more thumbnail backfills failed");
        clearPending();
        return;
      }

      // Read from ref — always current, no stale closure, no extra dep
      updateState({
        bookmarks: bookmarksRef.current.map((b) => {
          const upd = updates.find((u) => u.id === b.id);
          return upd ? { ...b, thumbnail_url: upd.thumbnail_url } : b;
        }),
      });

      clearPending();
    },
    [updateState],
  );

  const fetchBookmarks = useCallback(
    async (page: number) => {
      setFetching(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const query = supabase
        .from("bookmarks")
        .select("*", { count: "exact" })
        .eq("user_id", user?.id || "")
        .order("created_at", { ascending: false });

      if (state.searchTerm) {
        query.or(
          `title.ilike.%${state.searchTerm}%,url.ilike.%${state.searchTerm}%`,
        );
      }

      const from = (page - 1) * 10;
      query.range(from, from + 9);

      const { data, count, error } = await query;
      if (error) {
        toast.error("Failed to load bookmarks");
      } else {
        const bookmarks = data || [];
        updateState({
          bookmarks,
          totalCount: count || 0,
          currentPage: page,
          loading: false,
        });
        backfillThumbnails(bookmarks);
      }
      setFetching(false);
    },
    [state.searchTerm, updateState, backfillThumbnails],
  );

  useEffect(() => {
    if (state.dataLoaded) fetchBookmarks(state.currentPage);
  }, [state.searchTerm, state.currentPage, state.dataLoaded, fetchBookmarks]);

  useEffect(() => {
    const url = new URL(window.location.href);
    if (state.currentPage > 1)
      url.searchParams.set("page", state.currentPage.toString());
    else url.searchParams.delete("page");
    url.searchParams.set("view", state.viewMode);
    window.history.replaceState({}, "", url);
  }, [state.currentPage, state.viewMode]);

  useEffect(() => {
    if (
      state.bookmarks.length === 0 &&
      state.totalCount > 0 &&
      state.currentPage > 1
    ) {
      updateState({ currentPage: state.currentPage - 1 });
    }
  }, [
    state.bookmarks.length,
    state.totalCount,
    state.currentPage,
    updateState,
  ]);

  const totalPages = Math.ceil(state.totalCount / 10);
  const canGoPrev = state.currentPage > 1;
  const canGoNext = state.currentPage < totalPages;

  const renderSkeleton = () => (
    <div
      className={`grid gap-4 ${state.viewMode === "grid" ? "grid-cols-1 md:grid-cols-2 xl:grid-cols-3" : "grid-cols-1"}`}
    >
      {Array(state.viewMode === "grid" ? 6 : 4)
        .fill(0)
        .map((_, i) => (
          <div
            key={i}
            className={`animate-pulse rounded-2xl border border-gray-100 overflow-hidden bg-white ${
              state.viewMode === "grid" ? "h-72" : "h-24"
            }`}
            style={{ animationDelay: `${i * 60}ms` }}
          >
            {state.viewMode === "grid" ? (
              <>
                <div className="h-44 bg-gradient-to-r from-slate-100 to-blue-50" />
                <div className="p-4 space-y-2">
                  <div className="h-4 bg-slate-200 rounded-full w-3/4" />
                  <div className="h-3 bg-slate-100 rounded-full w-1/2" />
                </div>
              </>
            ) : (
              <div className="flex items-center gap-4 p-4 h-full">
                <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-slate-100 to-blue-50 flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-slate-200 rounded-full w-2/3" />
                  <div className="h-3 bg-slate-100 rounded-full w-1/3" />
                </div>
              </div>
            )}
          </div>
        ))}
    </div>
  );

  const renderGridView = () => (
    <div className="grid gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
      {state.bookmarks.map((bookmark) => (
        <div
          key={bookmark.id}
          onClick={() =>
            window.open(bookmark.url, "_blank", "noopener,noreferrer")
          }
          className="group relative bg-white rounded-2xl border border-gray-100 cursor-pointer overflow-hidden transition-all duration-300 hover:-translate-y-1.5"
          style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }}
          onMouseEnter={(e) => {
            e.currentTarget.style.boxShadow =
              "0 12px 32px rgba(7,144,232,0.12)";
            e.currentTarget.style.borderColor = "rgba(7,144,232,0.2)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = "0 2px 12px rgba(0,0,0,0.04)";
            e.currentTarget.style.borderColor = "#f1f5f9";
          }}
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              deleteBookmark(bookmark.id);
            }}
            className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-xl opacity-0 group-hover:opacity-100 transition-all z-10"
            style={{ background: "rgba(239,68,68,0.9)", color: "white" }}
            title="Delete"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>

          <div className="absolute top-3 left-3 w-7 h-7 flex items-center justify-center rounded-lg opacity-0 group-hover:opacity-100 transition-all z-10 bg-white/80 backdrop-blur-sm">
            <ExternalLink
              className="w-3.5 h-3.5"
              style={{ color: "#0790e8" }}
            />
          </div>

          <div className="relative h-44 bg-gradient-to-br from-slate-50 to-blue-50 overflow-hidden flex items-center justify-center">
            <BookmarkThumbnail
              bookmark={bookmark}
              isPending={pendingThumbnails.has(bookmark.id)}
            />
          </div>

          <div className="p-4">
            <h3
              className="font-semibold text-sm text-slate-800 line-clamp-1 mb-1 group-hover:text-[#0790e8] transition-colors"
              style={{ fontFamily: "'Outfit', sans-serif" }}
              title={bookmark.title}
            >
              {bookmark.title}
            </h3>
            <p className="text-xs text-slate-400 truncate mb-2">
              {bookmark.url}
            </p>
            <span
              className="text-[10px] font-medium px-2 py-0.5 rounded-full"
              style={{ background: "rgba(7,144,232,0.07)", color: "#0790e8" }}
            >
              {new Date(bookmark.created_at).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              })}
            </span>
          </div>
        </div>
      ))}
    </div>
  );

  const renderListView = () => (
    <div className="flex flex-col gap-2">
      {state.bookmarks.map((bookmark) => {
        const faviconSrc = getFaviconUrl(bookmark.url);
        const isPending = pendingThumbnails.has(bookmark.id);

        return (
          <div
            key={bookmark.id}
            onClick={() =>
              window.open(bookmark.url, "_blank", "noopener,noreferrer")
            }
            className="group relative cursor-pointer bg-white rounded-xl border border-gray-100 overflow-hidden transition-all duration-200 hover:-translate-x-0.5"
            style={{ boxShadow: "0 1px 8px rgba(0,0,0,0.04)" }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow =
                "0 4px 20px rgba(7,144,232,0.1)";
              e.currentTarget.style.borderColor = "rgba(7,144,232,0.2)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = "0 1px 8px rgba(0,0,0,0.04)";
              e.currentTarget.style.borderColor = "#f1f5f9";
            }}
          >
            <div
              className="absolute left-0 top-0 bottom-0 w-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ background: "#0790e8" }}
            />

            <div className="flex items-center gap-4 px-5 py-3.5">
              <div className="relative flex-shrink-0 w-10 h-10 rounded-xl overflow-hidden bg-gradient-to-br from-slate-50 to-blue-50 border border-gray-100 flex items-center justify-center">
                {isPending && !bookmark.thumbnail_url ? (
                  <div className="absolute inset-0 bg-gradient-to-r from-slate-100 via-blue-50 to-slate-100 animate-pulse" />
                ) : (
                  <img
                    src={faviconSrc}
                    alt="Favicon"
                    className="w-6 h-6 object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                    loading="lazy"
                  />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <h3
                  className="font-semibold text-sm text-slate-800 group-hover:text-[#0790e8] transition-colors truncate"
                  style={{ fontFamily: "'Outfit', sans-serif" }}
                  title={bookmark.title}
                >
                  {bookmark.title}
                </h3>
                <p
                  className="text-xs text-slate-400 truncate mt-0.5 hover:underline cursor-copy"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigator.clipboard.writeText(bookmark.url);
                    toast.success("URL copied!");
                  }}
                >
                  {bookmark.url}
                </p>
              </div>

              <span
                className="hidden sm:block text-[10px] font-medium px-2.5 py-1 rounded-full flex-shrink-0"
                style={{ background: "rgba(7,144,232,0.06)", color: "#0790e8" }}
              >
                {new Date(bookmark.created_at).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })}
              </span>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  deleteBookmark(bookmark.id);
                }}
                className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444" }}
                title="Delete"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );

  const renderEmpty = () => (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-24 text-center"
    >
      <div
        className="w-20 h-20 rounded-2xl flex items-center justify-center mb-5"
        style={{ background: "rgba(7,144,232,0.07)" }}
      >
        <BookmarkX
          className="w-9 h-9"
          style={{ color: "#0790e8", opacity: 0.6 }}
        />
      </div>
      <h3
        className="text-xl font-bold text-slate-700 mb-1.5"
        style={{ fontFamily: "'Outfit', sans-serif" }}
      >
        No bookmarks yet
      </h3>
      <p className="text-sm text-slate-400">
        Add your first bookmark using the form above
      </p>
    </motion.div>
  );

  const renderNoResults = () => (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-24 text-center"
    >
      <div
        className="w-20 h-20 rounded-2xl flex items-center justify-center mb-5"
        style={{ background: "rgba(7,144,232,0.07)" }}
      >
        <Search
          className="w-9 h-9"
          style={{ color: "#0790e8", opacity: 0.6 }}
        />
      </div>
      <h3
        className="text-xl font-bold text-slate-700 mb-1.5"
        style={{ fontFamily: "'Outfit', sans-serif" }}
      >
        No results found
      </h3>
      <p className="text-sm text-slate-400">
        Nothing matching{" "}
        <span className="font-medium text-slate-600">"{state.searchTerm}"</span>
      </p>
    </motion.div>
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.25, duration: 0.4 }}
    >
      {/* View toggle */}
      <div className="flex items-center gap-2 mb-5">
        <div
          className="flex rounded-xl border border-gray-100 overflow-hidden bg-white p-1 gap-1"
          style={{ boxShadow: "0 1px 6px rgba(0,0,0,0.05)" }}
        >
          <button
            onClick={() => updateState({ viewMode: "grid" })}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200"
            style={{
              background: state.viewMode === "grid" ? "#0790e8" : "transparent",
              color: state.viewMode === "grid" ? "white" : "#94a3b8",
              fontFamily: "'Outfit', sans-serif",
            }}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            Grid
          </button>
          <button
            onClick={() => updateState({ viewMode: "list" })}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200"
            style={{
              background: state.viewMode === "list" ? "#0790e8" : "transparent",
              color: state.viewMode === "list" ? "white" : "#94a3b8",
              fontFamily: "'Outfit', sans-serif",
            }}
          >
            <List className="w-3.5 h-3.5" />
            List
          </button>
        </div>

        {state.totalCount > 0 && (
          <span className="text-xs text-slate-400 ml-1">
            {state.totalCount} bookmark{state.totalCount !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* Content */}
      <div className="mb-10">
        {fetching || state.loading
          ? renderSkeleton()
          : state.bookmarks.length === 0
            ? state.searchTerm
              ? renderNoResults()
              : renderEmpty()
            : state.viewMode === "grid"
              ? renderGridView()
              : renderListView()}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center justify-center gap-3 py-4"
        >
          <button
            onClick={() => updateState({ currentPage: state.currentPage - 1 })}
            disabled={!canGoPrev}
            className="w-9 h-9 flex items-center justify-center rounded-xl border border-gray-100 bg-white transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:border-[#0790e8]/30"
            style={{ boxShadow: "0 1px 6px rgba(0,0,0,0.05)" }}
          >
            <ChevronLeft className="w-4 h-4 text-slate-500" />
          </button>

          <div className="flex items-center gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((p) => Math.abs(p - state.currentPage) <= 2)
              .map((p) => (
                <button
                  key={p}
                  onClick={() => updateState({ currentPage: p })}
                  className="w-9 h-9 rounded-xl text-sm font-semibold transition-all"
                  style={{
                    background: p === state.currentPage ? "#0790e8" : "white",
                    color: p === state.currentPage ? "white" : "#64748b",
                    border: `1px solid ${p === state.currentPage ? "#0790e8" : "#f1f5f9"}`,
                    fontFamily: "'Outfit', sans-serif",
                  }}
                >
                  {p}
                </button>
              ))}
          </div>

          <button
            onClick={() => updateState({ currentPage: state.currentPage + 1 })}
            disabled={!canGoNext}
            className="w-9 h-9 flex items-center justify-center rounded-xl border border-gray-100 bg-white transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:border-[#0790e8]/30"
            style={{ boxShadow: "0 1px 6px rgba(0,0,0,0.05)" }}
          >
            <ChevronRight className="w-4 h-4 text-slate-500" />
          </button>
        </motion.div>
      )}
    </motion.div>
  );
}
