import { useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Save } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import SectionCard from "@/components/admin/SectionCard";
import AddSectionDialog from "@/components/admin/AddSectionDialog";

type Section = {
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

const pageTitles: Record<string, { title: string; description: string }> = {
  homepage: { title: "Homepage", description: "Manage homepage content and media" },
  about: { title: "About Page", description: "Edit about page content" },
  "ad-commercials": { title: "Ad Commercials", description: "Manage ad commercial projects" },
  "fashion-editorial": { title: "Fashion Editorial", description: "Manage fashion editorial content" },
  "media-production": { title: "Media Production", description: "Manage media production page" },
  "wedding-landing": { title: "Wedding Landing Page", description: "Manage wedding landing page" },
  "wedding-photos": { title: "Wedding Photos", description: "Manage wedding photos content" },
  "wedding-films": { title: "Wedding Films", description: "Manage wedding films content" },
  "wedding-stories": { title: "Wedding Stories", description: "Manage wedding blog posts" },
};

const PageEditor = () => {
  const { pageId } = useParams<{ pageId: string }>();
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadingSection, setUploadingSection] = useState<string | null>(null);
  const meta = pageTitles[pageId || ""] || { title: "Page", description: "" };

  useEffect(() => {
    fetchSections();
  }, [pageId]);

  const fetchSections = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("page_sections")
      .select("*")
      .eq("page_id", pageId || "")
      .order("sort_order");
    if (!error && data) setSections(data as Section[]);
    setLoading(false);
  };

  const handleTextUpdate = (sectionId: string, value: string) => {
    setSections((prev) =>
      prev.map((s) => (s.id === sectionId ? { ...s, text_value: value } : s))
    );
  };

  const handleSave = async () => {
    try {
      for (const section of sections) {
        const { error } = await supabase
          .from("page_sections")
          .update({
            text_value: section.text_value,
            media_url: section.media_url,
            media_urls: section.media_urls,
          })
          .eq("id", section.id);
        if (error) throw error;
      }
      toast.success(`${meta.title} saved successfully`);
    } catch {
      toast.error("Failed to save changes");
    }
  };

  const handleFileUpload = async (sectionId: string, file: File, galleryIndex?: number) => {
    setUploadingSection(sectionId);
    try {
      const ext = file.name.split(".").pop();
      const path = `${pageId}/${sectionId}/${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("media")
        .upload(path, file, { upsert: true });
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from("media").getPublicUrl(path);

      const fileType = file.type.startsWith("video") ? "video" : "image";
      await supabase.from("media_files").insert({
        file_name: file.name,
        file_path: path,
        file_type: fileType,
        file_size: file.size,
        mime_type: file.type,
        storage_url: publicUrl,
      });

      if (galleryIndex !== undefined) {
        setSections((prev) =>
          prev.map((s) => {
            if (s.id === sectionId) {
              const urls = [...(s.media_urls || [])];
              urls[galleryIndex] = publicUrl;
              return { ...s, media_urls: urls };
            }
            return s;
          })
        );
      } else {
        setSections((prev) =>
          prev.map((s) => (s.id === sectionId ? { ...s, media_url: publicUrl } : s))
        );
      }
      toast.success("File uploaded successfully");
    } catch (error: any) {
      toast.error(error.message || "Upload failed");
    } finally {
      setUploadingSection(null);
    }
  };

  const handleDeleteSection = async (sectionId: string) => {
    try {
      const { error } = await supabase.from("page_sections").delete().eq("id", sectionId);
      if (error) throw error;
      setSections((prev) => prev.filter((s) => s.id !== sectionId));
      toast.success("Section deleted");
    } catch {
      toast.error("Failed to delete section");
    }
  };

  const handleAddSection = async (label: string, contentType: string) => {
    try {
      const sectionId = label.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
      const maxOrder = sections.length > 0 ? Math.max(...sections.map((s) => s.sort_order)) : 0;

      const { data, error } = await supabase
        .from("page_sections")
        .insert({
          page_id: pageId || "",
          section_id: sectionId,
          label,
          content_type: contentType,
          sort_order: maxOrder + 1,
          media_urls: contentType === "gallery" ? [] : null,
        })
        .select()
        .single();

      if (error) throw error;
      if (data) setSections((prev) => [...prev, data as Section]);
      toast.success(`"${label}" section added`);
    } catch {
      toast.error("Failed to add section");
    }
  };

  const addGalleryItem = (sectionId: string) => {
    setSections((prev) =>
      prev.map((s) => {
        if (s.id === sectionId) {
          return { ...s, media_urls: [...(s.media_urls || []), ""] };
        }
        return s;
      })
    );
  };

  const removeGalleryItem = (sectionId: string, index: number) => {
    setSections((prev) =>
      prev.map((s) => {
        if (s.id === sectionId) {
          const urls = [...(s.media_urls || [])];
          urls.splice(index, 1);
          return { ...s, media_urls: urls };
        }
        return s;
      })
    );
  };

  const clearMedia = (sectionId: string) => {
    setSections((prev) =>
      prev.map((s) => (s.id === sectionId ? { ...s, media_url: null } : s))
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{meta.title}</h1>
          <p className="text-muted-foreground text-sm mt-1">{meta.description}</p>
        </div>
        <Button onClick={handleSave} className="bg-primary text-primary-foreground hover:bg-primary/90">
          <Save className="mr-2 h-4 w-4" /> Save Changes
        </Button>
      </div>

      <div className="space-y-4">
        {sections.map((section) => (
          <SectionCard
            key={section.id}
            section={section}
            uploadingSection={uploadingSection}
            onTextUpdate={handleTextUpdate}
            onFileUpload={handleFileUpload}
            onDelete={handleDeleteSection}
            onAddGalleryItem={addGalleryItem}
            onRemoveGalleryItem={removeGalleryItem}
            onClearMedia={clearMedia}
          />
        ))}
      </div>

      <AddSectionDialog onAdd={handleAddSection} />
    </div>
  );
};

export default PageEditor;
