# TMF Admin Panel — Frontend Integration Guide

## Overview

This admin panel manages all content (text, images, videos) for the TMF Studios website. Content is stored in a **Lovable Cloud** database and media files in **Cloud Storage**. Your frontend reads from the same database to display live content.

---

## 🔑 Connection Details

### Supabase Client Setup

Install the Supabase client in your frontend project:

```bash
npm install @supabase/supabase-js
```

Create a Supabase client file (e.g., `src/lib/supabase.ts`):

```typescript
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://xbnkgnhwaxsheutgnpia.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhibbmtnbmh3YXhzaGV1dGducGlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI5ODcwNDksImV4cCI6MjA4ODU2MzA0OX0.31YYIoXaftOAsio8Qewtd4wZTM0reb347zM1Az2mcYM";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
```

> **Note:** The anon key is a **publishable** key — safe to use in frontend code.

---

## 📦 Database Schema

### `page_sections` Table

This is the main table your frontend reads from. Each row represents one editable section on a page.

| Column         | Type       | Description                                      |
| -------------- | ---------- | ------------------------------------------------ |
| `id`           | UUID       | Primary key                                      |
| `page_id`      | TEXT       | Which page this section belongs to                |
| `section_id`   | TEXT       | Unique identifier for the section within the page |
| `label`        | TEXT       | Human-readable label (for admin UI)               |
| `content_type` | TEXT       | `text`, `image`, `video`, `gallery`, `vimeo_url`  |
| `text_value`   | TEXT       | Text content (for `text` and `vimeo_url` types)   |
| `media_url`    | TEXT       | Single media URL (for `image` and `video` types)  |
| `media_urls`   | TEXT[]     | Array of URLs (for `gallery` type)                |
| `sort_order`   | INTEGER    | Display order within the page                     |
| `created_at`   | TIMESTAMPTZ| Creation timestamp                                |
| `updated_at`   | TIMESTAMPTZ| Last update timestamp                             |

### `media_files` Table

Central media library. You typically don't query this from the frontend — use `page_sections` instead.

---

## 📄 Page IDs Reference

| Page ID              | Page Name              |
| -------------------- | ---------------------- |
| `homepage`           | Homepage               |
| `about`              | About Page             |
| `ad-commercials`     | Ad Commercials         |
| `fashion-editorial`  | Fashion Editorial      |
| `media-production`   | Media Production       |
| `wedding-landing`    | Wedding Landing Page   |
| `wedding-photos`     | Wedding Photos         |
| `wedding-films`      | Wedding Films          |
| `wedding-stories`    | Wedding Stories / Blog |

---

## 🔌 Frontend Integration Examples

### 1. Fetch All Sections for a Page

```typescript
import { supabase } from "@/lib/supabase";

async function getPageContent(pageId: string) {
  const { data, error } = await supabase
    .from("page_sections")
    .select("*")
    .eq("page_id", pageId)
    .order("sort_order", { ascending: true });

  if (error) throw error;
  return data;
}
```

### 2. Fetch a Specific Section

```typescript
async function getSection(pageId: string, sectionId: string) {
  const { data, error } = await supabase
    .from("page_sections")
    .select("*")
    .eq("page_id", pageId)
    .eq("section_id", sectionId)
    .single();

  if (error) throw error;
  return data;
}
```

### 3. React Hook Example

```typescript
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type PageSection = {
  id: string;
  page_id: string;
  section_id: string;
  label: string;
  content_type: string;
  text_value: string | null;
  media_url: string | null;
  media_urls: string[] | null;
  sort_order: number;
};

export function usePageContent(pageId: string) {
  const [sections, setSections] = useState<PageSection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchContent = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("page_sections")
        .select("*")
        .eq("page_id", pageId)
        .order("sort_order");

      if (data) setSections(data);
      setLoading(false);
    };

    fetchContent();
  }, [pageId]);

  return { sections, loading };
}
```

### 4. Helper to Get a Section by ID

