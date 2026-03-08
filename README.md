# TMF Admin Panel — MERN Stack Frontend Integration Guide

## Overview

This admin panel manages all content (text, images, videos) for the TMF Studios website. The admin panel stores content in **Lovable Cloud** (PostgreSQL + Supabase Storage). Your **MERN stack frontend** can integrate in two ways:

1. **Direct Read** — Your React frontend reads directly from the Supabase REST API (simplest)
2. **Sync to MongoDB** — An Express API syncs content from Supabase → MongoDB periodically

Both approaches are documented below. **Option 1 is recommended** for simplicity.

---

## 🔑 Supabase API Details

Your MERN app can read content using simple HTTP requests — **no Supabase SDK needed**.

### Base URL

```
https://xbnkgnhwaxsheutgnpia.supabase.co/rest/v1
```

### API Key (Publishable — safe for frontend)

```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhibbmtnbmh3YXhzaGV1dGducGlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI5ODcwNDksImV4cCI6MjA4ODU2MzA0OX0.31YYIoXaftOAsio8Qewtd4wZTM0reb347zM1Az2mcYM
```

---

## Option 1: Direct REST API (Recommended)

No MongoDB needed. Your React frontend fetches content with plain `fetch()` or `axios`.

### Express Backend Route (Node.js)

```javascript
// server/routes/content.js
const express = require("express");
const axios = require("axios");
const router = express.Router();

const SUPABASE_URL = "https://xbnkgnhwaxsheutgnpia.supabase.co/rest/v1";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhibbmtnbmh3YXhzaGV1dGducGlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI5ODcwNDksImV4cCI6MjA4ODU2MzA0OX0.31YYIoXaftOAsio8Qewtd4wZTM0reb347zM1Az2mcYM";

const supabaseHeaders = {
  apikey: SUPABASE_KEY,
  Authorization: `Bearer ${SUPABASE_KEY}`,
};

// GET /api/content/:pageId — Fetch all sections for a page
router.get("/:pageId", async (req, res) => {
  try {
    const { pageId } = req.params;
    const response = await axios.get(
      `${SUPABASE_URL}/page_sections?page_id=eq.${pageId}&order=sort_order.asc`,
      { headers: supabaseHeaders }
    );
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch content" });
  }
});

// GET /api/content/:pageId/:sectionId — Fetch a specific section
router.get("/:pageId/:sectionId", async (req, res) => {
  try {
    const { pageId, sectionId } = req.params;
    const response = await axios.get(
      `${SUPABASE_URL}/page_sections?page_id=eq.${pageId}&section_id=eq.${sectionId}`,
      { headers: supabaseHeaders }
    );
    res.json(response.data[0] || null);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch section" });
  }
});

module.exports = router;
```

### Express Server Setup

```javascript
// server/index.js
const express = require("express");
const cors = require("cors");
const contentRoutes = require("./routes/content");

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/content", contentRoutes);

app.listen(5000, () => console.log("Server running on port 5000"));
```

### React Frontend Hook

```jsx
// client/src/hooks/usePageContent.js
import { useState, useEffect } from "react";
import axios from "axios";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

export function usePageContent(pageId) {
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchContent = async () => {
      setLoading(true);
      try {
        const { data } = await axios.get(`${API_URL}/content/${pageId}`);
        setSections(data);
      } catch (error) {
        console.error("Failed to fetch page content:", error);
      }
      setLoading(false);
    };
    fetchContent();
  }, [pageId]);

  const getSection = (sectionId) =>
    sections.find((s) => s.section_id === sectionId);

  return { sections, loading, getSection };
}
```

### React Component Example

```jsx
// client/src/pages/HomePage.jsx
import { usePageContent } from "../hooks/usePageContent";

const HomePage = () => {
  const { sections, loading, getSection } = usePageContent("homepage");

  if (loading) return <div className="loading">Loading...</div>;

  const showreel = getSection("showreel");
  const aboutCorner1 = getSection("about-corner-1");
  const aboutCorner2 = getSection("about-corner-2");
  const aboutCorner3 = getSection("about-corner-3");
  const aboutCorner4 = getSection("about-corner-4");

  return (
    <div>
      {/* Showreel */}
      {showreel?.media_url && (
        <video src={showreel.media_url} autoPlay muted loop playsInline />
      )}

      {/* About Section */}
      <div className="about-grid">
        {[aboutCorner1, aboutCorner2, aboutCorner3, aboutCorner4].map(
          (corner, i) =>
            corner?.media_url && (
              <img key={i} src={corner.media_url} alt={`About ${i + 1}`} />
            )
        )}
      </div>
    </div>
  );
};

export default HomePage;
```

---

## Option 2: Sync to MongoDB

If you prefer keeping all data in MongoDB, set up a sync job.

### MongoDB Schema

