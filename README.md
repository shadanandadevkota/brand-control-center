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
