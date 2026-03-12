# TMF Admin Panel — Frontend Integration Guide

This admin panel manages all your website content (text, images, videos, galleries). Your frontend (React, Next.js, or any JS framework) connects to the **same database** to read content and display it live.

---

## 🚀 Step-by-Step Setup Guide

### Step 1: Install Dependencies

```bash
npm install @supabase/supabase-js react-router-dom
```

### Step 2: Create `.env` File in Your Frontend Root

```env
VITE_SUPABASE_URL=https://xbnkgnhwaxsheutgnpia.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhibmtnbmh3YXhzaGV1dGducGlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI5ODcwNDksImV4cCI6MjA4ODU2MzA0OX0.31YYIoXaftOAsio8Qewtd4wZTM0reb347zM1Az2mcYM
```

> ⚠️ These are **publishable/anon keys** — safe for frontend use. They only allow **reading** public data.

> 💡 **Next.js users:** Use `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` instead.

---

### Step 3: Create the Supabase Client

Create **`src/lib/supabase.js`**:

```js
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default supabase;
```

> 💡 **Next.js version:**
> ```js
> const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
> const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
> ```

---

### Step 4: Create the `usePageContent` Hook

Create **`src/hooks/usePageContent.js`**:

```jsx
import { useState, useEffect } from "react";
import supabase from "../lib/supabase";

export const usePageContent = (pageId) => {
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSections = async () => {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from("page_sections")
        .select("*")
        .eq("page_id", pageId)
        .order("sort_order");

      if (fetchError) {
        setError(fetchError.message);
        setSections([]);
      } else {
        setSections(data || []);
      }
      setLoading(false);
    };

    if (pageId) fetchSections();
  }, [pageId]);

  // Get a specific section by its section_id
  const getSection = (sectionId) =>
    sections.find((s) => s.section_id === sectionId);

  // Get text value from a section
  const getText = (sectionId) => getSection(sectionId)?.text_value || "";

  // Get media URL from a section
  const getMedia = (sectionId) => getSection(sectionId)?.media_url || "";

  // Get gallery URLs (filters out empty strings)
  const getGallery = (sectionId) =>
    getSection(sectionId)?.media_urls?.filter(Boolean) || [];

  // Get content type of a section
  const getType = (sectionId) => getSection(sectionId)?.content_type || "";

  return { sections, loading, error, getSection, getText, getMedia, getGallery, getType };
};
```

---

### Step 5: Create the Realtime Hook (Optional — Live Updates)

Create **`src/hooks/useRealtimePageContent.js`**:

```jsx
import { useEffect, useState } from "react";
import supabase from "../lib/supabase";

export const useRealtimePageContent = (pageId) => {
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);

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

  useEffect(() => {
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
        () => fetchData() // Re-fetch on any change
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [pageId]);

  const getSection = (id) => sections.find((s) => s.section_id === id);
  const getText = (id) => getSection(id)?.text_value || "";
  const getMedia = (id) => getSection(id)?.media_url || "";
  const getGallery = (id) => getSection(id)?.media_urls?.filter(Boolean) || [];

  return { sections, loading, getSection, getText, getMedia, getGallery };
};
```

---

### Step 6: Create a Reusable Section Renderer Component

Create **`src/components/SectionRenderer.jsx`**:

```jsx
const SectionRenderer = ({ section }) => {
  if (!section) return null;

  switch (section.content_type) {
    case "text":
      return <p>{section.text_value}</p>;

    case "image":
      return section.media_url ? (
        <img
          src={section.media_url}
          alt={section.label}
          loading="lazy"
          style={{ maxWidth: "100%", height: "auto" }}
        />
      ) : null;

    case "video":
      return section.media_url ? (
        <video
          src={section.media_url}
          controls
          playsInline
          style={{ maxWidth: "100%", height: "auto" }}
        />
      ) : null;

    case "vimeo_url":
      return section.text_value ? (
        <div style={{ position: "relative", paddingBottom: "56.25%", height: 0 }}>
          <iframe
            src={section.text_value}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              border: 0,
            }}
            allow="autoplay; fullscreen; picture-in-picture"
            allowFullScreen
            title={section.label}
          />
        </div>
      ) : null;

    case "gallery":
      return (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
            gap: "1rem",
          }}
        >
          {section.media_urls
            ?.filter(Boolean)
            .map((url, i) => (
              <img
                key={i}
                src={url}
                alt={`${section.label} ${i + 1}`}
                loading="lazy"
                style={{ width: "100%", height: "auto", borderRadius: "8px" }}
              />
            ))}
        </div>
      );

    default:
      return null;
  }
};

export default SectionRenderer;
```

---

## 📄 Complete Page Components

### Homepage.jsx

