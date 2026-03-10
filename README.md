# TMF Admin Panel — Frontend Integration Guide

This admin panel manages all your website content (text, images, videos, galleries). Your frontend (React, Next.js, or any JS framework) connects directly to the same backend to **read** content and display it live.

---

## 🚀 Step-by-Step Setup Guide

### Step 1: Install Supabase Client in Your Frontend

```bash
npm install @supabase/supabase-js
```

### Step 2: Create the Supabase Client

Create a file `src/lib/supabase.js` (or `.ts`) in your frontend project:

```js
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://xbnkgnhwaxsheutgnpia.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhibbmtnbmh3YXhzaGV1dGducGlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI5ODcwNDksImV4cCI6MjA4ODU2MzA0OX0.31YYIoXaftOAsio8Qewtd4wZTM0reb347zM1Az2mcYM";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default supabase;
```

> ⚠️ These are **publishable keys** — safe to use in frontend code. They only allow **reading** public data.

### Step 3: Create a React Hook to Fetch Page Content

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

  // Helper: get a specific section by its section_id
  const getSection = (sectionId) =>
    sections.find((s) => s.section_id === sectionId);

  // Helper: get gallery URLs for a section
  const getGallery = (sectionId) =>
    getSection(sectionId)?.media_urls?.filter(Boolean) || [];

  return { sections, loading, getSection, getGallery };
};
```

### Step 4: Use It in Your Pages

```jsx
import { usePageContent } from "../hooks/usePageContent";

const Homepage = () => {
  const { sections, loading, getSection, getGallery } =
    usePageContent("homepage");

  if (loading) return <div>Loading...</div>;

  const hero = getSection("hero-photo");
  const galleryPhotos = getGallery("gallery");

  return (
    <div>
      {/* Hero Section */}
      {hero && (
        <div className="hero">
          {hero.content_type === "image" && (
            <img src={hero.media_url} alt={hero.label} />
          )}
          {hero.content_type === "text" && <h1>{hero.text_value}</h1>}
          {hero.content_type === "video" && (
            <video src={hero.media_url} autoPlay muted loop />
          )}
          {hero.content_type === "vimeo_url" && (
            <iframe src={hero.text_value} allowFullScreen />
          )}
        </div>
      )}

      {/* Gallery Section */}
      {galleryPhotos.length > 0 && (
        <div className="gallery-grid">
          {galleryPhotos.map((url, i) => (
            <img key={i} src={url} alt={`Gallery ${i + 1}`} />
          ))}
        </div>
      )}

      {/* Render ALL sections dynamically */}
      {sections.map((section) => (
        <div key={section.id}>
          <h2>{section.label}</h2>
          {section.content_type === "text" && <p>{section.text_value}</p>}
          {section.content_type === "image" && (
            <img src={section.media_url} alt={section.label} />
          )}
          {section.content_type === "video" && (
            <video src={section.media_url} controls />
          )}
          {section.content_type === "vimeo_url" && (
            <iframe src={section.text_value} allowFullScreen />
          )}
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

## 📋 Available Page IDs

Use these `page_id` values when calling `usePageContent()`:

| Page ID             | Description            |
| ------------------- | ---------------------- |
| `homepage`          | Homepage               |
| `about`             | About page             |
| `ad-commercials`    | Ad commercials         |
| `fashion-editorial` | Fashion editorial      |
| `media-production`  | Media production       |
| `wedding-landing`   | Wedding landing page   |
| `wedding-photos`    | Wedding photos         |
| `wedding-films`     | Wedding films          |
| `wedding-stories`   | Wedding stories / blog |

---

## 📊 Database Tables

### `page_sections` — All page content

| Column         | Type     | Description                                       |
| -------------- | -------- | ------------------------------------------------- |
| `id`           | uuid     | Primary key                                       |
| `page_id`      | text     | Page identifier (e.g. `homepage`, `about`)        |
| `section_id`   | text     | Section slug (e.g. `hero-photo`, `showreel`)      |
| `label`        | text     | Display name                                      |
| `content_type` | text     | `text` / `image` / `video` / `gallery` / `vimeo_url` |
| `text_value`   | text     | Text content or Vimeo URL                         |
| `media_url`    | text     | Single image/video URL                            |
| `media_urls`   | text[]   | Array of URLs for galleries                       |
| `sort_order`   | integer  | Display order                                     |

### `media_files` — Uploaded media metadata

| Column        | Type   | Description       |
| ------------- | ------ | ----------------- |
| `id`          | uuid   | Primary key       |
| `file_name`   | text   | Original filename |
| `file_path`   | text   | Storage path      |
| `file_type`   | text   | `image` or `video`|
| `file_size`   | bigint | Size in bytes     |
| `mime_type`    | text   | MIME type         |
| `storage_url` | text   | Public CDN URL    |

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

## 🔄 How It Works (Admin → Frontend Flow)

```
┌─────────────────────┐         ┌──────────────────┐         ┌─────────────────┐
│   ADMIN PANEL       │         │   LOVABLE CLOUD  │         │   YOUR FRONTEND │
│   (This Project)    │────────▶│   (Database +    │◀────────│   (Your React   │
│                     │  WRITE  │    Storage)       │  READ   │    Website)     │
│  • Add sections     │         │                  │         │                 │
│  • Upload photos    │         │  • page_sections │         │  • Fetch data   │
│  • Edit text        │         │  • media_files   │         │  • Display it   │
│  • Delete content   │         │  • media bucket  │         │  • Auto-updates │
└─────────────────────┘         └──────────────────┘         └─────────────────┘
```

1. **Admin** logs into this panel → adds/edits/deletes content
2. **Content** is saved to the database & media storage
3. **Frontend** reads from the same database using the hook
4. **Changes appear instantly** on refresh (or use realtime for live updates)

---

## ⚡ Optional: Realtime Updates (Live Changes)

Want content to update on your frontend **without refreshing**? Use Supabase Realtime:

```js
import { useEffect, useState } from "react";
import supabase from "../lib/supabase";

export const useRealtimePageContent = (pageId) => {
  const [sections, setSections] = useState([]);

  useEffect(() => {
    // Initial fetch
    supabase
      .from("page_sections")
      .select("*")
      .eq("page_id", pageId)
      .order("sort_order")
      .then(({ data }) => setSections(data || []));

    // Listen for changes
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

  return { sections, getSection, getGallery };
};
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
- [ ] Create `src/lib/supabase.js` with the credentials above
- [ ] Create `src/hooks/usePageContent.js` hook
- [ ] Use `usePageContent("homepage")` in your page components
- [ ] Render sections based on `content_type`
- [ ] (Optional) Add realtime updates for live changes

---

© TMF Studios. All rights reserved.
