import { useParams } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Save, Plus, Upload, GripVertical, Trash2, Image, Film } from "lucide-react";
import { toast } from "sonner";

type PageConfig = {
  title: string;
  description: string;
  sections: {
    id: string;
    label: string;
    type: "text" | "image" | "video" | "gallery";
    value?: string;
    items?: string[];
  }[];
};

const pageConfigs: Record<string, PageConfig> = {
  homepage: {
    title: "Homepage",
    description: "Manage homepage content and media",
    sections: [
      { id: "showreel", label: "Showreel Video", type: "video", value: "showreel.mp4" },
      { id: "about-1", label: "About Corner 1", type: "image", value: "about-corner-1.jpg" },
      { id: "about-2", label: "About Corner 2", type: "image", value: "about-corner-2.jpg" },
      { id: "about-3", label: "About Corner 3", type: "image", value: "about-corner-3.jpg" },
      { id: "about-4", label: "About Corner 4", type: "image", value: "about-corner-4.jpg" },
      { id: "work-ad", label: "Work - Ad Commercials", type: "image", value: "work-ad-commercials.jpg" },
      { id: "work-fashion", label: "Work - Fashion Editorial", type: "image", value: "work-fashion-editorial.jpg" },
      { id: "work-weddings", label: "Work - Fine Art Weddings", type: "image", value: "work-fine-art-weddings.jpg" },
      { id: "work-media", label: "Work - Media Production", type: "image", value: "work-media-production.jpg" },
    ],
  },
  about: {
    title: "About Page",
    description: "Edit about page content",
    sections: [
      { id: "hero-title", label: "Hero Title", type: "text", value: "About TMF Studios" },
      { id: "hero-desc", label: "Hero Description", type: "text", value: "We are a creative production house..." },
      { id: "about-images", label: "About Images", type: "gallery", items: ["about-1.jpg", "about-2.jpg", "about-3.jpg", "about-4.jpg"] },
    ],
  },
  "ad-commercials": {
    title: "Ad Commercials",
    description: "Manage ad commercial projects",
    sections: [
      { id: "luxury-brand", label: "Luxury Brand Campaign - Preview", type: "image" },
      { id: "tech-product", label: "Tech Product Launch - Preview", type: "image" },
      { id: "fashion-collection", label: "Fashion Collection - Preview", type: "image" },
      { id: "automotive", label: "Automotive Showcase - Preview", type: "image" },
      { id: "lifestyle", label: "Lifestyle Brand - Preview", type: "image" },
      { id: "corporate", label: "Corporate Identity - Preview", type: "image" },
    ],
  },
  "fashion-editorial": {
    title: "Fashion Editorial",
    description: "Manage fashion editorial content",
    sections: [
      { id: "editorial-1", label: "Editorial 1 - Photography", type: "image" },
      { id: "editorial-2", label: "Editorial 2 - Photography", type: "image" },
      { id: "editorial-3", label: "Editorial 3 - Photography", type: "image" },
      { id: "editorial-4", label: "Editorial 4", type: "image" },
      { id: "editorial-5", label: "Editorial 5", type: "image" },
      { id: "showcase", label: "Showcase Images", type: "gallery", items: ["showcase-1.jpg", "showcase-2.jpg", "showcase-3.jpg", "showcase-4.jpg", "showcase-5.jpg", "showcase-6.jpg"] },
    ],
  },
  "media-production": {
    title: "Media Production",
    description: "Manage media production page",
    sections: [
      { id: "project-showcase", label: "Project Showcase", type: "video" },
      { id: "still-1", label: "Still 1", type: "image" },
      { id: "still-2", label: "Still 2", type: "image" },
      { id: "still-3", label: "Still 3", type: "image" },
      { id: "still-4", label: "Still 4", type: "image" },
      { id: "color-graded", label: "Color Graded Image", type: "image" },
      { id: "final-trailer", label: "Final Output - Trailer Video", type: "video" },
    ],
  },
  "wedding-landing": {
    title: "Wedding Landing Page",
    description: "Manage wedding landing page",
    sections: [
      { id: "showreel", label: "Showreel", type: "video" },
      { id: "about-1", label: "About Us - Image 1", type: "image" },
      { id: "about-2", label: "About Us - Image 2", type: "image" },
      { id: "featured", label: "Featured Stories", type: "gallery", items: ["featured-1.jpg", "featured-2.jpg", "featured-3.jpg", "featured-4.jpg", "featured-5.jpg", "featured-6.jpg"] },
      { id: "films-showreel", label: "Cinematic Films Showreel", type: "video" },
      { id: "photos", label: "Wedding Photography", type: "gallery", items: ["photo-1.jpg", "photo-2.jpg", "photo-3.jpg", "photo-4.jpg", "photo-5.jpg", "photo-6.jpg"] },
      { id: "vimeo-1", label: "Inspired By Cinema - Video 1 (Vimeo URL)", type: "text" },
      { id: "vimeo-2", label: "Inspired By Cinema - Video 2 (Vimeo URL)", type: "text" },
      { id: "vimeo-3", label: "Inspired By Cinema - Video 3 (Vimeo URL)", type: "text" },
      { id: "vimeo-4", label: "Inspired By Cinema - Video 4 (Vimeo URL)", type: "text" },
    ],
  },
  "wedding-photos": {
    title: "Wedding Photos Page",
    description: "Manage wedding photography content",
    sections: [
      { id: "hero-title", label: "Page Title", type: "text", value: "Wedding Photography" },
      { id: "gallery", label: "Photo Gallery", type: "gallery", items: [] },
    ],
  },
  "wedding-films": {
    title: "Wedding Films Page",
    description: "Manage wedding films content",
    sections: [
      { id: "hero-title", label: "Page Title", type: "text", value: "Wedding Films" },
      { id: "films-gallery", label: "Films Gallery", type: "gallery", items: [] },
    ],
  },
  "wedding-stories": {
    title: "Wedding Stories / Blog",
    description: "Manage wedding blog posts and stories",
    sections: [
      { id: "hero-title", label: "Page Title", type: "text", value: "Wedding Stories" },
      { id: "stories", label: "Blog Posts", type: "gallery", items: [] },
    ],
  },
};

