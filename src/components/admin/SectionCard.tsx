import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GripVertical, Trash2, Upload, Image, Film, Plus, X } from "lucide-react";
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

type SectionCardProps = {
  section: Section;
  uploadingSection: string | null;
  onTextUpdate: (sectionId: string, value: string) => void;
  onFileUpload: (sectionId: string, file: File, galleryIndex?: number) => void;
  onDelete: (sectionId: string) => void;
  onAddGalleryItem: (sectionId: string) => void;
  onRemoveGalleryItem: (sectionId: string, index: number) => void;
  onClearMedia: (sectionId: string) => void;
};

const SectionCard = ({
  section,
  uploadingSection,
  onTextUpdate,
  onFileUpload,
  onDelete,
  onAddGalleryItem,
  onRemoveGalleryItem,
  onClearMedia,
}: SectionCardProps) => {
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

  return (
    <Card className="bg-card border-border p-5">
      <div className="flex items-start gap-3">
        <div className="mt-1 cursor-grab text-muted-foreground hover:text-foreground">
          <GripVertical className="h-5 w-5" />
        </div>
        <div className="flex-1 space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-foreground font-semibold text-sm">{section.label}</Label>
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
          </div>

          {section.content_type === "text" && (
            <Input
              value={section.text_value || ""}
              onChange={(e) => onTextUpdate(section.id, e.target.value)}
              placeholder={`Enter ${section.label.toLowerCase()}...`}
              className="bg-muted border-border text-foreground"
            />
          )}

          {section.content_type === "vimeo_url" && (
            <Input
              value={section.text_value || ""}
              onChange={(e) => onTextUpdate(section.id, e.target.value)}
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
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-border"
                    disabled={uploadingSection === section.id}
                    onClick={() => triggerFileUpload("image/*", (file) => onFileUpload(section.id, file))}
                  >
                    <Upload className="mr-2 h-3 w-3" />
                    {uploadingSection === section.id ? "Uploading..." : section.media_url ? "Replace" : "Upload Image"}
                  </Button>
                  {section.media_url && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => onClearMedia(section.id)}
                    >
                      <X className="mr-1 h-3 w-3" /> Remove
                    </Button>
                  )}
                </div>
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
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-border"
                    disabled={uploadingSection === section.id}
                    onClick={() => triggerFileUpload("video/mp4,video/*", (file) => onFileUpload(section.id, file))}
                  >
                    <Upload className="mr-2 h-3 w-3" />
                    {uploadingSection === section.id ? "Uploading..." : section.media_url ? "Replace" : "Upload Video"}
                  </Button>
                  {section.media_url && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => onClearMedia(section.id)}
                    >
                      <X className="mr-1 h-3 w-3" /> Remove
                    </Button>
                  )}
                </div>
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
                        onClick={() => triggerFileUpload("image/*", (file) => onFileUpload(section.id, file, i))}
                      >
                        <Upload className="h-3 w-3" />
                      </Button>
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
                ))}
                <button
                  onClick={() => onAddGalleryItem(section.id)}
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
  );
};

export default SectionCard;
