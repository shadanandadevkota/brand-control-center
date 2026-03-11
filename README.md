# TMF Admin Panel — Frontend Integration Guide

This admin panel manages all your website content (text, images, videos, galleries). Your frontend (React, Next.js, or any JS framework) connects to the **same Supabase backend** to read content and display it live.

---

## 🚀 Step-by-Step Setup Guide

### Step 1: Install Supabase Client in Your Frontend

```bash
npm install @supabase/supabase-js
```

### Step 2: Create `.env` File in Your Frontend Root

Create a `.env` file in your frontend project root:

```env
VITE_SUPABASE_URL=https://xbnkgnhwaxsheutgnpia.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhibmtnbmh3YXhzaGV1dGducGlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI5ODcwNDksImV4cCI6MjA4ODU2MzA0OX0.31YYIoXaftOAsio8Qewtd4wZTM0reb347zM1Az2mcYM
```

> ⚠️ These are **publishable/anon keys** — safe to use in frontend code. They only allow **reading** public data.

### Step 3: Create the Supabase Client

Create `src/lib/supabase.js` (or `.ts`) in your frontend project:

```js
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default supabase;
```

> 💡 If you're using **Next.js** (not Vite), replace `import.meta.env.VITE_*` with `process.env.NEXT_PUBLIC_*` and rename the env vars accordingly.

### Step 4: Create the `usePageContent` Hook

Create `src/hooks/usePageContent.js`:

```jsx
import { useState, useEffect } from "react";
import supabase from "../lib/supabase";

export const usePageContent = (pageId) => {
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSections = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("page_sections")
        .select("*")
        .eq("page_id", pageId)
        .order("sort_order");

      if (!error) setSections(data || []);
      setLoading(false);
    };

    fetchSections();
  }, [pageId]);

  // Get a specific section by its section_id
  const getSection = (sectionId) =>
    sections.find((s) => s.section_id === sectionId);

  // Get gallery URLs for a section (filters out empty strings)
  const getGallery = (sectionId) =>
    getSection(sectionId)?.media_urls?.filter(Boolean) || [];

  return { sections, loading, getSection, getGallery };
};
```

### Step 5: Use in Your Page Components

Here's a **complete example** showing how to render every content type:

```jsx
import { usePageContent } from "../hooks/usePageContent";

const Homepage = () => {
  const { sections, loading, getSection, getGallery } =
    usePageContent("homepage");

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div>
      {sections.map((section) => (
        <div key={section.id} className="section">
          <h2>{section.label}</h2>

          {/* TEXT */}
          {section.content_type === "text" && (
            <p>{section.text_value}</p>
          )}

          {/* IMAGE */}
          {section.content_type === "image" && section.media_url && (
            <img src={section.media_url} alt={section.label} />
          )}

          {/* VIDEO (MP4) */}
          {section.content_type === "video" && section.media_url && (
            <video src={section.media_url} controls />
          )}

          {/* VIMEO URL */}
          {section.content_type === "vimeo_url" && section.text_value && (
            <iframe
              src={section.text_value}
              width="100%"
              height="400"
              frameBorder="0"
              allow="autoplay; fullscreen"
              allowFullScreen
            />
          )}

          {/* GALLERY */}
          {section.content_type === "gallery" && (
            <div className="gallery-grid">
              {section.media_urls
                ?.filter(Boolean)
                .map((url, i) => (
                  <img key={i} src={url} alt={`${section.label} ${i + 1}`} />
                ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default Homepage;
```

---

## 📂 Where to Put Each File

```
your-frontend-project/
├── .env                          ← Step 2: Supabase credentials
├── src/
│   ├── lib/
│   │   └── supabase.js           ← Step 3: Supabase client
│   ├── hooks/
│   │   └── usePageContent.js     ← Step 4: Data fetching hook
│   └── pages/
│       ├── Homepage.jsx          ← Step 5: Your page components
│       ├── About.jsx
│       ├── AdCommercials.jsx
│       ├── FashionEditorial.jsx
│       ├── MediaProduction.jsx
│       ├── WeddingLanding.jsx
│       ├── WeddingPhotos.jsx
│       ├── WeddingFilms.jsx
│       └── WeddingStories.jsx
```

---

## 📋 Page IDs — Use These in `usePageContent()`

| Page ID             | Admin Panel Page       | Your Frontend Page      |
| ------------------- | ---------------------- | ----------------------- |
| `homepage`          | Homepage               | `Homepage.jsx`          |
| `about`             | About Page             | `About.jsx`             |
| `ad-commercials`    | Ad Commercials         | `AdCommercials.jsx`     |
| `fashion-editorial` | Fashion Editorial      | `FashionEditorial.jsx`  |
| `media-production`  | Media Production       | `MediaProduction.jsx`   |
| `wedding-landing`   | Wedding Landing Page   | `WeddingLanding.jsx`    |
| `wedding-photos`    | Wedding Photos         | `WeddingPhotos.jsx`     |
| `wedding-films`     | Wedding Films          | `WeddingFilms.jsx`      |
| `wedding-stories`   | Wedding Stories        | `WeddingStories.jsx`    |

---

## 📊 Database Tables

### `page_sections` — All page content

| Column         | Type     | Description                                           |
| -------------- | -------- | ----------------------------------------------------- |
| `id`           | uuid     | Primary key                                           |
| `page_id`      | text     | Page identifier (e.g. `homepage`, `about`)            |
| `section_id`   | text     | Section slug (e.g. `hero-photo`, `showreel`)          |
| `label`        | text     | Display name                                          |
| `content_type` | text     | `text` / `image` / `video` / `gallery` / `vimeo_url`  |
| `text_value`   | text     | Text content or Vimeo embed URL                       |
| `media_url`    | text     | Single image/video URL (from storage)                 |
| `media_urls`   | text[]   | Array of URLs for galleries                           |
| `sort_order`   | integer  | Display order (ascending)                             |

