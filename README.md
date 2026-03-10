# Admin Panel — Supabase Integration Guide

This admin panel uses **Supabase** as the backend. Your MERN frontend can connect directly via the Supabase JS client to read, create, update, and delete all content managed from the admin panel.

---

## 🔑 Connection Details

```
SUPABASE_URL=https://xbnkgnhwaxsheutgnpia.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhibbmtnbmh3YXhzaGV1dGducGlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI5ODcwNDksImV4cCI6MjA4ODU2MzA0OX0.31YYIoXaftOAsio8Qewtd4wZTM0reb347zM1Az2mcYM
```

Add these to your MERN project's `.env` file.

---

## 📦 Install Supabase Client (in your MERN project)

```bash
npm install @supabase/supabase-js
```

Create `src/lib/supabase.js`:

```js
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY
);

export default supabase;
```

---

## 📊 Database Tables

### `page_sections` — All page content

| Column | Type | Description |
|---|---|---|
| `id` | uuid | Primary key |
| `page_id` | text | Page identifier (e.g. `homepage`, `about`) |
| `section_id` | text | Section slug (e.g. `hero-photo`, `showreel`) |
| `label` | text | Display name |
| `content_type` | text | `text` / `image` / `video` / `gallery` / `vimeo_url` |
| `text_value` | text | Text content or Vimeo URL |
| `media_url` | text | Single image/video URL |
| `media_urls` | text[] | Array of URLs for galleries |
| `sort_order` | integer | Display order |

### `media_files` — Uploaded media metadata

| Column | Type | Description |
|---|---|---|
| `id` | uuid | Primary key |
| `file_name` | text | Original filename |
| `file_path` | text | Storage path |
| `file_type` | text | `image` or `video` |
| `file_size` | bigint | Size in bytes |
| `mime_type` | text | MIME type |
| `storage_url` | text | Public CDN URL |

---

## 📖 READ — Fetch Content

```js
// All sections for a page
const { data } = await supabase
  .from('page_sections')
  .select('*')
  .eq('page_id', 'homepage')
  .order('sort_order');

// Single section
const { data } = await supabase
  .from('page_sections')
  .select('*')
  .eq('page_id', 'homepage')
  .eq('section_id', 'hero-photo')
  .single();

// All media files
const { data } = await supabase
  .from('media_files')
  .select('*')
  .order('created_at', { ascending: false });

// Only images
const { data } = await supabase
  .from('media_files')
  .select('*')
  .eq('file_type', 'image');
```

---

## ✏️ CREATE — Add Content (requires admin auth)

### Sign in as admin

```js
await supabase.auth.signInWithPassword({
  email: 'tmf@themakersfactory.com',
  password: 'your-admin-password',
});
```

### Add a section

```js
await supabase.from('page_sections').insert({
  page_id: 'homepage',
  section_id: 'behind-the-scenes',
  label: 'Behind The Scenes',
  content_type: 'gallery', // text | image | video | gallery | vimeo_url
  sort_order: 5,
  media_urls: [], // for galleries
});
```

### Upload a file

```js
const ext = file.name.split('.').pop();
const path = `homepage/hero/${Date.now()}.${ext}`;

// Upload to storage
await supabase.storage.from('media').upload(path, file, { upsert: true });

// Get public URL
const { data: { publicUrl } } = supabase.storage.from('media').getPublicUrl(path);

// Save metadata
await supabase.from('media_files').insert({
  file_name: file.name,
  file_path: path,
  file_type: file.type.startsWith('video') ? 'video' : 'image',
  file_size: file.size,
  mime_type: file.type,
  storage_url: publicUrl,
});
```

---

## 🔄 UPDATE — Edit Content

```js
// Update text
await supabase.from('page_sections')
  .update({ text_value: 'New text here' })
  .eq('id', sectionId);

// Replace image/video
await supabase.from('page_sections')
  .update({ media_url: newPublicUrl })
  .eq('id', sectionId);

// Add photo to gallery
const { data: section } = await supabase
  .from('page_sections').select('media_urls').eq('id', sectionId).single();
await supabase.from('page_sections')
  .update({ media_urls: [...(section.media_urls || []), newUrl] })
  .eq('id', sectionId);

// Remove photo from gallery by index
const urls = [...section.media_urls];
urls.splice(index, 1);
await supabase.from('page_sections')
  .update({ media_urls: urls })
  .eq('id', sectionId);
```