```typescript
export function useSection(pageId: string, sectionId: string) {
  const { sections, loading } = usePageContent(pageId);
  const section = sections.find((s) => s.section_id === sectionId);
  return { section, loading };
}
```

---

## 🏠 Homepage Integration Example

```tsx
import { usePageContent } from "@/hooks/usePageContent";

const HomePage = () => {
  const { sections, loading } = usePageContent("homepage");

  if (loading) return <div>Loading...</div>;

  const getSection = (id: string) => sections.find((s) => s.section_id === id);

  const showreel = getSection("showreel");
  const aboutCorner1 = getSection("about-corner-1");
  const aboutCorner2 = getSection("about-corner-2");
  const aboutCorner3 = getSection("about-corner-3");
  const aboutCorner4 = getSection("about-corner-4");
  const workAd = getSection("work-ad-commercials");
  const workFashion = getSection("work-fashion-editorial");
  const workWeddings = getSection("work-fine-art-weddings");
  const workMedia = getSection("work-media-production");

  return (
    <div>
      {/* Showreel Video */}
      {showreel?.media_url && (
        <video src={showreel.media_url} autoPlay muted loop />
      )}

      {/* About Section - 4 Corner Images */}
      <div className="grid grid-cols-2">
        {aboutCorner1?.media_url && <img src={aboutCorner1.media_url} alt="About 1" />}
        {aboutCorner2?.media_url && <img src={aboutCorner2.media_url} alt="About 2" />}
        {aboutCorner3?.media_url && <img src={aboutCorner3.media_url} alt="About 3" />}
        {aboutCorner4?.media_url && <img src={aboutCorner4.media_url} alt="About 4" />}
      </div>

      {/* Work Section */}
      <div className="grid grid-cols-2">
        {workAd?.media_url && <img src={workAd.media_url} alt="Ad Commercials" />}
        {workFashion?.media_url && <img src={workFashion.media_url} alt="Fashion Editorial" />}
        {workWeddings?.media_url && <img src={workWeddings.media_url} alt="Weddings" />}
        {workMedia?.media_url && <img src={workMedia.media_url} alt="Media Production" />}
      </div>
    </div>
  );
};
```

---

## 💒 Wedding Landing Page Example

```tsx
const WeddingPage = () => {
  const { sections, loading } = usePageContent("wedding-landing");

  const getSection = (id: string) => sections.find((s) => s.section_id === id);

  const showreel = getSection("showreel");
  const featuredStories = getSection("featured-stories");
  const photography = getSection("photography");
  const vimeo1 = getSection("vimeo-1");
  const vimeo2 = getSection("vimeo-2");
  const vimeo3 = getSection("vimeo-3");
  const vimeo4 = getSection("vimeo-4");

  return (
    <div>
      {/* Showreel */}
      {showreel?.media_url && (
        <video src={showreel.media_url} autoPlay muted loop />
      )}

      {/* Featured Stories Gallery */}
      <div className="grid grid-cols-3">
        {featuredStories?.media_urls?.map((url, i) => (
          <img key={i} src={url} alt={`Featured ${i + 1}`} />
        ))}
      </div>

      {/* Wedding Photography Gallery */}
      <div className="grid grid-cols-3">
        {photography?.media_urls?.map((url, i) => (
          <img key={i} src={url} alt={`Photo ${i + 1}`} />
        ))}
      </div>

      {/* Vimeo Videos */}
      {[vimeo1, vimeo2, vimeo3, vimeo4].map((v, i) =>
        v?.text_value ? (
          <iframe
            key={i}
            src={v.text_value}
            width="100%"
            height="400"
            allow="autoplay; fullscreen"
          />
        ) : null
      )}
    </div>
  );
};
```

---

## 📋 Section IDs per Page — Quick Reference

### Homepage (`homepage`)

