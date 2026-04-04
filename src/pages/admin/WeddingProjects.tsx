import { useEffect, useState, useRef } from "react";
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
import { Plus, Trash2, Edit2, Image, Film, Upload, Loader2, X } from "lucide-react";
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
  video_url: string;
  thumbnail: string;
  behind_the_scenes: string;
  images: string[];
  has_blog: boolean;
  sort_order: number;
};

const emptyProject: Omit<WeddingProject, "id"> = {
  slug: "", couple_name: "", location: "", category: "", description: "", tagline: "",
  cover_image: "", date_text: "", project_type: "photo", duration: "", video_url: "",
  thumbnail: "", behind_the_scenes: "", images: [], has_blog: false, sort_order: 0,
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

const WeddingProjects = () => {
  const [projects, setProjects] = useState<WeddingProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [editProject, setEditProject] = useState<Partial<WeddingProject> & typeof emptyProject | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [filter, setFilter] = useState<string>("all");
  const [uploading, setUploading] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const thumbInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

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

  const handleUpload = async (field: "cover_image" | "thumbnail", file: File) => {
    if (!editProject) return;
    setUploading(field);
    setUploadProgress(0);
    try {
      const url = await uploadToCloudinary(file, setUploadProgress);
      setEditProject({ ...editProject, [field]: url });
      toast.success("Uploaded!");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setUploading(null);
      setUploadProgress(0);
    }
  };

  const handleGalleryUpload = async (files: FileList) => {
    if (!editProject) return;
    setUploading("gallery");
    setUploadProgress(0);
    const newImages = [...(editProject.images || [])];
    for (let i = 0; i < files.length; i++) {
      try {
        const url = await uploadToCloudinary(files[i], (p) => {
          setUploadProgress(Math.round(((i + p / 100) / files.length) * 100));
        });
        newImages.push(url);
      } catch (e: any) {
        toast.error(`Failed: ${files[i].name}`);
      }
    }
    setEditProject({ ...editProject, images: newImages });
    setUploading(null);
    setUploadProgress(0);
  };

  const handleSave = async () => {
    if (!editProject) return;
    try {
      const { id, ...rest } = editProject as WeddingProject;
      if (!rest.slug) rest.slug = rest.couple_name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
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
          <p className="text-muted-foreground text-sm mt-1">Manage photo stories and film projects</p>
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
            <DialogContent className="bg-card border-border max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-foreground">{editProject?.id ? "Edit" : "Add"} Wedding Project</DialogTitle>
              </DialogHeader>
              {editProject && (
                <div className="space-y-4 py-2">
                  {/* Basic Info */}
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
                      <Input value={editProject.category} onChange={e => setEditProject({ ...editProject, category: e.target.value })} className="bg-muted border-border text-foreground" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-foreground">Type</Label>
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
                      <Input value={editProject.date_text} onChange={e => setEditProject({ ...editProject, date_text: e.target.value })} className="bg-muted border-border text-foreground" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-foreground">Description</Label>
                    <Textarea value={editProject.description} onChange={e => setEditProject({ ...editProject, description: e.target.value })} className="bg-muted border-border text-foreground" rows={3} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-foreground">Tagline</Label>
                    <Input value={editProject.tagline} onChange={e => setEditProject({ ...editProject, tagline: e.target.value })} className="bg-muted border-border text-foreground" />
                  </div>

                  {/* Cover Image - Upload or URL */}
                  <div className="space-y-2">
                    <Label className="text-foreground">Cover Image</Label>
                    <div className="flex gap-2">
                      <Input value={editProject.cover_image} onChange={e => setEditProject({ ...editProject, cover_image: e.target.value })} placeholder="Paste URL or upload" className="bg-muted border-border text-foreground flex-1" />
                      <input ref={coverInputRef} type="file" accept="image/*,video/*" className="hidden" onChange={e => e.target.files?.[0] && handleUpload("cover_image", e.target.files[0])} />
                      <Button type="button" variant="outline" size="icon" className="border-border" onClick={() => coverInputRef.current?.click()} disabled={uploading === "cover_image"}>
                        {uploading === "cover_image" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                      </Button>
                    </div>
                    {uploading === "cover_image" && (
                      <div className="space-y-1">
                        <div className="h-1.5 bg-muted rounded-full overflow-hidden"><div className="h-full bg-primary rounded-full transition-all" style={{ width: `${uploadProgress}%` }} /></div>
                        <p className="text-xs text-muted-foreground">{uploadProgress}%</p>
                      </div>
                    )}
                    {editProject.cover_image && (
                      <div className="relative w-32 h-20 rounded-lg overflow-hidden border border-border">
                        <img src={editProject.cover_image} alt="Cover" className="w-full h-full object-cover" />
                        <button onClick={() => setEditProject({ ...editProject, cover_image: "" })} className="absolute top-1 right-1 bg-background/80 rounded-full p-0.5"><X className="h-3 w-3" /></button>
                      </div>
                    )}
                  </div>

                  {/* Thumbnail - Upload or URL */}
                  <div className="space-y-2">
                    <Label className="text-foreground">Thumbnail</Label>
                    <div className="flex gap-2">
                      <Input value={editProject.thumbnail} onChange={e => setEditProject({ ...editProject, thumbnail: e.target.value })} placeholder="Paste URL or upload" className="bg-muted border-border text-foreground flex-1" />
                      <input ref={thumbInputRef} type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && handleUpload("thumbnail", e.target.files[0])} />
                      <Button type="button" variant="outline" size="icon" className="border-border" onClick={() => thumbInputRef.current?.click()} disabled={uploading === "thumbnail"}>
                        {uploading === "thumbnail" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                      </Button>
                    </div>
                    {uploading === "thumbnail" && (
                      <div className="space-y-1">
                        <div className="h-1.5 bg-muted rounded-full overflow-hidden"><div className="h-full bg-primary rounded-full transition-all" style={{ width: `${uploadProgress}%` }} /></div>
                        <p className="text-xs text-muted-foreground">{uploadProgress}%</p>
                      </div>
                    )}
                    {editProject.thumbnail && (
                      <div className="relative w-32 h-20 rounded-lg overflow-hidden border border-border">
                        <img src={editProject.thumbnail} alt="Thumb" className="w-full h-full object-cover" />
                        <button onClick={() => setEditProject({ ...editProject, thumbnail: "" })} className="absolute top-1 right-1 bg-background/80 rounded-full p-0.5"><X className="h-3 w-3" /></button>
                      </div>
                    )}
                  </div>

                  {/* Video URL - always visible */}
                  <div className="space-y-2">
                    <Label className="text-foreground">Video URL (Vimeo / YouTube)</Label>
                    <Input value={editProject.video_url} onChange={e => setEditProject({ ...editProject, video_url: e.target.value })} placeholder="https://vimeo.com/..." className="bg-muted border-border text-foreground" />
                  </div>

                  {/* Film-specific fields */}
                  {editProject.project_type === "film" && (
                    <>
                      <div className="space-y-2">
                        <Label className="text-foreground">Duration</Label>
                        <Input value={editProject.duration} onChange={e => setEditProject({ ...editProject, duration: e.target.value })} placeholder="e.g. 8:32" className="bg-muted border-border text-foreground" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-foreground">Behind the Scenes</Label>
                        <Textarea value={editProject.behind_the_scenes} onChange={e => setEditProject({ ...editProject, behind_the_scenes: e.target.value })} className="bg-muted border-border text-foreground" rows={3} />
                      </div>
                    </>
                  )}

                  {/* Gallery Images */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-foreground">Gallery Images ({editProject.images?.length || 0})</Label>
                      <div>
                        <input ref={galleryInputRef} type="file" accept="image/*" multiple className="hidden" onChange={e => e.target.files && handleGalleryUpload(e.target.files)} />
                        <Button type="button" variant="outline" size="sm" className="border-border" onClick={() => galleryInputRef.current?.click()} disabled={uploading === "gallery"}>
                          {uploading === "gallery" ? <><Loader2 className="h-3 w-3 animate-spin mr-1" /> Uploading...</> : <><Upload className="h-3 w-3 mr-1" /> Add Images</>}
                        </Button>
                      </div>
                    </div>
                    {uploading === "gallery" && (
                      <div className="space-y-1">
                        <div className="h-1.5 bg-muted rounded-full overflow-hidden"><div className="h-full bg-primary rounded-full transition-all" style={{ width: `${uploadProgress}%` }} /></div>
                        <p className="text-xs text-muted-foreground">{uploadProgress}%</p>
                      </div>
                    )}
                    {editProject.images && editProject.images.length > 0 && (
                      <div className="grid grid-cols-4 gap-2">
                        {editProject.images.map((img, i) => (
                          <div key={i} className="relative aspect-square rounded-lg overflow-hidden border border-border">
                            <img src={img} alt="" className="w-full h-full object-cover" />
                            <button onClick={() => {
                              const imgs = [...editProject.images!];
                              imgs.splice(i, 1);
                              setEditProject({ ...editProject, images: imgs });
                            }} className="absolute top-1 right-1 bg-background/80 rounded-full p-0.5"><X className="h-3 w-3" /></button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <Switch checked={editProject.has_blog} onCheckedChange={v => setEditProject({ ...editProject, has_blog: v })} />
                    <Label className="text-foreground">Has Blog Post</Label>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-foreground">Sort Order</Label>
                    <Input type="number" value={editProject.sort_order} onChange={e => setEditProject({ ...editProject, sort_order: parseInt(e.target.value) || 0 })} className="bg-muted border-border text-foreground w-24" />
                  </div>
                </div>
              )}
              <DialogFooter>
                <DialogClose asChild><Button variant="outline" className="border-border">Cancel</Button></DialogClose>
                <Button onClick={handleSave} className="bg-primary text-primary-foreground">Save</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

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
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-foreground">{project.couple_name}</h3>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground uppercase tracking-wider">
                    {project.project_type}
                  </span>
                  {project.video_url && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary uppercase tracking-wider">
                      Video
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">{project.location} • {project.date_text}</p>
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
          <p className="text-center text-muted-foreground py-12">No projects yet. Add your first one!</p>
        )}
      </div>
    </div>
  );
};

export default WeddingProjects;