---

## 🗑️ DELETE — Remove Content

```js
// Delete a section
await supabase.from('page_sections').delete().eq('id', sectionId);

// Delete a media file (storage + database)
await supabase.storage.from('media').remove([filePath]);
await supabase.from('media_files').delete().eq('id', fileId);

// Delete all sections for a page
await supabase.from('page_sections').delete().eq('page_id', 'homepage');
```

---

## 🧩 React Hook (for your MERN frontend)

```jsx
import { useState, useEffect } from 'react';
import supabase from '../lib/supabase';

export const usePageContent = (pageId) => {
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from('page_sections').select('*')
      .eq('page_id', pageId).order('sort_order')
      .then(({ data }) => { setSections(data || []); setLoading(false); });
  }, [pageId]);

  const getSection = (id) => sections.find((s) => s.section_id === id);
  const getGallery = (id) => getSection(id)?.media_urls?.filter(Boolean) || [];

  return { sections, loading, getSection, getGallery };
};
```

---

## 📋 Available Page IDs

| Page ID | Description |
|---|---|
| `homepage` | Homepage |
| `about` | About page |
| `ad-commercials` | Ad commercials |
| `fashion-editorial` | Fashion editorial |
| `media-production` | Media production |
| `wedding-landing` | Wedding landing page |
| `wedding-photos` | Wedding photos |
| `wedding-films` | Wedding films |
| `wedding-stories` | Wedding stories/blog |

---

## 🔒 Security

- **Read** is public — no auth needed to fetch content.
- **Create/Update/Delete** requires admin authentication.
- Media files are served from a public CDN bucket.
┌─────────────────────┐         ┌──────────────────────────┐
│   TMF Admin Panel   │         │   MERN Frontend          │
│   (Lovable App)     │         │                          │
│                     │         │  React ← Express API     │
│  Admin uploads/     │         │              │           │
│  edits content ───► │         │              ▼           │
│                     │         │         MongoDB          │
│     ┌───────────┐   │  sync   │     (synced data)       │
│     │ Supabase  │───┼────────►│                          │
│     │ DB + CDN  │   │         │  Cron job runs every     │
│     └───────────┘   │         │  few minutes to sync     │
└─────────────────────┘         └──────────────────────────┘
```

---

## 🚀 Quick Start

### 1. Project Structure

```
tmf-frontend/
├── server/
│   ├── index.js
│   ├── .env
│   ├── models/
│   │   └── PageSection.js
│   ├── routes/
│   │   └── content.js
│   └── scripts/
│       └── syncContent.js
├── client/
│   ├── src/
│   │   ├── hooks/
│   │   │   └── usePageContent.js
│   │   ├── pages/
│   │   │   ├── HomePage.jsx
│   │   │   ├── AboutPage.jsx
│   │   │   ├── AdCommercialsPage.jsx
│   │   │   ├── FashionEditorialPage.jsx
│   │   │   ├── MediaProductionPage.jsx
│   │   │   ├── WeddingLandingPage.jsx
│   │   │   ├── WeddingPhotosPage.jsx
│   │   │   ├── WeddingFilmsPage.jsx
│   │   │   └── WeddingStoriesPage.jsx
│   │   └── App.jsx
│   └── package.json
└── package.json
```

### 2. Install Dependencies

```bash
# Server
cd server
npm init -y
npm install express cors mongoose axios dotenv node-cron

# Client
cd ../client
npx create-react-app . # or use Vite
npm install axios react-router-dom
```

### 3. Environment Variables

```env
# server/.env
MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/tmf-cms
PORT=5000
```

---

## 📦 Server Code

### MongoDB Model

```javascript
// server/models/PageSection.js
const mongoose = require("mongoose");

