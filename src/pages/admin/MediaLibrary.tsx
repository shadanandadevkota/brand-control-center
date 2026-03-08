import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Search,
  Upload,
  Grid3X3,
  List,
  Filter,
  Image,
  Film,
  Trash2,
  Eye,
} from "lucide-react";

type MediaItem = {
  id: string;
  name: string;
  type: "image" | "video";
  size: string;
  date: string;
  thumbnail: string;
};

const mockMedia: MediaItem[] = [
  { id: "1", name: "showreel.mp4", type: "video", size: "120 MB", date: "2024-03-01", thumbnail: "/placeholder.svg" },
  { id: "2", name: "about-corner-1.jpg", type: "image", size: "2.4 MB", date: "2024-03-01", thumbnail: "/placeholder.svg" },
  { id: "3", name: "about-corner-2.jpg", type: "image", size: "1.8 MB", date: "2024-02-28", thumbnail: "/placeholder.svg" },
  { id: "4", name: "work-ad-commercials.jpg", type: "image", size: "3.1 MB", date: "2024-02-27", thumbnail: "/placeholder.svg" },
  { id: "5", name: "work-fashion-editorial.jpg", type: "image", size: "2.9 MB", date: "2024-02-26", thumbnail: "/placeholder.svg" },
  { id: "6", name: "wedding-showreel.mp4", type: "video", size: "95 MB", date: "2024-02-25", thumbnail: "/placeholder.svg" },
  { id: "7", name: "editorial-1.jpg", type: "image", size: "4.2 MB", date: "2024-02-24", thumbnail: "/placeholder.svg" },
  { id: "8", name: "still-1.jpg", type: "image", size: "3.5 MB", date: "2024-02-23", thumbnail: "/placeholder.svg" },
];

const MediaLibrary = () => {
  const [search, setSearch] = useState("");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [filter, setFilter] = useState<"all" | "image" | "video">("all");

  const filtered = mockMedia.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === "all" || item.type === filter;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Media Library</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage all your photos and videos
          </p>
        </div>
        <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
          <Upload className="mr-2 h-4 w-4" />
          Upload Media
        </Button>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search media..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-muted border-border"
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant={filter === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("all")}
          >
            <Filter className="mr-1 h-3 w-3" /> All
          </Button>
          <Button
            variant={filter === "image" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("image")}
          >
            <Image className="mr-1 h-3 w-3" /> Images
          </Button>
          <Button
            variant={filter === "video" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("video")}
          >
            <Film className="mr-1 h-3 w-3" /> Videos
          </Button>
          <div className="border-l border-border pl-2 flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setView("grid")}
              className={view === "grid" ? "text-primary" : "text-muted-foreground"}
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setView("list")}
              className={view === "list" ? "text-primary" : "text-muted-foreground"}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Media Grid / List */}
      {view === "grid" ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filtered.map((item) => (
            <Card key={item.id} className="bg-card border-border overflow-hidden group cursor-pointer">
              <div className="aspect-square bg-muted relative">
                <img
                  src={item.thumbnail}
                  alt={item.name}
                  className="w-full h-full object-cover"
                />
                {item.type === "video" && (
                  <div className="absolute top-2 left-2 bg-primary/90 text-primary-foreground text-[10px] px-2 py-0.5 rounded font-medium">
                    VIDEO
                  </div>
                )}
                <div className="absolute inset-0 bg-background/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <Button size="icon" variant="ghost" className="text-foreground hover:text-primary">
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="ghost" className="text-foreground hover:text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="p-3">
                <p className="text-xs text-foreground truncate font-medium">{item.name}</p>
                <p className="text-[10px] text-muted-foreground mt-1">{item.size}</p>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((item) => (
            <Card key={item.id} className="bg-card border-border p-3 flex items-center gap-4">
              <div className="w-12 h-12 bg-muted rounded overflow-hidden flex-shrink-0">
                <img src={item.thumbnail} alt={item.name} className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground font-medium truncate">{item.name}</p>
                <p className="text-xs text-muted-foreground">{item.type} • {item.size} • {item.date}</p>
              </div>
              <div className="flex gap-1">
                <Button size="icon" variant="ghost" className="text-muted-foreground hover:text-primary">
                  <Eye className="h-4 w-4" />
                </Button>
                <Button size="icon" variant="ghost" className="text-muted-foreground hover:text-destructive">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default MediaLibrary;