```jsx
import { usePageContent } from "../hooks/usePageContent";
import SectionRenderer from "../components/SectionRenderer";

const Homepage = () => {
  const { sections, loading, getSection, getText, getMedia, getGallery } =
    usePageContent("homepage");

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div>
      {/* OPTION A: Render ALL sections dynamically */}
      {sections.map((section) => (
        <div key={section.id} className="section">
          <h2>{section.label}</h2>
          <SectionRenderer section={section} />
        </div>
      ))}

      {/* OPTION B: Render specific sections by section_id */}
      {/* 
        <div className="hero">
          <img src={getMedia("hero-photo")} alt="Hero" />
        </div>
        <div className="intro">
          <p>{getText("intro-text")}</p>
        </div>
        <div className="gallery">
          {getGallery("portfolio-gallery").map((url, i) => (
            <img key={i} src={url} alt={`Portfolio ${i + 1}`} />
          ))}
        </div>
      */}
    </div>
  );
};

export default Homepage;
```

### About.jsx

```jsx
import { usePageContent } from "../hooks/usePageContent";
import SectionRenderer from "../components/SectionRenderer";

const About = () => {
  const { sections, loading } = usePageContent("about");

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h1>About Us</h1>
      {sections.map((section) => (
        <div key={section.id}>
          <h2>{section.label}</h2>
          <SectionRenderer section={section} />
        </div>
      ))}
    </div>
  );
};

export default About;
```

### AdCommercials.jsx

```jsx
import { usePageContent } from "../hooks/usePageContent";
import SectionRenderer from "../components/SectionRenderer";

const AdCommercials = () => {
  const { sections, loading } = usePageContent("ad-commercials");

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h1>Ad Commercials</h1>
      {sections.map((section) => (
        <div key={section.id}>
          <h2>{section.label}</h2>
          <SectionRenderer section={section} />
        </div>
      ))}
    </div>
  );
};

export default AdCommercials;
```

### FashionEditorial.jsx

```jsx
import { usePageContent } from "../hooks/usePageContent";
import SectionRenderer from "../components/SectionRenderer";

const FashionEditorial = () => {
  const { sections, loading } = usePageContent("fashion-editorial");

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h1>Fashion Editorial</h1>
      {sections.map((section) => (
        <div key={section.id}>
          <h2>{section.label}</h2>
          <SectionRenderer section={section} />
        </div>
      ))}
    </div>
  );
};

export default FashionEditorial;
```

### MediaProduction.jsx

```jsx
import { usePageContent } from "../hooks/usePageContent";
import SectionRenderer from "../components/SectionRenderer";

const MediaProduction = () => {
  const { sections, loading } = usePageContent("media-production");

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h1>Media Production</h1>
      {sections.map((section) => (
        <div key={section.id}>
          <h2>{section.label}</h2>
          <SectionRenderer section={section} />
        </div>
      ))}
    </div>
  );
};

export default MediaProduction;
```

### WeddingLanding.jsx

```jsx
import { usePageContent } from "../hooks/usePageContent";
import SectionRenderer from "../components/SectionRenderer";

const WeddingLanding = () => {
  const { sections, loading } = usePageContent("wedding-landing");

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h1>Wedding</h1>
      {sections.map((section) => (
        <div key={section.id}>
          <h2>{section.label}</h2>
          <SectionRenderer section={section} />
        </div>
      ))}
    </div>
  );
};

export default WeddingLanding;
```

### WeddingPhotos.jsx

```jsx
import { usePageContent } from "../hooks/usePageContent";
import SectionRenderer from "../components/SectionRenderer";

const WeddingPhotos = () => {
  const { sections, loading } = usePageContent("wedding-photos");

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h1>Wedding Photos</h1>
      {sections.map((section) => (
        <div key={section.id}>
          <h2>{section.label}</h2>
          <SectionRenderer section={section} />
        </div>
      ))}
    </div>
  );
};

export default WeddingPhotos;
```

### WeddingFilms.jsx

```jsx
import { usePageContent } from "../hooks/usePageContent";
import SectionRenderer from "../components/SectionRenderer";

const WeddingFilms = () => {
  const { sections, loading } = usePageContent("wedding-films");

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h1>Wedding Films</h1>
      {sections.map((section) => (
        <div key={section.id}>
          <h2>{section.label}</h2>
          <SectionRenderer section={section} />
        </div>
      ))}
    </div>
  );
};

export default WeddingFilms;
```

### WeddingStories.jsx

```jsx
import { usePageContent } from "../hooks/usePageContent";
import SectionRenderer from "../components/SectionRenderer";

const WeddingStories = () => {
  const { sections, loading } = usePageContent("wedding-stories");

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h1>Wedding Stories</h1>
      {sections.map((section) => (
        <div key={section.id}>
          <h2>{section.label}</h2>
          <SectionRenderer section={section} />
        </div>
      ))}
    </div>
  );
};

export default WeddingStories;
```

---

### React Router Setup — `App.jsx`