const pageSectionSchema = new mongoose.Schema(
  {
    supabase_id: { type: String, unique: true, required: true },
    page_id: { type: String, required: true, index: true },
    section_id: { type: String, required: true },
    label: { type: String },
    content_type: {
      type: String,
      enum: ["text", "image", "video", "gallery", "vimeo_url"],
    },
    text_value: { type: String, default: null },
    media_url: { type: String, default: null },
    media_urls: { type: [String], default: [] },
    sort_order: { type: Number, default: 0 },
    synced_at: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

pageSectionSchema.index({ page_id: 1, section_id: 1 }, { unique: true });

module.exports = mongoose.model("PageSection", pageSectionSchema);
```

### Sync Script

```javascript
// server/scripts/syncContent.js
const axios = require("axios");
const PageSection = require("../models/PageSection");

const SUPABASE_URL = "https://xbnkgnhwaxsheutgnpia.supabase.co/rest/v1";
const SUPABASE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhibbmtnbmh3YXhzaGV1dGducGlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI5ODcwNDksImV4cCI6MjA4ODU2MzA0OX0.31YYIoXaftOAsio8Qewtd4wZTM0reb347zM1Az2mcYM";

async function syncFromSupabase() {
  console.log("[Sync] Starting sync from Supabase...");

  try {
    const response = await axios.get(
      `${SUPABASE_URL}/page_sections?select=*&order=sort_order.asc`,
      {
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
        },
      }
    );

    const sections = response.data;
    console.log(`[Sync] Fetched ${sections.length} sections`);

    let updated = 0;
    let created = 0;

    for (const section of sections) {
      const result = await PageSection.findOneAndUpdate(
        { supabase_id: section.id },
        {
          supabase_id: section.id,
          page_id: section.page_id,
          section_id: section.section_id,
          label: section.label,
          content_type: section.content_type,
          text_value: section.text_value,
          media_url: section.media_url,
          media_urls: section.media_urls || [],
          sort_order: section.sort_order,
          synced_at: new Date(),
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );

      if (result.createdAt === result.updatedAt) created++;
      else updated++;
    }

    // Remove sections deleted from admin panel
    const supabaseIds = sections.map((s) => s.id);
    const deleteResult = await PageSection.deleteMany({
      supabase_id: { $nin: supabaseIds },
    });

    console.log(
      `[Sync] Complete: ${created} created, ${updated} updated, ${deleteResult.deletedCount} deleted`
    );
  } catch (error) {
    console.error("[Sync] Failed:", error.message);
  }
}

module.exports = syncFromSupabase;
```

### Express API Routes

```javascript
// server/routes/content.js
const express = require("express");
const PageSection = require("../models/PageSection");
const router = express.Router();

// GET /api/content/:pageId — All sections for a page
router.get("/:pageId", async (req, res) => {
  try {
    const sections = await PageSection.find({ page_id: req.params.pageId })
      .sort({ sort_order: 1 })
      .lean();
    res.json(sections);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch content" });
  }
});

// GET /api/content/:pageId/:sectionId — Single section
router.get("/:pageId/:sectionId", async (req, res) => {
  try {
    const section = await PageSection.findOne({
      page_id: req.params.pageId,
      section_id: req.params.sectionId,
    }).lean();
    res.json(section);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch section" });
  }
});

// POST /api/content/sync — Manually trigger sync
router.post("/sync", async (req, res) => {
  try {
    const syncFromSupabase = require("../scripts/syncContent");
    await syncFromSupabase();
    res.json({ success: true, message: "Sync complete" });
  } catch (error) {
    res.status(500).json({ error: "Sync failed" });
  }
});

module.exports = router;
```

### Express Server with Auto-Sync

```javascript
// server/index.js
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const cron = require("node-cron");
const contentRoutes = require("./routes/content");
const syncFromSupabase = require("./scripts/syncContent");

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/content", contentRoutes);

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", synced: true });
});

// Connect to MongoDB & start server
mongoose
  .connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log("✅ Connected to MongoDB");

    // Initial sync on startup
    await syncFromSupabase();

    // Auto-sync every 2 minutes
    cron.schedule("*/2 * * * *", () => {
      console.log("[Cron] Running scheduled sync...");
      syncFromSupabase();
    });

    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("❌ MongoDB connection failed:", err.message);
  });
