import { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Upload, Grid3X3, List, Filter, Image, Film, Trash2, Eye } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type MediaItem = {
  id: string;
  file_name: string;
  file_path: string;
  file_type: string;
  file_size: number | null;
  storage_url: string;
  created_at: string;
};

const MediaLibrary = () => {
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [search, setSearch] = useState("");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [filter, setFilter] = useState<"all" | "image" | "video">("all");
  const [loading, setLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchMedia();
  }, []);

  const fetchMedia = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("media_files")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) setMedia(data as MediaItem[]);
    setLoading(false);
  };

  const handleUpload = async (files: FileList) => {
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const ext = file.name.split(".").pop();
        const path = `library/${Date.now()}-${file.name}`;
        const fileType = file.type.startsWith("video") ? "video" : "image";

        const { error: uploadError } = await supabase.storage.from("media").upload(path, file);
        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage.from("media").getPublicUrl(path);

        const { error: insertError } = await supabase.from("media_files").insert({
          file_name: file.name,
          file_path: path,
          file_type: fileType,
          file_size: file.size,
          mime_type: file.type,
          storage_url: publicUrl,
        });
        if (insertError) throw insertError;
      }
      toast.success("Upload complete");
      fetchMedia();
    } catch (error: any) {
      toast.error(error.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (item: MediaItem) => {
    try {
      await supabase.storage.from("media").remove([item.file_path]);
      await supabase.from("media_files").delete().eq("id", item.id);
      setMedia((prev) => prev.filter((m) => m.id !== item.id));
      toast.success("File deleted");
    } catch {
      toast.error("Delete failed");
    }
  };

  const formatSize = (bytes: number | null) => {
    if (!bytes) return "—";
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const filtered = media.filter((item) => {
    const matchesSearch = item.file_name.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === "all" || item.file_type === filter;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Media Library</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage all your photos and videos</p>
        </div>
        <div>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,video/mp4"
            className="hidden"
            onChange={(e) => e.target.files && handleUpload(e.target.files)}
          />
          <Button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Upload className="mr-2 h-4 w-4" />
            {uploading ? "Uploading..." : "Upload Media"}
          </Button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search media..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10 bg-muted border-border" />
        </div>
        <div className="flex gap-2">
          <Button variant={filter === "all" ? "default" : "outline"} size="sm" onClick={() => setFilter("all")}>
            <Filter className="mr-1 h-3 w-3" /> All
          </Button>
          <Button variant={filter === "image" ? "default" : "outline"} size="sm" onClick={() => setFilter("image")}>
            <Image className="mr-1 h-3 w-3" /> Images
          </Button>
          <Button variant={filter === "video" ? "default" : "outline"} size="sm" onClick={() => setFilter("video")}>
            <Film className="mr-1 h-3 w-3" /> Videos
          </Button>
          <div className="border-l border-border pl-2 flex gap-1">
            <Button variant="ghost" size="icon" onClick={() => setView("grid")} className={view === "grid" ? "text-primary" : "text-muted-foreground"}>
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => setView("list")} className={view === "list" ? "text-primary" : "text-muted-foreground"}>
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <Image className="h-12 w-12 mx-auto mb-3 opacity-40" />
          <p>No media files found</p>
          <p className="text-sm mt-1">Upload your first file to get started</p>
        </div>
      ) : view === "grid" ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filtered.map((item) => (
            <Card key={item.id} className="bg-card border-border overflow-hidden group cursor-pointer">
              <div className="aspect-square bg-muted relative">
                {item.file_type === "image" ? (
                  <img src={item.storage_url} alt={item.file_name} className="w-full h-full object-cover" />
                ) : (
                  <video src={item.storage_url} className="w-full h-full object-cover" />
                )}
                {item.file_type === "video" && (
                  <div className="absolute top-2 left-2 bg-primary/90 text-primary-foreground text-[10px] px-2 py-0.5 rounded font-medium">VIDEO</div>
                )}
                <div className="absolute inset-0 bg-background/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <Button size="icon" variant="ghost" className="text-foreground hover:text-destructive" onClick={() => handleDelete(item)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="p-3">
                <p className="text-xs text-foreground truncate font-medium">{item.file_name}</p>
                <p className="text-[10px] text-muted-foreground mt-1">{formatSize(item.file_size)}</p>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((item) => (
            <Card key={item.id} className="bg-card border-border p-3 flex items-center gap-4">
              <div className="w-12 h-12 bg-muted rounded overflow-hidden flex-shrink-0">
                {item.file_type === "image" ? (
                  <img src={item.storage_url} alt={item.file_name} className="w-full h-full object-cover" />
                ) : (
                  <video src={item.storage_url} className="w-full h-full object-cover" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground font-medium truncate">{item.file_name}</p>
                <p className="text-xs text-muted-foreground">{item.file_type} • {formatSize(item.file_size)}</p>
              </div>
              <Button size="icon" variant="ghost" className="text-muted-foreground hover:text-destructive" onClick={() => handleDelete(item)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default MediaLibrary;
