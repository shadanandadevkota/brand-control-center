import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { GripVertical, Trash2, Upload, Image, Film, Plus, X, Link2, FileUp, EyeOff, Eye, FileVideo, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

const MAX_FILE_SIZE = 50 * 1024 * 1024;
const CLOUDINARY_CLOUD_NAME = "drvsv82xa";
const CLOUDINARY_UPLOAD_PRESET = "tmf_upload";

export type SectionMetadata = {
  title?: string;
  director?: string;
  dop?: string;
  colorist?: string;
  editor?: string;
  gallery_titles?: string[];
  faq_items?: { question: string; answer: string }[];
  [key: string]: any;
};

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
  is_default?: boolean;
  hidden?: boolean;
  metadata?: SectionMetadata;
};

type SectionCardProps = {
  section: Section;
  uploadingSection: string | null;
  onTextUpdate: (sectionId: string, value: string) => void;
  onMediaUrlUpdate: (sectionId: string, url: string) => void;
  onGalleryUrlUpdate: (sectionId: string, index: number, url: string) => void;
  onDelete: (sectionId: string) => void;
  onAddGalleryItem: (sectionId: string) => void;
  onRemoveGalleryItem: (sectionId: string, index: number) => void;
  onClearMedia: (sectionId: string) => void;
  onSetMediaUrl?: (sectionId: string, url: string) => void;
  onSetGalleryUrl?: (sectionId: string, index: number, url: string) => void;
  onToggleHide?: (sectionId: string, hidden: boolean) => void;
  onMetadataUpdate?: (sectionId: string, metadata: SectionMetadata) => void;
};

type InputMode = "file" | "link";

const isVideoUrl = (url: string) => {
  return /\.(mp4|mov|avi|webm|mkv)(\?|$)/i.test(url) || url.includes("video");
};

const CREW_FIELDS = [
  { key: "director", label: "Director" },
  { key: "dop", label: "DOP (Director of Photography)" },
  { key: "colorist", label: "Colorist" },
  { key: "editor", label: "Editor" },
];