| Section ID              | Type    | Description              |
| ----------------------- | ------- | ------------------------ |
| `showreel`              | video   | Main showreel video      |
| `about-corner-1` to `4` | image   | About section images     |
| `work-ad-commercials`   | image   | Work category thumbnail  |
| `work-fashion-editorial`| image   | Work category thumbnail  |
| `work-fine-art-weddings`| image   | Work category thumbnail  |
| `work-media-production` | image   | Work category thumbnail  |

### Media Production (`media-production`)

| Section ID        | Type  | Description             |
| ----------------- | ----- | ----------------------- |
| `project-showcase`| video | Project showcase video  |
| `still-1` to `4`  | image | Production stills       |
| `color-graded`    | image | Color graded image      |
| `final-trailer`   | video | Final output trailer    |

### Ad Commercials (`ad-commercials`)

| Section ID           | Type  | Description        |
| -------------------- | ----- | ------------------ |
| `luxury-brand`       | image | Project preview    |
| `tech-product`       | image | Project preview    |
| `fashion-collection` | image | Project preview    |
| `automotive`         | image | Project preview    |
| `lifestyle`          | image | Project preview    |
| `corporate`          | image | Project preview    |

### Fashion Editorial (`fashion-editorial`)

| Section ID        | Type    | Description          |
| ----------------- | ------- | -------------------- |
| `editorial-1`-`5` | image   | Editorial images     |
| `showcase-images` | gallery | Showcase images 1-6  |

### Wedding Landing (`wedding-landing`)

| Section ID        | Type      | Description                |
| ----------------- | --------- | -------------------------- |
| `showreel`        | video     | Wedding showreel           |
| `about-1`, `about-2` | image | About us images            |
| `featured-stories`| gallery   | 6 featured story images    |
| `films-showreel`  | video     | Cinematic films showreel   |
| `photography`     | gallery   | 6 photography images       |
| `vimeo-1` to `4`  | vimeo_url | Vimeo embed URLs           |

### About (`about`)

| Section ID    | Type    | Description                         |
| ------------- | ------- | ----------------------------------- |
| `hero-title`  | text    | Page title                          |
| `hero-desc`   | text    | Page description                    |
| `about-images`| gallery | About images (same as homepage)     |

### Wedding Photos (`wedding-photos`)

| Section ID  | Type    | Description    |
| ----------- | ------- | -------------- |
| `hero-title`| text    | Page title     |
| `gallery`   | gallery | Photo gallery  |

### Wedding Films (`wedding-films`)

| Section ID     | Type    | Description    |
| -------------- | ------- | -------------- |
| `hero-title`   | text    | Page title     |
| `films-gallery`| gallery | Films gallery  |

### Wedding Stories (`wedding-stories`)

| Section ID  | Type    | Description    |
| ----------- | ------- | -------------- |
| `hero-title`| text    | Page title     |
| `stories`   | gallery | Blog posts     |

---

## ⚡ Real-Time Updates (Optional)

To get live updates when admin changes content:

```typescript
useEffect(() => {
  const channel = supabase
    .channel("page-changes")
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "page_sections",
        filter: `page_id=eq.${pageId}`,
      },
      () => {
        // Refetch content when admin makes changes
        fetchContent();
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}, [pageId]);
```

---

## 🔒 Security Notes

- **Frontend uses the anon (publishable) key** — safe to expose in client code
- **Read access is public** — anyone can read page content (intentional for a public website)
- **Write access is admin-only** — only authenticated users with the `admin` role can modify content
- **Storage is public** — uploaded media files are publicly accessible via URL

---

## 📞 Admin Panel Access

- **URL:** `/admin`
- **Email:** `tmf@themakersfactory.com`
- **Password:** `themakersfactory`

---

## 🛠 Tech Stack

| Component     | Technology                    |
| ------------- | ----------------------------- |
| Frontend      | React + Vite + TypeScript     |
| Styling       | Tailwind CSS + shadcn/ui      |
| Backend       | Lovable Cloud (Supabase)      |
| Database      | PostgreSQL                    |
| Storage       | Supabase Storage              |
| Auth          | Supabase Auth (email/password)|