```javascript
// server/models/PageSection.js
const mongoose = require("mongoose");

const pageSectionSchema = new mongoose.Schema({
  supabase_id: { type: String, unique: true },
  page_id: { type: String, required: true, index: true },
  section_id: { type: String, required: true },
  label: String,
  content_type: {
    type: String,
    enum: ["text", "image", "video", "gallery", "vimeo_url"],
  },
  text_value: String,
  media_url: String,
  media_urls: [String],
  sort_order: { type: Number, default: 0 },
  updated_at: Date,
});

pageSectionSchema.index({ page_id: 1, section_id: 1 }, { unique: true });

module.exports = mongoose.model("PageSection", pageSectionSchema);
```

### Sync Script

```javascript
// server/scripts/syncContent.js
const axios = require("axios");
const mongoose = require("mongoose");
const PageSection = require("../models/PageSection");

const SUPABASE_URL = "https://xbnkgnhwaxsheutgnpia.supabase.co/rest/v1";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhibbmtnbmh3YXhzaGV1dGducGlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI5ODcwNDksImV4cCI6MjA4ODU2MzA0OX0.31YYIoXaftOAsio8Qewtd4wZTM0reb347zM1Az2mcYM";

async function syncContent() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB");

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
    console.log(`Fetched ${sections.length} sections from Supabase`);

    for (const section of sections) {
      await PageSection.findOneAndUpdate(
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
          updated_at: section.updated_at,
        },
        { upsert: true, new: true }
      );
    }

    console.log("Sync complete!");
    await mongoose.disconnect();
  } catch (error) {
    console.error("Sync failed:", error.message);
  }
}

syncContent();
```

### Run Sync Periodically (cron or webhook)

```bash
# Add to package.json scripts
"sync": "node server/scripts/syncContent.js"

# Run manually
npm run sync

# Or use cron (every 5 minutes)
*/5 * * * * cd /your-project && npm run sync
```

### Express Routes for MongoDB

```javascript
// server/routes/content.js (MongoDB version)
const express = require("express");
const PageSection = require("../models/PageSection");
const router = express.Router();

router.get("/:pageId", async (req, res) => {
  try {
    const sections = await PageSection.find({ page_id: req.params.pageId })
      .sort({ sort_order: 1 });
    res.json(sections);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch content" });
  }
});

router.get("/:pageId/:sectionId", async (req, res) => {
  try {
    const section = await PageSection.findOne({
      page_id: req.params.pageId,
      section_id: req.params.sectionId,
    });
    res.json(section);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch section" });
  }
});

module.exports = router;
```

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

## 📋 Section IDs per Page

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
| Section ID    | Type    | Description              |
| ------------- | ------- | ------------------------ |
| `hero-title`  | text    | Page title               |
| `hero-desc`   | text    | Page description         |
| `about-images`| gallery | About images             |

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

## 🚀 Quick Start (MERN)

### 1. Install dependencies

```bash
# Backend
cd server
npm install express cors axios mongoose dotenv

# Frontend
cd client
npm install axios react-router-dom
```

### 2. Environment variables

```env
# server/.env
MONGODB_URI=mongodb+srv://your-connection-string
PORT=5000
```

### 3. Start the app

```bash
# Terminal 1 - Backend
cd server && npm start

# Terminal 2 - Frontend
cd client && npm start
```

### 4. Fetch content in any page

```jsx
import { usePageContent } from "../hooks/usePageContent";

const AnyPage = () => {
  const { getSection, loading } = usePageContent("PAGE_ID_HERE");
  if (loading) return <div>Loading...</div>;

  const myImage = getSection("SECTION_ID_HERE");
  return myImage?.media_url ? <img src={myImage.media_url} /> : null;
};
```

---

## 🔒 Security Notes

- The API key used is a **publishable anon key** — safe for frontend/backend use
- Read access is public — anyone can read page content (intentional for public website)
- Write access is admin-only — only the admin panel can modify content
- Media URLs are publicly accessible (hosted on Supabase Storage)

---

## 📞 Admin Panel Access

- **URL:** `[YOUR_LOVABLE_APP_URL]/admin`
- **Email:** `tmf@themakersfactory.com`
- **Password:** `themakersfactory`

---

## 🛠 Architecture

```
┌─────────────────────┐         ┌──────────────────────┐
│   TMF Admin Panel   │         │   MERN Frontend      │
│   (Lovable App)     │         │                      │
│                     │         │  React ← Express API │
│  Uploads/Edits ───► │         │         │            │
│                     │         │         ▼            │
│         ┌───────────┤         │  Option 1: REST call │
│         │ Supabase  │◄────────│  to Supabase API     │
│         │ Database  │         │                      │
│         │ + Storage │         │  Option 2: MongoDB   │
│         └───────────┤         │  (synced from        │
│                     │         │   Supabase)          │
└─────────────────────┘         └──────────────────────┘
```