### `media_files` — Uploaded media metadata

| Column        | Type   | Description        |
| ------------- | ------ | ------------------ |
| `id`          | uuid   | Primary key        |
| `file_name`   | text   | Original filename  |
| `file_path`   | text   | Storage path       |
| `file_type`   | text   | `image` or `video` |
| `file_size`   | bigint | Size in bytes      |
| `mime_type`    | text   | MIME type          |
| `storage_url` | text   | Public CDN URL     |

---

## 📖 How to READ Content (No Auth Needed)

```js
import supabase from "./lib/supabase";

// All sections for a page (ordered)
const { data } = await supabase
  .from("page_sections")
  .select("*")
  .eq("page_id", "homepage")
  .order("sort_order");

// Single specific section
const { data } = await supabase
  .from("page_sections")
  .select("*")
  .eq("page_id", "homepage")
  .eq("section_id", "hero-photo")
  .single();

// All media files
const { data } = await supabase
  .from("media_files")
  .select("*")
  .order("created_at", { ascending: false });

// Only images
const { data } = await supabase
  .from("media_files")
  .select("*")
  .eq("file_type", "image");
```

---

## 🔄 Complete Flow: Admin Panel → Frontend

```
┌─────────────────────┐         ┌──────────────────┐         ┌─────────────────┐
│   ADMIN PANEL       │         │   SUPABASE       │         │   YOUR FRONTEND │
│   (This Project)    │────────▶│   (Database +    │◀────────│   (Your React   │
│                     │  WRITE  │    Storage)       │  READ   │    Website)     │
│                     │         │                  │         │                 │
│  • Add sections     │         │  • page_sections │         │  • Fetch data   │
│  • Upload photos    │         │  • media_files   │         │  • Display it   │
│  • Edit text        │         │  • media bucket  │         │  • Auto-updates │
│  • Delete content   │         │                  │         │                 │
└─────────────────────┘         └──────────────────┘         └─────────────────┘
```

1. **Admin** logs into this panel → adds/edits/deletes content
2. **Content** is saved to the Supabase database & media storage
3. **Your Frontend** reads from the **same database** using the hook above
4. **Changes appear on refresh** (or use realtime — see below)

---

## ⚡ Optional: Realtime Updates (Live Changes Without Refresh)

Want content to update on your frontend **instantly** when you make changes in the admin panel?

```js
import { useEffect, useState } from "react";
import supabase from "../lib/supabase";

export const useRealtimePageContent = (pageId) => {
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Initial fetch
    const fetchData = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("page_sections")
        .select("*")
        .eq("page_id", pageId)
        .order("sort_order");
      setSections(data || []);
      setLoading(false);
    };

    fetchData();

    // Listen for live changes
    const channel = supabase
      .channel(`page-${pageId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "page_sections",
          filter: `page_id=eq.${pageId}`,
        },
        () => {
          // Re-fetch on any change
          supabase
            .from("page_sections")
            .select("*")
            .eq("page_id", pageId)
            .order("sort_order")
            .then(({ data }) => setSections(data || []));
        }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [pageId]);

  const getSection = (id) => sections.find((s) => s.section_id === id);
  const getGallery = (id) => getSection(id)?.media_urls?.filter(Boolean) || [];

  return { sections, loading, getSection, getGallery };
};
```

**Usage** — just swap the hook:
```jsx
// Instead of:
const { sections, loading } = usePageContent("homepage");

// Use:
const { sections, loading } = useRealtimePageContent("homepage");
```

---

## 🔒 Security

| Action               | Auth Required? |
| -------------------- | -------------- |
| **Read** content     | ❌ No          |
| **Create** content   | ✅ Admin only  |
| **Update** content   | ✅ Admin only  |
| **Delete** content   | ✅ Admin only  |

Your frontend only needs **read** access — no authentication required.

---

## 🛠️ Quick Checklist

- [ ] Install `@supabase/supabase-js` in your frontend
- [ ] Create `.env` with `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
- [ ] Create `src/lib/supabase.js` with the client setup
- [ ] Create `src/hooks/usePageContent.js` hook
- [ ] Use `usePageContent("homepage")` in your page components
- [ ] Render sections based on `content_type` (text, image, video, vimeo_url, gallery)
- [ ] (Optional) Use `useRealtimePageContent()` for live updates

---

## 💡 Example: Specific Section by ID

If you created a section called "Hero Photo" in the admin panel for the homepage, its `section_id` will be `hero-photo`. Fetch it like this:

```jsx
const { getSection } = usePageContent("homepage");
const hero = getSection("hero-photo");

// hero.media_url → the uploaded image URL
// hero.text_value → any text content
// hero.content_type → "image", "text", "video", etc.
```

---

## 🔑 Your Supabase Credentials (for reference)

| Key              | Value                                                  |
| ---------------- | ------------------------------------------------------ |
| **Project URL**  | `https://xbnkgnhwaxsheutgnpia.supabase.co`             |
| **Anon Key**     | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhibmtnbmh3YXhzaGV1dGducGlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI5ODcwNDksImV4cCI6MjA4ODU2MzA0OX0.31YYIoXaftOAsio8Qewtd4wZTM0reb347zM1Az2mcYM` |

> These are the **same credentials** used by the admin panel. Your frontend reads from the same database.

---

© TMF Studios. All rights reserved.