const SectionCard = ({
  section,
  uploadingSection,
  onTextUpdate,
  onMediaUrlUpdate,
  onGalleryUrlUpdate,
  onDelete,
  onAddGalleryItem,
  onRemoveGalleryItem,
  onClearMedia,
  onSetMediaUrl,
  onSetGalleryUrl,
  onToggleHide,
  onMetadataUpdate,
}: SectionCardProps) => {
  const [inputMode, setInputMode] = useState<InputMode>("file");
  const [linkUrl, setLinkUrl] = useState("");
  const [galleryLinkIndex, setGalleryLinkIndex] = useState<number | null>(null);
  const [galleryLinkUrl, setGalleryLinkUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showDetails, setShowDetails] = useState(false);

  const isDefault = section.is_default === true;
  const isHidden = section.hidden === true;
  const metadata: SectionMetadata = section.metadata || {};

  const updateMeta = (key: string, value: any) => {
    if (!onMetadataUpdate) return;
    onMetadataUpdate(section.id, { ...metadata, [key]: value });
  };

  // Crew detail pages
  const isCrewPage = ["ad-commercials", "media-production"].includes(section.page_id);
  const showCrewFields = isCrewPage && (section.content_type === "image" || section.content_type === "video" || section.content_type === "media" || section.content_type === "gallery");
  const isFaqSection = section.content_type === "faq";

  const uploadToCloudinary = async (file: File): Promise<string | null> => {
    if (file.size > MAX_FILE_SIZE) {
      toast.error(`File too large. Maximum size is 50MB. Your file is ${(file.size / 1024 / 1024).toFixed(1)}MB.`);
      return null;
    }
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
    const resourceType = file.type.startsWith("video") ? "video" : "image";
    return new Promise((resolve) => {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/${resourceType}/upload`);
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          setUploadProgress(Math.round((e.loaded / e.total) * 100));
        }
      };
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          const data = JSON.parse(xhr.responseText);
          resolve(data.secure_url as string);
        } else {
          toast.error("Upload failed");
          resolve(null);
        }
      };
      xhr.onerror = () => {
        toast.error("Cloudinary upload failed");
        resolve(null);
      };
      xhr.send(formData);
    });
  };

  const triggerFileUpload = (accept: string, callback: (file: File) => void) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = accept;
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) callback(file);
    };
    input.click();
  };

  const handleUploadSingle = async (file: File) => {
    setUploading(true);
    const url = await uploadToCloudinary(file);
    if (url) {
      onMediaUrlUpdate(section.id, url);
      toast.success("File uploaded to Cloudinary");
    }
    setUploading(false);
  };

  const handleUploadGallery = async (file: File, index: number) => {
    setUploading(true);
    const url = await uploadToCloudinary(file);
    if (url) {
      onGalleryUrlUpdate(section.id, index, url);
      toast.success("File uploaded to Cloudinary");
    }
    setUploading(false);
  };

  const handleApplyLink = () => {
    if (!linkUrl.trim() || !onSetMediaUrl) return;
    onSetMediaUrl(section.id, linkUrl.trim());
    setLinkUrl("");
  };

  const handleApplyGalleryLink = (index: number) => {
    if (!galleryLinkUrl.trim() || !onSetGalleryUrl) return;
    onSetGalleryUrl(section.id, index, galleryLinkUrl.trim());
    setGalleryLinkUrl("");
    setGalleryLinkIndex(null);
  };

  const getAcceptType = () => {
    if (section.content_type === "image") return "image/*";
    if (section.content_type === "video") return "video/mp4,video/*";
    return "image/*,video/mp4,video/*";
  };

  // --- FAQ helpers ---
  const faqItems = metadata.faq_items || [];
  const addFaqItem = () => {
    updateMeta("faq_items", [...faqItems, { question: "", answer: "" }]);
  };
  const updateFaqItem = (index: number, field: "question" | "answer", value: string) => {
    const updated = [...faqItems];
    updated[index] = { ...updated[index], [field]: value };
    updateMeta("faq_items", updated);
  };
  const removeFaqItem = (index: number) => {
    updateMeta("faq_items", faqItems.filter((_, i) => i !== index));
  };

  // --- Gallery title helpers ---
  const galleryTitles = metadata.gallery_titles || [];
  const updateGalleryTitle = (index: number, value: string) => {
    const updated = [...galleryTitles];
    while (updated.length <= index) updated.push("");
    updated[index] = value;
    updateMeta("gallery_titles", updated);
  };

  const ModeToggle = () => (
    <div className="flex items-center gap-1 rounded-md border border-border p-0.5 bg-muted">
      <button
        onClick={() => setInputMode("file")}
        className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors ${
          inputMode === "file" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
        }`}
      >
        <FileUp className="h-3 w-3" /> File
      </button>
      <button
        onClick={() => setInputMode("link")}
        className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors ${
          inputMode === "link" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
        }`}
      >
        <Link2 className="h-3 w-3" /> Link
      </button>
    </div>
  );

  const MediaPreview = ({ url, className = "w-24 h-24" }: { url: string | null; className?: string }) => {
    if (!url) {
      return (
        <div className={`${className} bg-muted rounded-lg border border-border flex items-center justify-center`}>
          <FileVideo className="h-8 w-8 text-muted-foreground" />
        </div>
      );
    }
    if (isVideoUrl(url)) {
      return (
        <div className={`${className} bg-muted rounded-lg border border-border overflow-hidden`}>
          <video src={url} className="w-full h-full object-cover" />
        </div>
      );
    }
    return (
      <div className={`${className} bg-muted rounded-lg border border-border overflow-hidden`}>
        <img src={url} alt="" className="w-full h-full object-cover" />
      </div>
    );
  };

  // --- Title field (shown for all media sections) ---
  const renderTitleField = () => (
    <div className="space-y-1">
      <Label className="text-xs text-muted-foreground">Section Title (editable)</Label>
      <Input
        value={metadata.title || ""}
        onChange={(e) => updateMeta("title", e.target.value)}
        placeholder={`Title for ${section.label}...`}
        className="bg-muted border-border text-foreground h-8 text-sm"
      />
    </div>
  );

  // --- Crew details ---
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
                value={(metadata as any)[field.key] || ""}
                onChange={(e) => updateMeta(field.key, e.target.value)}
                placeholder={field.label}
                className="bg-muted border-border text-foreground h-7 text-xs"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );

  // --- FAQ section ---
  const renderFaq = () => (
    <div className="space-y-3">
      {faqItems.map((item, i) => (
        <div key={i} className="space-y-2 p-3 rounded-lg bg-muted/50 border border-border relative">
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-1 right-1 h-6 w-6 text-muted-foreground hover:text-destructive"
            onClick={() => removeFaqItem(i)}
          >
            <X className="h-3 w-3" />
          </Button>
          <div className="space-y-1">
            <Label className="text-[10px] text-muted-foreground">Question {i + 1}</Label>
            <Input
              value={item.question}
              onChange={(e) => updateFaqItem(i, "question", e.target.value)}
              placeholder="Enter question..."
              className="bg-background border-border text-foreground h-8 text-sm"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-[10px] text-muted-foreground">Answer</Label>
            <Textarea
              value={item.answer}
              onChange={(e) => updateFaqItem(i, "answer", e.target.value)}
              placeholder="Enter answer..."
              className="bg-background border-border text-foreground text-sm min-h-[60px]"
            />
          </div>
        </div>
      ))}
      <Button variant="outline" size="sm" className="border-dashed border-border" onClick={addFaqItem}>
        <Plus className="mr-1 h-3 w-3" /> Add FAQ Item
      </Button>
    </div>
  );

  const renderSingleMedia = () => (
    <div className="space-y-3">
      {renderTitleField()}
      <div className="flex items-center gap-2">
        <ModeToggle />
        <span className="text-[10px] text-muted-foreground">Max 50MB per file</span>
      </div>
      <div className="flex items-center gap-4">
        <MediaPreview url={section.media_url} className={section.content_type === "video" ? "w-32 h-20" : "w-24 h-24"} />
        <div className="space-y-2 flex-1">
          <p className="text-xs text-muted-foreground truncate max-w-[200px]">
            {section.media_url ? section.media_url.split("/").pop() : "No file selected"}
          </p>
          {inputMode === "file" ? (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="border-border"
                disabled={uploading}
                onClick={() => triggerFileUpload(getAcceptType(), (file) => handleUploadSingle(file))}
              >
                {uploading ? <Loader2 className="mr-2 h-3 w-3 animate-spin" /> : <Upload className="mr-2 h-3 w-3" />}
                {uploading ? "Uploading..." : section.media_url ? "Replace" : "Upload"}
              </Button>
              {section.media_url && (
                <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => onClearMedia(section.id)}>
                  <X className="mr-1 h-3 w-3" /> Remove
                </Button>
              )}
            </div>
          ) : (
            <div className="flex gap-2">
              <Input
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="https://example.com/photo-or-video.mp4"
                className="bg-muted border-border text-foreground h-8 text-xs"
              />
              <Button size="sm" onClick={handleApplyLink} disabled={!linkUrl.trim()} className="bg-primary text-primary-foreground hover:bg-primary/90">
                Apply
              </Button>
            </div>
          )}
        </div>
      </div>
      {showCrewFields && renderCrewDetails()}
    </div>
  );

  const renderGallery = () => (
    <div className="space-y-3">
      {renderTitleField()}
      <div className="flex items-center gap-2">
        <ModeToggle />
        <span className="text-[10px] text-muted-foreground">Photos & Videos • Max 50MB each</span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {(section.media_urls || []).map((url, i) => (
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
                {inputMode === "file" ? (
                  <Button
                    size="icon"
                    variant="ghost"
                    className="text-foreground hover:text-primary h-7 w-7"
                    onClick={() => triggerFileUpload(getAcceptType(), (file) => handleUploadGallery(file, i))}
                  >
                    <Upload className="h-3 w-3" />
                  </Button>
                ) : (
                  <Button
                    size="icon"
                    variant="ghost"
                    className="text-foreground hover:text-primary h-7 w-7"
                    onClick={() => { setGalleryLinkIndex(i); setGalleryLinkUrl(url || ""); }}
                  >
                    <Link2 className="h-3 w-3" />
                  </Button>
                )}
                <Button
                  size="icon"
                  variant="ghost"
                  className="text-foreground hover:text-destructive h-7 w-7"
                  onClick={() => onRemoveGalleryItem(section.id, i)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
            {/* Per-item title */}
            <Input
              value={galleryTitles[i] || ""}
              onChange={(e) => updateGalleryTitle(i, e.target.value)}
              placeholder={`Title ${i + 1}`}
              className="bg-muted border-border text-foreground h-7 text-[10px]"
            />
            {galleryLinkIndex === i && inputMode === "link" && (
              <div className="flex gap-1">
                <Input
                  value={galleryLinkUrl}
                  onChange={(e) => setGalleryLinkUrl(e.target.value)}
                  placeholder="URL..."
                  className="bg-muted border-border text-foreground h-7 text-[10px]"
                />
                <Button size="sm" className="h-7 px-2 text-[10px] bg-primary text-primary-foreground" onClick={() => handleApplyGalleryLink(i)}>
                  OK
                </Button>
              </div>
            )}
          </div>
        ))}
        <button
          onClick={() => onAddGalleryItem(section.id)}
          className="aspect-square bg-muted/50 rounded-lg border-2 border-dashed border-border hover:border-primary transition-colors flex flex-col items-center justify-center text-muted-foreground hover:text-primary"
        >
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
            <div className="flex items-center gap-2">
              <Label className="text-foreground font-semibold text-sm">{section.label}</Label>
              {isHidden && <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">Hidden</span>}
              {isDefault && <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary">Default</span>}
            </div>
            <div className="flex items-center gap-1">
              {onToggleHide && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-foreground"
                  onClick={() => onToggleHide(section.id, !isHidden)}
                  title={isHidden ? "Show section" : "Hide section"}
                >
                  {isHidden ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                </Button>
              )}
              {!isDefault && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="bg-card border-border">
                    <AlertDialogHeader>
                      <AlertDialogTitle className="text-foreground">Delete Section</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete "{section.label}"? This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="border-border">Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => onDelete(section.id)}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          </div>

          {section.content_type === "text" && (
            <div className="space-y-2">
              {renderTitleField()}
              <Input
                value={section.text_value || ""}
                onChange={(e) => onTextUpdate(section.id, e.target.value)}
                placeholder={`Enter ${section.label.toLowerCase()}...`}
                className="bg-muted border-border text-foreground"
              />
            </div>
          )}

          {section.content_type === "textarea" && (
            <div className="space-y-2">
              {renderTitleField()}
              <Textarea
                value={section.text_value || ""}
                onChange={(e) => onTextUpdate(section.id, e.target.value)}
                placeholder={`Enter ${section.label.toLowerCase()}...`}
                className="bg-muted border-border text-foreground min-h-[100px]"
              />
            </div>
          )}

          {section.content_type === "vimeo_url" && (
            <div className="space-y-2">
              {renderTitleField()}
              <Input
                value={section.text_value || ""}
                onChange={(e) => onTextUpdate(section.id, e.target.value)}
                placeholder="https://vimeo.com/..."
                className="bg-muted border-border text-foreground"
              />
            </div>
          )}

          {(section.content_type === "image" || section.content_type === "video" || section.content_type === "media") && renderSingleMedia()}

          {section.content_type === "gallery" && renderGallery()}

          {isFaqSection && renderFaq()}
        </div>
      </div>
    </Card>
  );
};

export default SectionCard;
