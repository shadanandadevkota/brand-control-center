import { useParams } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Save, Plus, Upload, GripVertical, Trash2, Image, Film } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState, useRef } from "react";

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
  const fileInputRef = useRef<HTMLInputElement>(null);
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

  const handleTextUpdate = async (sectionId: string, value: string) => {
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

      // Also add to media_files table
      const fileType = file.type.startsWith("video") ? "video" : "image";
      await supabase.from("media_files").insert({
        file_name: file.name,
        file_path: path,
        file_type: fileType,
        file_size: file.size,
        mime_type: file.type,
        storage_url: publicUrl,
      });

      // Update section
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

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/mp4"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file && uploadingSection) {
            handleFileUpload(uploadingSection, file);
          }
          e.target.value = "";
        }}
      />

      <div className="space-y-4">
        {sections.map((section) => (
          <Card key={section.id} className="bg-card border-border p-5">
            <div className="flex items-start gap-3">
              <div className="mt-1 cursor-grab text-muted-foreground hover:text-foreground">
                <GripVertical className="h-5 w-5" />
              </div>
              <div className="flex-1 space-y-3">
                <Label className="text-foreground font-semibold text-sm">{section.label}</Label>

                {section.content_type === "text" && (
                  <Input
                    value={section.text_value || ""}
                    onChange={(e) => handleTextUpdate(section.id, e.target.value)}
                    placeholder={`Enter ${section.label.toLowerCase()}...`}
                    className="bg-muted border-border text-foreground"
                  />
                )}

                {section.content_type === "vimeo_url" && (
                  <Input
                    value={section.text_value || ""}
                    onChange={(e) => handleTextUpdate(section.id, e.target.value)}
                    placeholder="https://vimeo.com/..."
                    className="bg-muted border-border text-foreground"
                  />
                )}

                {section.content_type === "image" && (
                  <div className="flex items-center gap-4">
                    <div className="w-24 h-24 bg-muted rounded-lg border border-border flex items-center justify-center overflow-hidden">
                      {section.media_url ? (
                        <img src={section.media_url} alt={section.label} className="w-full h-full object-cover" />
                      ) : (
                        <Image className="h-8 w-8 text-muted-foreground" />
                      )}
                    </div>
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                        {section.media_url ? section.media_url.split("/").pop() : "No file selected"}
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-border"
                        disabled={uploadingSection === section.id}
                        onClick={() => {
                          setUploadingSection(section.id);
                          fileInputRef.current?.click();
                        }}
                      >
                        <Upload className="mr-2 h-3 w-3" />
                        {uploadingSection === section.id ? "Uploading..." : "Replace Image"}
                      </Button>
                    </div>
                  </div>
                )}

                {section.content_type === "video" && (
                  <div className="flex items-center gap-4">
                    <div className="w-32 h-20 bg-muted rounded-lg border border-border flex items-center justify-center overflow-hidden">
                      {section.media_url ? (
                        <video src={section.media_url} className="w-full h-full object-cover" />
                      ) : (
                        <Film className="h-8 w-8 text-muted-foreground" />
                      )}
                    </div>
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                        {section.media_url ? section.media_url.split("/").pop() : "No video selected"}
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-border"
                        disabled={uploadingSection === section.id}
                        onClick={() => {
                          setUploadingSection(section.id);
                          fileInputRef.current?.click();
                        }}
                      >
                        <Upload className="mr-2 h-3 w-3" />
                        {uploadingSection === section.id ? "Uploading..." : "Replace Video"}
                      </Button>
                    </div>
                  </div>
                )}

                {section.content_type === "gallery" && (
                  <div>
                    <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3">
                      {(section.media_urls || []).map((url, i) => (
                        <div key={i} className="aspect-square bg-muted rounded-lg border border-border relative group overflow-hidden">
                          {url ? (
                            <img src={url} alt={`Gallery ${i + 1}`} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Image className="h-6 w-6 text-muted-foreground" />
                            </div>
                          )}
                          <div className="absolute inset-0 bg-background/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                            <Button
                              size="icon"
                              variant="ghost"
                              className="text-foreground hover:text-primary h-7 w-7"
                              onClick={() => {
                                setUploadingSection(section.id);
                                const input = document.createElement("input");
                                input.type = "file";
                                input.accept = "image/*";
                                input.onchange = (e) => {
                                  const file = (e.target as HTMLInputElement).files?.[0];
                                  if (file) handleFileUpload(section.id, file, i);
                                };
                                input.click();
                              }}
                            >
                              <Upload className="h-3 w-3" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="text-foreground hover:text-destructive h-7 w-7"
                              onClick={() => removeGalleryItem(section.id, i)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                      <button
                        onClick={() => addGalleryItem(section.id)}
                        className="aspect-square bg-muted/50 rounded-lg border-2 border-dashed border-border hover:border-primary transition-colors flex flex-col items-center justify-center text-muted-foreground hover:text-primary"
                      >
                        <Plus className="h-6 w-6" />
                        <span className="text-[10px] mt-1">Add</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default PageEditor;
