import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Trash2, Eye, EyeOff, GripVertical, Upload, Link as LinkIcon, Plus, X, Loader2, ChevronDown, ChevronUp, Film, FileVideo } from "lucide-react";
import { toast } from "sonner";

const CLOUDINARY_CLOUD_NAME = "drvsv82xa";
const CLOUDINARY_UPLOAD_PRESET = "tmf_upload";
const MAX_FILE_SIZE = 50 * 1024 * 1024;

export type SectionMetadata = {
  title?: string;
  director?: string;
  dop?: string;
  colorist?: string;
  editor?: string;
  gallery_titles?: string[];
  faq_items?: { question: string; answer: string }[];
  before_url?: string;
  after_url?: string;
  grade?: string;
  note?: string;
  [key: string]: any;
};

interface SectionCardProps {
  section: any;
  onUpdate: (updates: Partial<any>) => void;
  onDelete?: (id: string) => void;
  onToggleHide?: (id: string, hidden: boolean) => void;
}

/* ── Cloudinary upload with progress ── */
const uploadToCloudinary = (
  file: File,
  onProgress: (p: number) => void
): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (file.size > MAX_FILE_SIZE) {
      reject(new Error("File exceeds 50MB limit"));
      return;
    }
    const fd = new FormData();
    fd.append("file", file);
    fd.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
    const resourceType = file.type.startsWith("video/") ? "video" : "image";
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/${resourceType}/upload`);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => {
      if (xhr.status === 200) {
        resolve(JSON.parse(xhr.responseText).secure_url);
      } else reject(new Error("Upload failed"));
    };
    xhr.onerror = () => reject(new Error("Upload failed"));
    xhr.send(fd);
  });
};

const isVideoUrl = (url: string) =>
  /\.(mp4|mov|avi|webm|mkv)(\?|$)/i.test(url) || url.includes("video");

/* ── MediaField — supports both URL input and file upload ── */
const MediaField = ({
  label,
  value,
  onChange,
  accept = "image/*,video/*",
}: {
  label: string;
  value: string;
  onChange: (url: string) => void;
  accept?: string;
}) => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const isVideo = value?.match(/\.(mp4|webm|mov)(\?.*)?$/i);

  return (
    <div className="space-y-2">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <div className="flex items-center gap-2">
        <LinkIcon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
        <Input
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder="https://..."
          className="bg-muted border-border text-foreground text-sm"
        />
      </div>
      <div className="flex items-center gap-2">
        <label className="cursor-pointer">
          <input
            type="file"
            accept={accept}
            className="hidden"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              setUploading(true);
              setProgress(0);
              try {
                const url = await uploadToCloudinary(file, setProgress);
                onChange(url);
                toast.success("Uploaded!");
              } catch (err: any) {
                toast.error(err.message);
              } finally {
                setUploading(false);
                setProgress(0);
              }
            }}
          />
          <Button type="button" variant="outline" size="sm" className="border-border" asChild>
            <span>
              {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <Upload className="h-3.5 w-3.5 mr-1" />}
              {uploading ? "Uploading…" : "Upload file"}
            </span>
          </Button>
        </label>
        {uploading && <span className="text-xs text-muted-foreground">{progress}%</span>}
      </div>
      {uploading && (
        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
          <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${progress}%` }} />
        </div>
      )}
      {value && (
        <div className="relative w-32 h-20 rounded-lg overflow-hidden border border-border">
          {isVideo ? (
            <video src={value} className="w-full h-full object-cover" />
          ) : (
            <img src={value} alt="" className="w-full h-full object-cover"
              onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
            />
          )}
          <button onClick={() => onChange("")} className="absolute top-1 right-1 bg-background/80 rounded-full p-0.5">
            <X className="h-3 w-3" />
          </button>
        </div>
      )}
    </div>
  );
};