```jsx
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Homepage from "./pages/Homepage";
import About from "./pages/About";
import AdCommercials from "./pages/AdCommercials";
import FashionEditorial from "./pages/FashionEditorial";
import MediaProduction from "./pages/MediaProduction";
import WeddingLanding from "./pages/WeddingLanding";
import WeddingPhotos from "./pages/WeddingPhotos";
import WeddingFilms from "./pages/WeddingFilms";
import WeddingStories from "./pages/WeddingStories";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Homepage />} />
        <Route path="/about" element={<About />} />
        <Route path="/ad-commercials" element={<AdCommercials />} />
        <Route path="/fashion-editorial" element={<FashionEditorial />} />
        <Route path="/media-production" element={<MediaProduction />} />
        <Route path="/wedding" element={<WeddingLanding />} />
        <Route path="/wedding/photos" element={<WeddingPhotos />} />
        <Route path="/wedding/films" element={<WeddingFilms />} />
        <Route path="/wedding/stories" element={<WeddingStories />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
```

---

## 📂 Complete File Structure

```
your-frontend-project/
├── .env
├── src/
│   ├── lib/
│   │   └── supabase.js
│   ├── hooks/
│   │   ├── usePageContent.js
│   │   └── useRealtimePageContent.js    (optional)
│   ├── components/
│   │   └── SectionRenderer.jsx
│   ├── pages/
│   │   ├── Homepage.jsx
│   │   ├── About.jsx
│   │   ├── AdCommercials.jsx
│   │   ├── FashionEditorial.jsx
│   │   ├── MediaProduction.jsx
│   │   ├── WeddingLanding.jsx
│   │   ├── WeddingPhotos.jsx
│   │   ├── WeddingFilms.jsx
│   │   └── WeddingStories.jsx
│   └── App.jsx
```

---

## 📋 Page IDs Reference

| Page ID             | Admin Panel Page       | Frontend Route          |
| ------------------- | ---------------------- | ----------------------- |
| `homepage`          | Homepage               | `/`                     |
| `about`             | About Page             | `/about`                |
| `ad-commercials`    | Ad Commercials         | `/ad-commercials`       |
| `fashion-editorial` | Fashion Editorial      | `/fashion-editorial`    |
| `media-production`  | Media Production       | `/media-production`     |
| `wedding-landing`   | Wedding Landing Page   | `/wedding`              |
| `wedding-photos`    | Wedding Photos         | `/wedding/photos`       |
| `wedding-films`     | Wedding Films          | `/wedding/films`        |
| `wedding-stories`   | Wedding Stories        | `/wedding/stories`      |

---

## 📊 Database Schema

### `page_sections` — All page content

| Column         | Type     | Description                                           |
| -------------- | -------- | ----------------------------------------------------- |
| `id`           | uuid     | Primary key                                           |
| `page_id`      | text     | Page identifier (e.g. `homepage`, `about`)            |
| `section_id`   | text     | Section slug (e.g. `hero-photo`, `showreel`)          |
| `label`        | text     | Display name                                          |
| `content_type` | text     | `text` / `image` / `video` / `gallery` / `vimeo_url`  |
| `text_value`   | text     | Text content or Vimeo embed URL                       |
| `media_url`    | text     | Single image/video URL (file upload or direct link)   |
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

## 📖 Quick Query Examples

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

## 🔄 How It Works: Admin Panel → Frontend

```
┌─────────────────────┐         ┌──────────────────┐         ┌─────────────────┐
│   ADMIN PANEL       │         │   DATABASE +     │         │   YOUR FRONTEND │
│   (This Project)    │────────▶│   STORAGE        │◀────────│   (Your React   │
│                     │  WRITE  │                  │  READ   │    Website)     │
│  • Add sections     │         │  • page_sections │         │  • Fetch data   │
│  • Upload photos    │         │  • media_files   │         │  • Display it   │
│  • Paste URLs       │         │  • media bucket  │         │  • Auto-updates │
│  • Edit text        │         │                  │         │                 │
└─────────────────────┘         └──────────────────┘         └─────────────────┘
```

1. **Admin** logs into this panel → adds/edits/deletes content (file upload OR link)
2. **Content** is saved to the database & media storage
3. **Your Frontend** reads from the **same database** using the hooks above
4. **Changes appear on refresh** (or instantly with the realtime hook)

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

- [ ] `npm install @supabase/supabase-js react-router-dom`
- [ ] Create `.env` with credentials
- [ ] Create `src/lib/supabase.js`
- [ ] Create `src/hooks/usePageContent.js`
- [ ] Create `src/components/SectionRenderer.jsx`
- [ ] Create page components (Homepage, About, etc.)
- [ ] Set up routes in `App.jsx`
- [ ] (Optional) Add `useRealtimePageContent.js` for live updates

---

## 💡 Advanced: Targeting Specific Sections

Instead of rendering all sections, target specific ones by their `section_id`:

```jsx
const { getText, getMedia, getGallery } = usePageContent("homepage");

// Use in your custom layout:
<h1>{getText("hero-title")}</h1>
<img src={getMedia("hero-photo")} alt="Hero" />
<p>{getText("about-intro")}</p>

{getGallery("portfolio").map((url, i) => (
  <img key={i} src={url} alt={`Work ${i + 1}`} />
))}
```

This lets you build fully custom layouts while keeping content editable from the admin panel.

---

© TMF Studios. All rights reserved.
