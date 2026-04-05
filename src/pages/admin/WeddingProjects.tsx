import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Trash2, Edit2, Image, Film, Link as LinkIcon, Upload, Images, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const CLOUDINARY_CLOUD_NAME = "drvsv82xa";
const CLOUDINARY_UPLOAD_PRESET = "tmf_upload";
const MAX_FILE_SIZE = 50 * 1024 * 1024;

type WeddingProject = {
  id: string;
  slug: string;
  couple_name: string;
  location: string;
  category: string;
  description: string;
  tagline: string;
  cover_image: string;
  date_text: string;
  project_type: string;
  duration: string;
  vimeo_url: string;
  thumbnail: string;
  behind_the_scenes: string;
  gallery_images: string[];
  has_blog: boolean;
  sort_order: number;
};

const emptyProject: Omit<WeddingProject, "id"> = {
  slug: "", couple_name: "", location: "", category: "", description: "", tagline: "",
  cover_image: "", date_text: "", project_type: "photo", duration: "", vimeo_url: "",
  thumbnail: "", behind_the_scenes: "", gallery_images: [], has_blog: false, sort_order: 0,
};

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
        const res = JSON.parse(xhr.responseText);
        resolve(res.secure_url);
      } else reject(new Error("Upload failed"));
    };
    xhr.onerror = () => reject(new Error("Upload failed"));
    xhr.send(fd);
  });
};

/* ── Gallery image row ── */
const ImageUrlRow = ({
  url, index, onChange, onRemove, onUpload, uploading,
}: {
  url: string; index: number;
  onChange: (v: string) => void; onRemove: () => void;
  onUpload: (file: File) => void; uploading: boolean;
}) => (
  <div className="flex items-center gap-2">
    <Input
      value={url}
      onChange={(e) => onChange(e.target.value)}
      placeholder={`Image ${index + 1} URL — https://...`}
      className="bg-muted border-border text-foreground text-sm flex-1"
    />
    {url && (
      <img src={url} alt="" className="h-8 w-8 rounded object-cover border border-border flex-shrink-0"
        onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
      />
    )}
    <label className="cursor-pointer">
      <input type="file" accept="image/*,video/*" className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) onUpload(f); }}
      />
      <Button type="button" variant="outline" size="icon" className="h-8 w-8 border-border" asChild>
        <span>{uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}</span>
      </Button>
    </label>
    <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={onRemove}>
      <Trash2 className="h-4 w-4" />
    </Button>
  </div>
);