/* ── Color Graded Fields ── */
const ColorGradedFields = ({
  metadata,
  onMetaChange,
}: {
  metadata: SectionMetadata;
  onMetaChange: (key: string, value: any) => void;
}) => (
  <div className="space-y-4">
    <h4 className="text-sm font-semibold text-foreground">Color Grade — Before / After</h4>
    <MediaField
      label="Before Image (ungraded)"
      value={metadata.before_url || ""}
      onChange={(url) => onMetaChange("before_url", url)}
      accept="image/*"
    />
    <MediaField
      label="After Image (color graded)"
      value={metadata.after_url || ""}
      onChange={(url) => onMetaChange("after_url", url)}
      accept="image/*"
    />
    {(metadata.before_url || metadata.after_url) && (
      <div className="flex gap-3">
        {metadata.before_url && (
          <div className="space-y-1">
            <span className="text-[10px] text-muted-foreground">Before</span>
            <img src={metadata.before_url} alt="Before" className="w-24 h-16 rounded object-cover border border-border"
              onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
            />
          </div>
        )}
        {metadata.after_url && (
          <div className="space-y-1">
            <span className="text-[10px] text-muted-foreground">After</span>
            <img src={metadata.after_url} alt="After" className="w-24 h-16 rounded object-cover border border-border"
              onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
            />
          </div>
        )}
      </div>
    )}
    <div className="space-y-2">
      <Label className="text-xs text-muted-foreground">Title</Label>
      <Input value={metadata.title || ""} onChange={(e) => onMetaChange("title", e.target.value)}
        placeholder="Color Grade Showcase" className="bg-muted border-border text-foreground text-sm" />
    </div>
    <div className="space-y-2">
      <Label className="text-xs text-muted-foreground">Grade / LUT Name</Label>
      <Input value={metadata.grade || ""} onChange={(e) => onMetaChange("grade", e.target.value)}
        placeholder="Cinematic LUT" className="bg-muted border-border text-foreground text-sm" />
    </div>
    <div className="space-y-2">
      <Label className="text-xs text-muted-foreground">Hover Note</Label>
      <Input value={metadata.note || ""} onChange={(e) => onMetaChange("note", e.target.value)}
        placeholder="Hover to reveal the graded version" className="bg-muted border-border text-foreground text-sm" />
    </div>
  </div>
);

const CREW_FIELDS = [
  { key: "director", label: "Director" },
  { key: "dop", label: "DOP / Cinematographer" },
  { key: "colorist", label: "Colorist" },
  { key: "editor", label: "Editor" },
];

