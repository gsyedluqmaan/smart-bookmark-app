# Bookmark Manager

A full-stack bookmark manager built with **Next.js** and **Supabase**. Save, search, and organize your bookmarks with automatic page screenshots, real-time sync across tabs, and a clean grid/list UI.

---

## Features

- Real-time sync across browser tabs
- Grid and list view modes
- Search bookmarks by title or URL
- Pagination (10 per page)
- Add bookmarks with automatic screenshot thumbnails via Microlink
- Persistent storage with Supabase (Postgres + RLS)

---

## Tech Stack

- **Next.js 14** (App Router)
- **Supabase** (Auth, Postgres, Realtime, Row Level Security)
- **Tailwind CSS** (styling)
- **Microlink API** (screenshot thumbnails)

---

## Setup

### 1. Clone and install

```bash
git clone <your-repo-url>
cd bookmark-manager
npm install
```

### 2. Environment variables

Create a `.env.local` file:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Database setup

The Supabase UI can be tricky for finding certain features (more on that below), so the most reliable approach is to run the following SQL directly in the **Supabase SQL Editor**:

```sql
-- Create bookmarks table
create table bookmarks (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  url text not null,
  thumbnail_url text,
  created_at timestamptz default now() not null
);

-- Enable Row Level Security
alter table bookmarks enable row level security;

-- Policies: users can only access their own bookmarks
create policy "Users can select their own bookmarks"
  on bookmarks for select
  using (auth.uid() = user_id);

create policy "Users can insert their own bookmarks"
  on bookmarks for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own bookmarks"
  on bookmarks for update
  using (auth.uid() = user_id);

create policy "Users can delete their own bookmarks"
  on bookmarks for delete
  using (auth.uid() = user_id);

-- Enable Realtime
alter publication supabase_realtime add table bookmarks;
```

> **Note:** The last line is what enables real-time events for the table. See the challenges section below for why this was done via SQL rather than the UI.

### 4. Run the app

```bash
npm run dev
```

---

## Challenges & How I Solved Them

### 1. Finding the Realtime toggle in Supabase UI

**Problem:** Supabase has a per-table toggle to enable Realtime, but it's buried deep in the UI and not easy to locate. After spending time navigating through the Table Editor and Database settings without success, I was blocked.

**Solution:** Skipped the UI entirely and enabled Realtime directly via SQL in the Supabase SQL Editor:

```sql
alter publication supabase_realtime add table bookmarks;
```

---

### 2. Realtime not syncing across tabs

**Problem:** The Supabase Realtime subscription was set, but adding a bookmark in one tab had no effect in another open tab. The events were firing correctly on the server side, but the UI wasn't updating.

**Solution:**

- Moved `init` directly inside `useEffect(() => { ... }, [])` with empty deps so it runs exactly once and holds a single stable channel
- Switched all realtime event handlers to use `setState(prev => ...)` functional updates, which always receive the latest state regardless of when the closure was created

---

### 3. Infinite re-render loop

**Problem:** The component was continuously re-rendering in a tight loop, hammering the database with repeated fetch requests.

**Root cause:** A chain of `useCallback` dependencies created a cycle:

1. `backfillThumbnails` depended on `state.bookmarks`
2. `fetchBookmarks` depended on `backfillThumbnails`
3. After fetching, `updateState({ bookmarks })` changed `state.bookmarks`
4. Which rebuilt `backfillThumbnails` → rebuilt `fetchBookmarks` → the `useEffect` fired again → back to step 3

**Solution:** Introduced a `bookmarksRef` that always mirrors the current bookmarks array. `backfillThumbnails` reads from the ref instead of closing over `state.bookmarks`, which removes it from the dependency chain entirely:

```ts
const bookmarksRef = useRef<Bookmark[]>(state.bookmarks);
useEffect(() => {
  bookmarksRef.current = state.bookmarks;
}, [state.bookmarks]);

const backfillThumbnails = useCallback(async (bookmarks) => {
  // ...
  updateState({
    bookmarks: bookmarksRef.current.map(...), // ref, not closure
  });
}, [updateState]); // stable — no loop
```

---

### 4. Thumbnails not persisting to the database

**Problem:** Thumbnails were generated and displayed in the UI, but on every fresh page load cards would shimmer indefinitely and re-fetch — because `thumbnail_url` was never actually written to the database when a bookmark was first created.

**Root cause:** The original insert in `BookmarkForm` simply omitted `thumbnail_url`:

```ts
// Before — thumbnail_url missing from insert
await supabase.from("bookmarks").insert([{ title, url, user_id }]);
```

So every load needed to backfill the value from scratch.

**Solution:** Generate the Microlink URL at insert time and include it in the DB write. Building the URL is a pure string operation — no network call required — so there's zero cost to doing it upfront:

```ts
const thumbnail_url = getMicrolinkScreenshot(formattedURL);

await supabase
  .from("bookmarks")
  .insert([{ title, url, user_id, thumbnail_url }]);
```

New bookmarks now have their thumbnail URL in the DB from creation. The backfill in `BookmarksView` still runs for older rows that pre-date this fix.

---

## 📁 Project Structure

```
├── app/
│   └── bookmarks/
│       └── page.tsx           # Bookmarks (auth, state, realtime)
├── components/
│   ├── BookmarkForm.tsx        # Add bookmark form + search bar
│   ├── BookmarksView.tsx       # Grid/list view, pagination, thumbnails
│   └── Header.tsx              # App header
└── lib/
    └── supabase.ts             # Supabase client
```

---