/* ── Gallery section ── */
const GallerySection = ({ images, onChange }: { images: string[]; onChange: (imgs: string[]) => void }) => {
  const [bulkUploading, setBulkUploading] = useState(false);
  const [rowUploading, setRowUploading] = useState<number | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  const addUrl = () => onChange([...images, ""]);
  const update = (i: number, v: string) => { const n = [...images]; n[i] = v; onChange(n); };
  const remove = (i: number) => { const n = [...images]; n.splice(i, 1); onChange(n); };

  const handleRowUpload = async (i: number, file: File) => {
    setRowUploading(i);
    try {
      const url = await uploadToCloudinary(file, setUploadProgress);
      update(i, url);
    } catch (e: any) { toast.error(e.message); }
    finally { setRowUploading(null); setUploadProgress(0); }
  };

  const handleBulkUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setBulkUploading(true);
    const urls: string[] = [];
    for (let i = 0; i < files.length; i++) {
      try {
        const url = await uploadToCloudinary(files[i], (p) => {
          setUploadProgress(Math.round(((i + p / 100) / files.length) * 100));
        });
        urls.push(url);
      } catch { /* skip */ }
    }
    setBulkUploading(false);
    setUploadProgress(0);
    onChange([...images, ...urls]);
    toast.success(`Uploaded ${urls.length} image${urls.length !== 1 ? "s" : ""}`);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-foreground flex items-center gap-1.5">
          <Images className="h-4 w-4" />
          Gallery Images
          <span className="text-muted-foreground text-xs">({images.filter(Boolean).length} added)</span>
        </Label>
        <div className="flex gap-2">
          <label className="cursor-pointer">
            <input type="file" accept="image/*,video/*" multiple className="hidden" onChange={handleBulkUpload} />
            <Button type="button" variant="outline" size="sm" className="border-border" asChild disabled={bulkUploading}>
              <span><Upload className="h-3.5 w-3.5 mr-1" /> Bulk upload</span>
            </Button>
          </label>
        </div>
      </div>

      {(bulkUploading) && (
        <div className="space-y-1">
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${uploadProgress}%` }} />
          </div>
          <p className="text-xs text-muted-foreground">{uploadProgress}%</p>
        </div>
      )}

      {images.length === 0 && (
        <p className="text-sm text-muted-foreground italic">No gallery images yet. Add URLs or bulk-upload files above.</p>
      )}

      {images.map((url, i) => (
        <ImageUrlRow key={i} url={url} index={i}
          onChange={(v) => update(i, v)} onRemove={() => remove(i)}
          onUpload={(f) => handleRowUpload(i, f)} uploading={rowUploading === i}
        />
      ))}

      <Button type="button" variant="outline" size="sm" className="border-border w-full" onClick={addUrl}>
        <Plus className="h-3.5 w-3.5 mr-1" /> Add image URL
      </Button>

      {images.filter(Boolean).length > 0 && (
        <div>
          <Label className="text-foreground text-xs mb-2 block">Preview</Label>
          <div className="grid grid-cols-6 gap-1.5">
            {images.filter(Boolean).map((url, i) => (
              <img key={i} src={url} alt="" className="aspect-square rounded object-cover border border-border"
                onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

/* ── Main component ── */
const WeddingProjects = () => {
  const [projects, setProjects] = useState<WeddingProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [editProject, setEditProject] = useState<(Partial<WeddingProject> & typeof emptyProject) | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [filter, setFilter] = useState<string>("all");
  const [coverUploading, setCoverUploading] = useState(false);
  const [thumbUploading, setThumbUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => { fetchProjects(); }, []);

  const fetchProjects = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("wedding_projects")
      .select("*")
      .order("project_type")
      .order("sort_order");
    if (!error && data) setProjects(data as WeddingProject[]);
    setLoading(false);
  };

  const handleCoverUpload = async (file: File) => {
    if (!editProject) return;
    setCoverUploading(true);
    setUploadProgress(0);
    try {
      const url = await uploadToCloudinary(file, setUploadProgress);
      setEditProject({ ...editProject, cover_image: url });
      toast.success("Cover uploaded!");
    } catch (e: any) { toast.error(e.message); }
    finally { setCoverUploading(false); setUploadProgress(0); }
  };

  const handleThumbUpload = async (file: File) => {
    if (!editProject) return;
    setThumbUploading(true);
    setUploadProgress(0);
    try {
      const url = await uploadToCloudinary(file, setUploadProgress);
      setEditProject({ ...editProject, thumbnail: url });
      toast.success("Thumbnail uploaded!");
    } catch (e: any) { toast.error(e.message); }
    finally { setThumbUploading(false); setUploadProgress(0); }
  };

  const handleSave = async () => {
    if (!editProject) return;
    try {
      const { id, ...rest } = editProject as WeddingProject;
      if (!rest.slug) {
        rest.slug = rest.couple_name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
      }
      rest.gallery_images = (rest.gallery_images || []).filter((u) => u.trim() !== "");

      if (id) {
        const { error } = await supabase.from("wedding_projects").update(rest).eq("id", id);
        if (error) throw error;
        toast.success("Project updated");
      } else {
        const { error } = await supabase.from("wedding_projects").insert(rest);
        if (error) throw error;
        toast.success("Project added");
      }
      setDialogOpen(false);
      setEditProject(null);
      fetchProjects();
    } catch (e: any) {
      toast.error(e.message || "Failed to save");
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("wedding_projects").delete().eq("id", id);
    if (error) toast.error("Failed to delete");
    else { toast.success("Deleted"); fetchProjects(); }
  };

  const filtered = filter === "all" ? projects : projects.filter(p => p.project_type === filter);

  if (loading) {
    return <div className="flex items-center justify-center py-20"><div className="h-8 w-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Wedding Projects</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage photo stories and film projects — including galleries</p>
        </div>
        <div className="flex gap-2">
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-32 bg-muted border-border"><SelectValue /></SelectTrigger>
            <SelectContent className="bg-card border-border">
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="photo">Photos</SelectItem>
              <SelectItem value="film">Films</SelectItem>
            </SelectContent>
          </Select>
          <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) setEditProject(null); }}>
            <DialogTrigger asChild>
              <Button onClick={() => setEditProject({ ...emptyProject })} className="bg-primary text-primary-foreground">
                <Plus className="mr-2 h-4 w-4" /> Add Project
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border max-w-3xl max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-foreground">{editProject?.id ? "Edit" : "Add"} Wedding Project</DialogTitle>
              </DialogHeader>
              {editProject && (
                <Tabs defaultValue="info" className="w-full">
                  <TabsList className="w-full grid grid-cols-3">
                    <TabsTrigger value="info">Info</TabsTrigger>
                    <TabsTrigger value="media">Media</TabsTrigger>
                    <TabsTrigger value="gallery" className="flex items-center gap-1.5">
                      <Images className="h-3.5 w-3.5" />
                      Gallery
                      {(editProject.gallery_images?.filter(Boolean).length ?? 0) > 0 && (
                        <span className="ml-1 text-[10px] bg-primary/20 text-primary px-1.5 py-0.5 rounded-full">
                          {editProject.gallery_images?.filter(Boolean).length}
                        </span>
                      )}
                    </TabsTrigger>
                  </TabsList>

                  {/* ── INFO TAB ── */}
                  <TabsContent value="info" className="space-y-4 pt-3">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-foreground">Couple Name *</Label>
                        <Input value={editProject.couple_name} onChange={e => setEditProject({ ...editProject, couple_name: e.target.value })} className="bg-muted border-border text-foreground" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-foreground">Slug</Label>
                        <Input value={editProject.slug} onChange={e => setEditProject({ ...editProject, slug: e.target.value })} placeholder="auto-generated" className="bg-muted border-border text-foreground" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-foreground">Location</Label>
                        <Input value={editProject.location} onChange={e => setEditProject({ ...editProject, location: e.target.value })} className="bg-muted border-border text-foreground" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-foreground">Category</Label>
                        <Input value={editProject.category} onChange={e => setEditProject({ ...editProject, category: e.target.value })} placeholder="e.g. Classic Story Telling" className="bg-muted border-border text-foreground" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-foreground">Project Type</Label>
                        <Select value={editProject.project_type} onValueChange={v => setEditProject({ ...editProject, project_type: v })}>
                          <SelectTrigger className="bg-muted border-border"><SelectValue /></SelectTrigger>
                          <SelectContent className="bg-card border-border">
                            <SelectItem value="photo">Photo</SelectItem>
                            <SelectItem value="film">Film</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-foreground">Date</Label>
                        <Input value={editProject.date_text} onChange={e => setEditProject({ ...editProject, date_text: e.target.value })} placeholder="e.g. March 2024" className="bg-muted border-border text-foreground" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-foreground">Tagline</Label>
                      <Input value={editProject.tagline} onChange={e => setEditProject({ ...editProject, tagline: e.target.value })} placeholder="Short romantic tagline" className="bg-muted border-border text-foreground" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-foreground">Description</Label>
                      <Textarea value={editProject.description} onChange={e => setEditProject({ ...editProject, description: e.target.value })} className="bg-muted border-border text-foreground" rows={3} />
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch checked={editProject.has_blog} onCheckedChange={v => setEditProject({ ...editProject, has_blog: v })} />
                      <Label className="text-foreground">Has Blog Post</Label>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-foreground">Sort Order</Label>
                      <Input type="number" value={editProject.sort_order} onChange={e => setEditProject({ ...editProject, sort_order: parseInt(e.target.value) || 0 })} className="bg-muted border-border text-foreground w-24" />
                    </div>
                  </TabsContent>

                  {/* ── MEDIA TAB ── */}
                  <TabsContent value="media" className="space-y-5 pt-3">
                    {/* Cover Image */}
                    <div className="space-y-2">
                      <Label className="text-foreground">Cover / Thumbnail Image</Label>
                      <div className="flex gap-2">
                        <Input value={editProject.cover_image} onChange={e => setEditProject({ ...editProject, cover_image: e.target.value })} placeholder="https://..." className="bg-muted border-border text-foreground flex-1" />
                        <label className="cursor-pointer">
                          <input type="file" accept="image/*,video/*" className="hidden"
                            onChange={e => { const f = e.target.files?.[0]; if (f) handleCoverUpload(f); }}
                          />
                          <Button type="button" variant="outline" size="sm" className="border-border" asChild>
                            <span>
                              {coverUploading ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <Upload className="h-3.5 w-3.5 mr-1" />}
                              {coverUploading ? "…" : "Upload"}
                            </span>
                          </Button>
                        </label>
                      </div>
                      {coverUploading && (
                        <div className="space-y-1">
                          <div className="h-1.5 bg-muted rounded-full overflow-hidden"><div className="h-full bg-primary rounded-full transition-all" style={{ width: `${uploadProgress}%` }} /></div>
                          <p className="text-xs text-muted-foreground">{uploadProgress}%</p>
                        </div>
                      )}
                      {editProject.cover_image && (
                        <div className="relative w-40 h-24 rounded-lg overflow-hidden border border-border">
                          <img src={editProject.cover_image} alt="Cover" className="w-full h-full object-cover"
                            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                          />
                          <button onClick={() => setEditProject({ ...editProject, cover_image: "" })} className="absolute top-1 right-1 bg-background/80 rounded-full p-0.5">
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Thumbnail */}
                    <div className="space-y-2">
                      <Label className="text-foreground">Thumbnail (optional)</Label>
                      <div className="flex gap-2">
                        <Input value={editProject.thumbnail} onChange={e => setEditProject({ ...editProject, thumbnail: e.target.value })} placeholder="https://..." className="bg-muted border-border text-foreground flex-1" />
                        <label className="cursor-pointer">
                          <input type="file" accept="image/*" className="hidden"
                            onChange={e => { const f = e.target.files?.[0]; if (f) handleThumbUpload(f); }}
                          />
                          <Button type="button" variant="outline" size="sm" className="border-border" asChild>
                            <span>
                              {thumbUploading ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <Upload className="h-3.5 w-3.5 mr-1" />}
                              {thumbUploading ? "…" : "Upload"}
                            </span>
                          </Button>
                        </label>
                      </div>
                      {editProject.thumbnail && (
                        <div className="relative w-32 h-20 rounded-lg overflow-hidden border border-border">
                          <img src={editProject.thumbnail} alt="Thumb" className="w-full h-full object-cover" />
                          <button onClick={() => setEditProject({ ...editProject, thumbnail: "" })} className="absolute top-1 right-1 bg-background/80 rounded-full p-0.5"><X className="h-3 w-3" /></button>
                        </div>
                      )}
                    </div>

                    {/* Film Settings */}
                    <div className="space-y-3 border border-border rounded-lg p-4">
                      <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                        <Film className="h-4 w-4" /> Film Settings
                      </h4>
                      <div className="space-y-2">
                        <Label className="text-foreground">Duration</Label>
                        <Input value={editProject.duration} onChange={e => setEditProject({ ...editProject, duration: e.target.value })} placeholder="e.g. 12:34" className="bg-muted border-border text-foreground w-40" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-foreground flex items-center gap-1.5">
                          <svg className="w-3.5 h-3.5 text-primary" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/>
                          </svg>
                          Vimeo Embed URL
                        </Label>
                        <Input
                          value={editProject.vimeo_url}
                          onChange={e => setEditProject({ ...editProject, vimeo_url: e.target.value })}
                          placeholder="https://player.vimeo.com/video/YOUR_VIDEO_ID"
                          className="bg-muted border-border text-foreground font-mono text-sm"
                        />
                        <p className="text-[11px] text-muted-foreground">Vimeo → Share → Embed → copy only the src URL</p>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-foreground">Behind the Scenes</Label>
                        <Textarea value={editProject.behind_the_scenes} onChange={e => setEditProject({ ...editProject, behind_the_scenes: e.target.value })} className="bg-muted border-border text-foreground" rows={3} placeholder="Filming process, equipment, crew notes…" />
                      </div>
                    </div>
                  </TabsContent>

                  {/* ── GALLERY TAB ── */}
                  <TabsContent value="gallery" className="pt-3">
                    <GallerySection
                      images={editProject.gallery_images || []}
                      onChange={(imgs) => setEditProject({ ...editProject, gallery_images: imgs })}
                    />
                  </TabsContent>
                </Tabs>
              )}
              <DialogFooter>
                <DialogClose asChild><Button variant="outline" className="border-border">Cancel</Button></DialogClose>
                <Button onClick={handleSave} className="bg-primary text-primary-foreground">Save Project</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* ── Project List ── */}
      <div className="grid gap-4">
        {filtered.map(project => (
          <Card key={project.id} className="bg-card border-border p-4">
            <div className="flex items-start gap-4">
              <div className="w-20 h-20 rounded-lg bg-muted border border-border overflow-hidden flex-shrink-0">
                {project.cover_image ? (
                  <img src={project.cover_image} alt={project.couple_name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    {project.project_type === "film" ? <Film className="h-6 w-6 text-muted-foreground" /> : <Image className="h-6 w-6 text-muted-foreground" />}
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-semibold text-foreground">{project.couple_name}</h3>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground uppercase tracking-wider">
                    {project.project_type}
                  </span>
                  {project.project_type === "film" && project.vimeo_url && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary uppercase tracking-wider flex items-center gap-1">
                      <LinkIcon className="w-2.5 h-2.5" /> Vimeo
                    </span>
                  )}
                  {(project.gallery_images?.filter(Boolean).length ?? 0) > 0 && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground flex items-center gap-1">
                      <Images className="w-2.5 h-2.5" />
                      {project.gallery_images!.filter(Boolean).length} photos
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">{project.location} • {project.date_text}</p>
                {project.duration && <p className="text-xs text-muted-foreground">Duration: {project.duration}</p>}
                <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{project.description}</p>
              </div>
              <div className="flex gap-1 flex-shrink-0">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditProject(project); setDialogOpen(true); }}>
                  <Edit2 className="h-4 w-4" />
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="bg-card border-border">
                    <AlertDialogHeader>
                      <AlertDialogTitle className="text-foreground">Delete Project</AlertDialogTitle>
                      <AlertDialogDescription>Delete "{project.couple_name}"? This cannot be undone.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="border-border">Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleDelete(project.id)} className="bg-destructive text-destructive-foreground">Delete</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </Card>
        ))}
        {filtered.length === 0 && (
          <p className="text-center text-muted-foreground py-12">No {filter === "all" ? "" : filter} projects yet. Add your first one!</p>
        )}
      </div>
    </div>
  );
};

export default WeddingProjects;