/* ── MAIN SECTION CARD ── */
const SectionCard = ({ section, onUpdate, onDelete, onToggleHide }: SectionCardProps) => {
  const [isHidden, setIsHidden] = useState(section.subtitle === "__hidden__");
  const [showDetails, setShowDetails] = useState(false);

  const metadata: SectionMetadata = section.metadata || {};
  const isDefault = section.is_default === true;
  const isCrewPage = ["ad-commercials", "media-production"].includes(section.page_id);
  const showCrewFields = isCrewPage && ["image", "video", "media", "gallery"].includes(section.content_type);
  const isFaqSection = section.content_type === "faq";
  const isColorGraded = section.section_id?.startsWith("color-grad");

  const handleMetaChange = (key: string, value: any) => {
    onUpdate({ metadata: { ...metadata, [key]: value } });
  };

  // Gallery title helpers
  const galleryTitles = metadata.gallery_titles || [];
  const updateGalleryTitle = (index: number, value: string) => {
    const updated = [...galleryTitles];
    while (updated.length <= index) updated.push("");
    updated[index] = value;
    handleMetaChange("gallery_titles", updated);
  };

  // FAQ helpers
  const faqItems = metadata.faq_items || [];
  const addFaqItem = () => handleMetaChange("faq_items", [...faqItems, { question: "", answer: "" }]);
  const updateFaqItem = (index: number, field: "question" | "answer", value: string) => {
    const updated = [...faqItems];
    updated[index] = { ...updated[index], [field]: value };
    handleMetaChange("faq_items", updated);
  };
  const removeFaqItem = (index: number) => {
    handleMetaChange("faq_items", faqItems.filter((_, i) => i !== index));
  };

  // Gallery helpers
  const mediaUrls = section.media_urls || [];
  const addGalleryItem = () => onUpdate({ media_urls: [...mediaUrls, ""] });
  const updateGalleryUrl = (i: number, url: string) => {
    const updated = [...mediaUrls];
    updated[i] = url;
    onUpdate({ media_urls: updated });
  };
  const removeGalleryItem = (i: number) => {
    const updated = [...mediaUrls];
    updated.splice(i, 1);
    const titles = [...galleryTitles];
    titles.splice(i, 1);
    onUpdate({ media_urls: updated, metadata: { ...metadata, gallery_titles: titles } });
  };

  const renderCrewDetails = () => (
    <div className="space-y-2 mt-2">
      <button
        onClick={() => setShowDetails(!showDetails)}
        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        {showDetails ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        Crew Details
      </button>
      {showDetails && (
        <div className="grid grid-cols-2 gap-2 pl-2 border-l-2 border-border">
          {CREW_FIELDS.map((field) => (
            <div key={field.key} className="space-y-1">
              <Label className="text-[10px] text-muted-foreground">{field.label}</Label>
              <Input
                value={metadata[field.key] || ""}
                onChange={(e) => handleMetaChange(field.key, e.target.value)}
                placeholder={field.label}
                className="bg-muted border-border text-foreground h-7 text-xs"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderFaq = () => (
    <div className="space-y-3">
      {faqItems.map((item, i) => (
        <div key={i} className="space-y-2 p-3 rounded-lg bg-muted/50 border border-border relative">
          <Button variant="ghost" size="icon" className="absolute top-1 right-1 h-6 w-6 text-muted-foreground hover:text-destructive"
            onClick={() => removeFaqItem(i)}>
            <X className="h-3 w-3" />
          </Button>
          <div className="space-y-1">
            <Label className="text-[10px] text-muted-foreground">Question {i + 1}</Label>
            <Input value={item.question} onChange={(e) => updateFaqItem(i, "question", e.target.value)}
              placeholder="Enter question..." className="bg-background border-border text-foreground h-8 text-sm" />
          </div>
          <div className="space-y-1">
            <Label className="text-[10px] text-muted-foreground">Answer</Label>
            <Textarea value={item.answer} onChange={(e) => updateFaqItem(i, "answer", e.target.value)}
              placeholder="Enter answer..." className="bg-background border-border text-foreground text-sm min-h-[60px]" />
          </div>
        </div>
      ))}
      <Button variant="outline" size="sm" className="border-dashed border-border" onClick={addFaqItem}>
        <Plus className="mr-1 h-3 w-3" /> Add FAQ Item
      </Button>
    </div>
  );

  const renderGallery = () => (
    <div className="space-y-3">
      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground">Section Title (editable)</Label>
        <Input value={metadata.title || ""} onChange={(e) => handleMetaChange("title", e.target.value)}
          placeholder={`Title for ${section.label}...`} className="bg-muted border-border text-foreground h-8 text-sm" />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {mediaUrls.map((url: string, i: number) => (
          <div key={i} className="space-y-1">
            <div className="aspect-square bg-muted rounded-lg border border-border relative group overflow-hidden">
              {url ? (
                isVideoUrl(url) ? (
                  <video src={url} className="w-full h-full object-cover" />
                ) : (
                  <img src={url} alt={`Gallery ${i + 1}`} className="w-full h-full object-cover" />
                )
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <FileVideo className="h-6 w-6 text-muted-foreground" />
                </div>
              )}
              {url && isVideoUrl(url) && (
                <div className="absolute top-1 left-1 bg-background/80 rounded px-1 py-0.5">
                  <Film className="h-3 w-3 text-primary" />
                </div>
              )}
              <div className="absolute inset-0 bg-background/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                <label className="cursor-pointer">
                  <input type="file" accept="image/*,video/*" className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      try {
                        const url = await uploadToCloudinary(file, () => {});
                        updateGalleryUrl(i, url);
                        toast.success("Uploaded!");
                      } catch (err: any) { toast.error(err.message); }
                    }}
                  />
                  <span className="inline-flex items-center justify-center h-7 w-7 rounded text-foreground hover:text-primary cursor-pointer">
                    <Upload className="h-3 w-3" />
                  </span>
                </label>
                <Button size="icon" variant="ghost" className="text-foreground hover:text-destructive h-7 w-7"
                  onClick={() => removeGalleryItem(i)}>
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
            <Input value={galleryTitles[i] || ""} onChange={(e) => updateGalleryTitle(i, e.target.value)}
              placeholder={`Title ${i + 1}`} className="bg-muted border-border text-foreground h-7 text-[10px]" />
          </div>
        ))}
        <button onClick={addGalleryItem}
          className="aspect-square bg-muted/50 rounded-lg border-2 border-dashed border-border hover:border-primary transition-colors flex flex-col items-center justify-center text-muted-foreground hover:text-primary">
          <Plus className="h-6 w-6" />
          <span className="text-[10px] mt-1">Add</span>
        </button>
      </div>
      {showCrewFields && renderCrewDetails()}
    </div>
  );

  return (
    <Card className={`bg-card border-border p-5 ${isHidden ? "opacity-50" : ""}`}>
      <div className="flex items-start gap-3">
        <div className="mt-1 cursor-grab text-muted-foreground hover:text-foreground">
          <GripVertical className="h-5 w-5" />
        </div>
        <div className="flex-1 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 flex-1">
              <Input
                value={section.label}
                onChange={(e) => onUpdate({ label: e.target.value })}
                className="font-semibold text-lg bg-transparent border-none p-0 focus-visible:ring-0 h-auto text-foreground"
                placeholder="Project / Section Name"
              />
              <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                Section ID: {section.section_id}
              </span>
              {isColorGraded && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary whitespace-nowrap">Color Grade</span>
              )}
              {isHidden && <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">Hidden</span>}
              {isDefault && <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary">Default</span>}
            </div>
            <div className="flex items-center gap-1">
              {onToggleHide && (
                <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground"
                  onClick={() => {
                    const newHidden = !isHidden;
                    setIsHidden(newHidden);
                    onToggleHide(section.id, newHidden);
                  }}
                  title={isHidden ? "Show section" : "Hide section"}>
                  {isHidden ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                </Button>
              )}
              {onDelete && !isDefault && (
                <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive"
                  onClick={() => onDelete(section.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          {isColorGraded ? (
            <ColorGradedFields metadata={metadata} onMetaChange={handleMetaChange} />
          ) : (
            <>
              {/* Subtitle */}
              {!isFaqSection && section.content_type !== "gallery" && (
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Short Description / Subtitle</Label>
                  <Input value={section.subtitle === "__hidden__" ? "" : (section.subtitle || "")}
                    onChange={(e) => onUpdate({ subtitle: e.target.value })}
                    placeholder="e.g. Premium Watch Campaign"
                    className="bg-muted border-border text-foreground" />
                </div>
              )}

              {/* Single media (image/video/media) */}
              {["image", "video", "media"].includes(section.content_type) && (
                <>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Section Title (editable)</Label>
                    <Input value={metadata.title || ""} onChange={(e) => handleMetaChange("title", e.target.value)}
                      placeholder={`Title for ${section.label}...`} className="bg-muted border-border text-foreground h-8 text-sm" />
                  </div>
                  <MediaField
                    label="Media URL / Upload (Image or Video)"
                    value={section.media_url || ""}
                    onChange={(url) => onUpdate({ media_url: url })}
                    accept={section.content_type === "image" ? "image/*" : section.content_type === "video" ? "video/*" : "image/*,video/*"}
                  />
                  {showCrewFields && renderCrewDetails()}
                </>
              )}

              {/* Text */}
              {section.content_type === "text" && (
                <div className="space-y-2">
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Section Title (editable)</Label>
                    <Input value={metadata.title || ""} onChange={(e) => handleMetaChange("title", e.target.value)}
                      placeholder={`Title for ${section.label}...`} className="bg-muted border-border text-foreground h-8 text-sm" />
                  </div>
                  <Input value={section.text_value || ""} onChange={(e) => onUpdate({ text_value: e.target.value })}
                    placeholder={`Enter ${section.label.toLowerCase()}...`} className="bg-muted border-border text-foreground" />
                </div>
              )}

              {/* Long Text */}
              {section.content_type === "textarea" && (
                <div className="space-y-2">
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Section Title (editable)</Label>
                    <Input value={metadata.title || ""} onChange={(e) => handleMetaChange("title", e.target.value)}
                      placeholder={`Title for ${section.label}...`} className="bg-muted border-border text-foreground h-8 text-sm" />
                  </div>
                  <Textarea value={section.text_value || ""} onChange={(e) => onUpdate({ text_value: e.target.value })}
                    placeholder={`Enter ${section.label.toLowerCase()}...`} className="bg-muted border-border text-foreground min-h-[100px]" />
                </div>
              )}

              {/* Vimeo URL */}
              {section.content_type === "vimeo_url" && (
                <div className="space-y-2">
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Section Title (editable)</Label>
                    <Input value={metadata.title || ""} onChange={(e) => handleMetaChange("title", e.target.value)}
                      placeholder={`Title for ${section.label}...`} className="bg-muted border-border text-foreground h-8 text-sm" />
                  </div>
                  <Input value={section.text_value || ""} onChange={(e) => onUpdate({ text_value: e.target.value })}
                    placeholder="https://vimeo.com/..." className="bg-muted border-border text-foreground" />
                </div>
              )}

              {/* Gallery */}
              {section.content_type === "gallery" && renderGallery()}

              {/* FAQ */}
              {isFaqSection && renderFaq()}
            </>
          )}

          {/* Sort Order */}
          <div className="flex items-center gap-2">
            <Label className="text-[10px] text-muted-foreground">Sort Order</Label>
            <Input type="number" value={section.sort_order || 0}
              onChange={(e) => onUpdate({ sort_order: parseInt(e.target.value) || 0 })}
              className="bg-muted border-border text-foreground h-7 w-20 text-xs" />
            <span className="text-[10px] text-muted-foreground ml-auto">Type: {section.content_type}</span>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default SectionCard;
