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
  subtitle: string | null;
  is_default?: boolean;
  hidden?: boolean;
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

  const handleMediaUrlUpdate = (sectionId: string, url: string) => {
    setSections((prev) =>
      prev.map((s) => (s.id === sectionId ? { ...s, media_url: url } : s))
    );
  };

  const handleGalleryUrlUpdate = (sectionId: string, index: number, url: string) => {
    setSections((prev) =>
      prev.map((s) => {
        if (s.id === sectionId) {
          const urls = [...(s.media_urls || [])];
          urls[index] = url;
          return { ...s, media_urls: urls };
        }
        return s;
      })
    );
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

  const handleToggleHide = async (sectionId: string, hidden: boolean) => {
    try {
      // Use text_value prefix to mark hidden state (workaround without schema change)
      // Actually we'll save it via a subtitle field hack or separate approach
      // Better: update the section's sort_order to negative to "hide"
      // Simplest: store hidden state locally and persist via a convention
      const { error } = await supabase
        .from("page_sections")
        .update({ subtitle: hidden ? "__hidden__" : null })
        .eq("id", sectionId);
      if (error) throw error;
      setSections((prev) =>
        prev.map((s) => (s.id === sectionId ? { ...s, hidden } : s))
      );
      toast.success(hidden ? "Section hidden" : "Section visible");
    } catch {
      toast.error("Failed to update section");
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
          is_default: false,
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

  const handleDuplicateSection = async (sourceSection: Section, newLabel: string) => {
    try {
      const sectionId = newLabel.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
      const maxOrder = sections.length > 0 ? Math.max(...sections.map((s) => s.sort_order)) : 0;

      const { data, error } = await supabase
        .from("page_sections")
        .insert({
          page_id: pageId || "",
          section_id: sectionId,
          label: newLabel,
          content_type: sourceSection.content_type,
          text_value: sourceSection.text_value,
          media_url: sourceSection.media_url,
          media_urls: sourceSection.media_urls,
          sort_order: maxOrder + 1,
          is_default: false,
        })
        .select()
        .single();

      if (error) throw error;
      if (data) setSections((prev) => [...prev, data as Section]);
      toast.success(`"${newLabel}" duplicated from "${sourceSection.label}"`);
    } catch {
      toast.error("Failed to duplicate section");
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

  const setMediaUrl = (sectionId: string, url: string) => {
    setSections((prev) =>
      prev.map((s) => (s.id === sectionId ? { ...s, media_url: url } : s))
    );
  };

  const setGalleryUrl = (sectionId: string, index: number, url: string) => {
    setSections((prev) =>
      prev.map((s) => {
        if (s.id === sectionId) {
          const urls = [...(s.media_urls || [])];
          urls[index] = url;
          return { ...s, media_urls: urls };
        }
        return s;
      })
    );
  };

  // Map subtitle "__hidden__" to hidden flag
  const mappedSections = sections.map(s => ({
    ...s,
    hidden: s.subtitle === "__hidden__",
  }));

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
        {mappedSections.map((section) => (
          <SectionCard
            key={section.id}
            section={section}
            uploadingSection={uploadingSection}
            onTextUpdate={handleTextUpdate}
            onMediaUrlUpdate={handleMediaUrlUpdate}
            onGalleryUrlUpdate={handleGalleryUrlUpdate}
            onDelete={handleDeleteSection}
            onAddGalleryItem={addGalleryItem}
            onRemoveGalleryItem={removeGalleryItem}
            onClearMedia={clearMedia}
            onSetMediaUrl={setMediaUrl}
            onSetGalleryUrl={setGalleryUrl}
            onToggleHide={handleToggleHide}
          />
        ))}
      </div>

      <AddSectionDialog onAdd={handleAddSection} onDuplicate={handleDuplicateSection} existingSections={mappedSections} />
    </div>
  );
};

export default PageEditor;