const PageEditor = () => {
  const { pageId } = useParams<{ pageId: string }>();
  const config = pageConfigs[pageId || ""] || {
    title: "Page Not Found",
    description: "This page configuration does not exist",
    sections: [],
  };

  const handleSave = () => {
    toast.success(`${config.title} saved successfully`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{config.title}</h1>
          <p className="text-muted-foreground text-sm mt-1">{config.description}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="border-border text-foreground">
            <Plus className="mr-2 h-4 w-4" /> Add Section
          </Button>
          <Button onClick={handleSave} className="bg-primary text-primary-foreground hover:bg-primary/90">
            <Save className="mr-2 h-4 w-4" /> Save Changes
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        {config.sections.map((section) => (
          <Card key={section.id} className="bg-card border-border p-5">
            <div className="flex items-start gap-3">
              <div className="mt-1 cursor-grab text-muted-foreground hover:text-foreground">
                <GripVertical className="h-5 w-5" />
              </div>
              <div className="flex-1 space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-foreground font-semibold text-sm">
                    {section.label}
                  </Label>
                  <Button size="icon" variant="ghost" className="text-muted-foreground hover:text-destructive h-8 w-8">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                {section.type === "text" && (
                  <div>
                    {section.label.toLowerCase().includes("description") ? (
                      <Textarea
                        defaultValue={section.value}
                        placeholder={`Enter ${section.label.toLowerCase()}...`}
                        className="bg-muted border-border text-foreground"
                      />
                    ) : (
                      <Input
                        defaultValue={section.value}
                        placeholder={`Enter ${section.label.toLowerCase()}...`}
                        className="bg-muted border-border text-foreground"
                      />
                    )}
                  </div>
                )}

                {section.type === "image" && (
                  <div className="flex items-center gap-4">
                    <div className="w-24 h-24 bg-muted rounded-lg border border-border flex items-center justify-center overflow-hidden">
                      {section.value ? (
                        <img src="/placeholder.svg" alt={section.label} className="w-full h-full object-cover" />
                      ) : (
                        <Image className="h-8 w-8 text-muted-foreground" />
                      )}
                    </div>
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground">{section.value || "No file selected"}</p>
                      <Button variant="outline" size="sm" className="border-border">
                        <Upload className="mr-2 h-3 w-3" /> Replace Image
                      </Button>
                    </div>
                  </div>
                )}

                {section.type === "video" && (
                  <div className="flex items-center gap-4">
                    <div className="w-32 h-20 bg-muted rounded-lg border border-border flex items-center justify-center overflow-hidden">
                      <Film className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground">{section.value || "No video selected"}</p>
                      <Button variant="outline" size="sm" className="border-border">
                        <Upload className="mr-2 h-3 w-3" /> Replace Video
                      </Button>
                    </div>
                  </div>
                )}

                {section.type === "gallery" && (
                  <div>
                    <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3">
                      {(section.items || []).map((item, i) => (
                        <div key={i} className="aspect-square bg-muted rounded-lg border border-border relative group overflow-hidden">
                          <img src="/placeholder.svg" alt={item} className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-background/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <Button size="icon" variant="ghost" className="text-foreground hover:text-destructive h-8 w-8">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                          <p className="absolute bottom-1 left-1 right-1 text-[8px] text-foreground bg-background/80 px-1 rounded truncate">
                            {item}
                          </p>
                        </div>
                      ))}
                      <button className="aspect-square bg-muted/50 rounded-lg border-2 border-dashed border-border hover:border-primary transition-colors flex flex-col items-center justify-center text-muted-foreground hover:text-primary">
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