```

---

## ⚛️ React Frontend

### Content Hook

```javascript
// client/src/hooks/usePageContent.js
import { useState, useEffect } from "react";
import axios from "axios";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

export function usePageContent(pageId) {
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    const fetchContent = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data } = await axios.get(`${API_URL}/content/${pageId}`);
        if (!cancelled) setSections(data);
      } catch (err) {
        if (!cancelled) setError(err.message);
      }
      if (!cancelled) setLoading(false);
    };

    fetchContent();
    return () => { cancelled = true; };
  }, [pageId]);

  const getSection = (sectionId) =>
    sections.find((s) => s.section_id === sectionId);

  const getGallery = (sectionId) => {
    const section = getSection(sectionId);
    return section?.media_urls?.filter(Boolean) || [];
  };

  return { sections, loading, error, getSection, getGallery };
}
```

### Homepage Example

```jsx
// client/src/pages/HomePage.jsx
import React from "react";
import { usePageContent } from "../hooks/usePageContent";

const HomePage = () => {
  const { loading, getSection } = usePageContent("homepage");

  if (loading) return <div className="loader">Loading...</div>;

  const showreel = getSection("showreel");

  return (
    <div>
      {/* Hero Showreel */}
      {showreel?.media_url && (
        <section className="hero">
          <video
            src={showreel.media_url}
            autoPlay muted loop playsInline
            style={{ width: "100%", height: "100vh", objectFit: "cover" }}
          />
        </section>
      )}

      {/* About Section — 4 Images */}
      <section className="about-grid">
        {["about-corner-1", "about-corner-2", "about-corner-3", "about-corner-4"].map((id) => {
          const s = getSection(id);
          return s?.media_url ? (
            <img key={id} src={s.media_url} alt={s.label} />
          ) : null;
        })}
      </section>

      {/* Work Categories */}
      <section className="work-grid">
        {["work-ad-commercials", "work-fashion-editorial", "work-fine-art-weddings", "work-media-production"].map((id) => {
          const s = getSection(id);
          return s?.media_url ? (
            <div key={id} className="work-card">
              <img src={s.media_url} alt={s.label} />
              <h3>{s.label}</h3>
            </div>
          ) : null;
        })}
      </section>
    </div>
  );
};

export default HomePage;
```

### Wedding Landing Example

```jsx
// client/src/pages/WeddingLandingPage.jsx
import React from "react";
import { usePageContent } from "../hooks/usePageContent";

const WeddingLandingPage = () => {
  const { loading, getSection, getGallery } = usePageContent("wedding-landing");

  if (loading) return <div className="loader">Loading...</div>;

  const showreel = getSection("showreel");
  const featuredPhotos = getGallery("featured-stories");
  const weddingPhotos = getGallery("photography");

  return (
    <div>
      {/* Showreel */}
      {showreel?.media_url && (
        <video src={showreel.media_url} autoPlay muted loop playsInline />
      )}

      {/* About Us Images */}
      <section className="about-us">
        {["about-1", "about-2"].map((id) => {
          const s = getSection(id);
          return s?.media_url ? <img key={id} src={s.media_url} alt={s.label} /> : null;
        })}
      </section>

      {/* Featured Stories Gallery */}
      <section className="gallery">
        <h2>Featured Stories</h2>
        <div className="gallery-grid">
          {featuredPhotos.map((url, i) => (
            <img key={i} src={url} alt={`Featured ${i + 1}`} />
          ))}
        </div>
      </section>

      {/* Wedding Photography */}
      <section className="gallery">
        <h2>Wedding Photography</h2>
        <div className="gallery-grid">
          {weddingPhotos.map((url, i) => (
            <img key={i} src={url} alt={`Photo ${i + 1}`} />
          ))}
        </div>
      </section>

      {/* Vimeo Videos */}
      <section className="vimeo-section">
        <h2>Inspired By Cinema</h2>
        {["vimeo-1", "vimeo-2", "vimeo-3", "vimeo-4"].map((id) => {
          const s = getSection(id);
          return s?.text_value ? (
            <iframe
              key={id}
              src={s.text_value}
              width="100%"
              height="400"
              frameBorder="0"
              allow="autoplay; fullscreen"
              title={s.label}
            />
          ) : null;
        })}
      </section>
    </div>
  );
};

