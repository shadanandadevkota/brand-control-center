import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Plus, Trash2, Edit2, BookOpen } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

type BlogPost = {
  id: string;
  slug: string;
  couple_name: string;
  title: string;
  subtitle: string;
  author: string;
  date_text: string;
  read_time: string;
  cover_image: string;
  content: any[];
  tags: string[];
  sort_order: number;
};

const emptyPost: Omit<BlogPost, "id"> = {
  slug: "", couple_name: "", title: "", subtitle: "", author: "The TMF Team",
  date_text: "", read_time: "", cover_image: "", content: [], tags: [], sort_order: 0,
};

const WeddingBlogPosts = () => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [editPost, setEditPost] = useState<Partial<BlogPost> & typeof emptyPost | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [tagsInput, setTagsInput] = useState("");
  const [contentJson, setContentJson] = useState("");

  useEffect(() => { fetchPosts(); }, []);

  const fetchPosts = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("wedding_blog_posts")
      .select("*")
      .order("sort_order");
    if (!error && data) setPosts(data as BlogPost[]);
    setLoading(false);
  };

  const openEdit = (post: BlogPost | null) => {
    if (post) {
      setEditPost(post);
      setTagsInput((post.tags || []).join(", "));
      setContentJson(JSON.stringify(post.content || [], null, 2));
    } else {
      setEditPost({ ...emptyPost });
      setTagsInput("");
      setContentJson("[]");
    }
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!editPost) return;
    try {
      const { id, ...rest } = editPost as BlogPost;
      if (!rest.slug) rest.slug = rest.couple_name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
      rest.tags = tagsInput.split(",").map(t => t.trim()).filter(Boolean);
      try { rest.content = JSON.parse(contentJson); } catch { throw new Error("Invalid JSON in content"); }

      if (id) {
        const { error } = await supabase.from("wedding_blog_posts").update(rest).eq("id", id);
        if (error) throw error;
        toast.success("Blog post updated");
      } else {
        const { error } = await supabase.from("wedding_blog_posts").insert(rest);
        if (error) throw error;
        toast.success("Blog post added");
      }
      setDialogOpen(false);
      setEditPost(null);
      fetchPosts();
    } catch (e: any) {
      toast.error(e.message || "Failed to save");
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("wedding_blog_posts").delete().eq("id", id);
    if (error) toast.error("Failed to delete");
    else { toast.success("Deleted"); fetchPosts(); }
  };

  if (loading) {
    return <div className="flex items-center justify-center py-20"><div className="h-8 w-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Wedding Blog Posts</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage wedding story blog posts</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => openEdit(null)} className="bg-primary text-primary-foreground">
              <Plus className="mr-2 h-4 w-4" /> Add Blog Post
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-foreground">{editPost?.id ? "Edit" : "Add"} Blog Post</DialogTitle>
            </DialogHeader>
            {editPost && (
              <div className="space-y-4 py-2">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-foreground">Couple Name *</Label>
                    <Input value={editPost.couple_name} onChange={e => setEditPost({ ...editPost, couple_name: e.target.value })} className="bg-muted border-border text-foreground" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-foreground">Slug</Label>
                    <Input value={editPost.slug} onChange={e => setEditPost({ ...editPost, slug: e.target.value })} placeholder="auto-generated" className="bg-muted border-border text-foreground" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-foreground">Title *</Label>
                  <Input value={editPost.title} onChange={e => setEditPost({ ...editPost, title: e.target.value })} className="bg-muted border-border text-foreground" />
                </div>
                <div className="space-y-2">
                  <Label className="text-foreground">Subtitle</Label>
                  <Input value={editPost.subtitle} onChange={e => setEditPost({ ...editPost, subtitle: e.target.value })} className="bg-muted border-border text-foreground" />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label className="text-foreground">Author</Label>
                    <Input value={editPost.author} onChange={e => setEditPost({ ...editPost, author: e.target.value })} className="bg-muted border-border text-foreground" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-foreground">Date</Label>
                    <Input value={editPost.date_text} onChange={e => setEditPost({ ...editPost, date_text: e.target.value })} className="bg-muted border-border text-foreground" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-foreground">Read Time</Label>
                    <Input value={editPost.read_time} onChange={e => setEditPost({ ...editPost, read_time: e.target.value })} className="bg-muted border-border text-foreground" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-foreground">Cover Image URL</Label>
                  <Input value={editPost.cover_image} onChange={e => setEditPost({ ...editPost, cover_image: e.target.value })} className="bg-muted border-border text-foreground" />
                </div>
                <div className="space-y-2">
                  <Label className="text-foreground">Tags (comma-separated)</Label>
                  <Input value={tagsInput} onChange={e => setTagsInput(e.target.value)} placeholder="Indian Wedding, Udaipur, Palace" className="bg-muted border-border text-foreground" />
                </div>
                <div className="space-y-2">
                  <Label className="text-foreground">Content (JSON)</Label>
                  <Textarea value={contentJson} onChange={e => setContentJson(e.target.value)} className="bg-muted border-border text-foreground font-mono text-xs" rows={10} placeholder='[{"type":"paragraph","text":"..."},{"type":"heading","text":"..."}]' />
                </div>
                <div className="space-y-2">
                  <Label className="text-foreground">Sort Order</Label>
                  <Input type="number" value={editPost.sort_order} onChange={e => setEditPost({ ...editPost, sort_order: parseInt(e.target.value) || 0 })} className="bg-muted border-border text-foreground w-24" />
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

      <div className="grid gap-4">
        {posts.map(post => (
          <Card key={post.id} className="bg-card border-border p-4">
            <div className="flex items-start gap-4">
              <div className="w-20 h-14 rounded-lg bg-muted border border-border overflow-hidden flex-shrink-0">
                {post.cover_image ? (
                  <img src={post.cover_image} alt={post.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center"><BookOpen className="h-5 w-5 text-muted-foreground" /></div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-foreground">{post.title}</h3>
                <p className="text-sm text-muted-foreground">{post.couple_name} • {post.date_text}</p>
                {post.tags?.length > 0 && (
                  <div className="flex gap-1 mt-1 flex-wrap">
                    {post.tags.map(tag => (
                      <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{tag}</span>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex gap-1 flex-shrink-0">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(post)}>
                  <Edit2 className="h-4 w-4" />
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="bg-card border-border">
                    <AlertDialogHeader>
                      <AlertDialogTitle className="text-foreground">Delete Blog Post</AlertDialogTitle>
                      <AlertDialogDescription>Delete "{post.title}"? This cannot be undone.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="border-border">Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleDelete(post.id)} className="bg-destructive text-destructive-foreground">Delete</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </Card>
        ))}
        {posts.length === 0 && (
          <p className="text-center text-muted-foreground py-12">No blog posts yet. Add your first one!</p>
        )}
      </div>
    </div>
  );
};

export default WeddingBlogPosts;