export default WeddingLandingPage;
```

---

## 📋 All Page IDs & Section IDs

### Homepage (`homepage`)
| Section ID              | Type    | Description              |
| ----------------------- | ------- | ------------------------ |
| `showreel`              | video   | Main showreel video      |
| `about-corner-1` to `4` | image   | About section images     |
| `work-ad-commercials`   | image   | Work thumbnail           |
| `work-fashion-editorial`| image   | Work thumbnail           |
| `work-fine-art-weddings`| image   | Work thumbnail           |
| `work-media-production` | image   | Work thumbnail           |

### About (`about`)
| Section ID    | Type    | Description      |
| ------------- | ------- | ---------------- |
| `hero-title`  | text    | Page title       |
| `hero-desc`   | text    | Description      |
| `about-images`| gallery | About images     |

### Ad Commercials (`ad-commercials`)
| Section ID           | Type  | Description     |
| -------------------- | ----- | --------------- |
| `luxury-brand`       | image | Project preview |
| `tech-product`       | image | Project preview |
| `fashion-collection` | image | Project preview |
| `automotive`         | image | Project preview |
| `lifestyle`          | image | Project preview |
| `corporate`          | image | Project preview |

### Fashion Editorial (`fashion-editorial`)
| Section ID        | Type    | Description         |
| ----------------- | ------- | ------------------- |
| `editorial-1`-`5` | image   | Editorial images    |
| `showcase-images` | gallery | Showcase 1-6        |

### Media Production (`media-production`)
| Section ID        | Type  | Description            |
| ----------------- | ----- | ---------------------- |
| `project-showcase`| video | Showcase video         |
| `still-1` to `4`  | image | Production stills      |
| `color-graded`    | image | Color graded image     |
| `final-trailer`   | video | Final trailer          |

### Wedding Landing (`wedding-landing`)
| Section ID        | Type      | Description             |
| ----------------- | --------- | ----------------------- |
| `showreel`        | video     | Wedding showreel        |
| `about-1`, `about-2` | image | About images            |
| `featured-stories`| gallery   | 6 featured images       |
| `films-showreel`  | video     | Films showreel          |
| `photography`     | gallery   | 6 photo images          |
| `vimeo-1` to `4`  | vimeo_url | Vimeo URLs              |

### Wedding Photos (`wedding-photos`)
| Section ID  | Type    | Description   |
| ----------- | ------- | ------------- |
| `hero-title`| text    | Page title    |
| `gallery`   | gallery | Photo gallery |

### Wedding Films (`wedding-films`)
| Section ID     | Type    | Description   |
| -------------- | ------- | ------------- |
| `hero-title`   | text    | Page title    |
| `films-gallery`| gallery | Films gallery |

### Wedding Stories (`wedding-stories`)
| Section ID  | Type    | Description   |
| ----------- | ------- | ------------- |
| `hero-title`| text    | Page title    |
| `stories`   | gallery | Blog posts    |

---

## 🔒 Admin Panel Access

| Field    | Value                        |
| -------- | ---------------------------- |
| URL      | `[LOVABLE_APP_URL]/admin`    |
| Email    | `tmf@themakersfactory.com`   |
| Password | `themakersfactory`           |

---

## 📌 Important Notes

1. **Media URLs are hosted on Supabase CDN** — images/videos uploaded via admin panel are served from `https://xbnkgnhwaxsheutgnpia.supabase.co/storage/v1/object/public/media/...`. Your MERN frontend just uses these URLs directly in `<img>` and `<video>` tags.

2. **Sync frequency** — The cron runs every 2 minutes. You can change `*/2 * * * *` to `*/5 * * * *` (5 min) or `*/1 * * * *` (1 min) depending on how fast you need changes to reflect.

3. **Manual sync** — Hit `POST /api/content/sync` to trigger an immediate sync after making admin changes.

4. **No media duplication** — MongoDB stores only the URLs pointing to Supabase Storage. Actual files stay on Supabase CDN. No need to download/re-host files.
