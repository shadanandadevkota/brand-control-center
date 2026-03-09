import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Image, Film, Type, Link, Images } from "lucide-react";

type AddSectionDialogProps = {
  onAdd: (label: string, contentType: string) => void;
};

const contentTypes = [
  { value: "image", label: "Photo", icon: Image, description: "Single image upload" },
  { value: "video", label: "Video", icon: Film, description: "Single video upload" },
  { value: "gallery", label: "Photo Gallery", icon: Images, description: "Multiple images" },
  { value: "text", label: "Text", icon: Type, description: "Text content" },
  { value: "vimeo_url", label: "Vimeo URL", icon: Link, description: "Vimeo video link" },
];

const AddSectionDialog = ({ onAdd }: AddSectionDialogProps) => {
  const [label, setLabel] = useState("");
  const [contentType, setContentType] = useState("");
  const [open, setOpen] = useState(false);

  const handleSubmit = () => {
    if (!label.trim() || !contentType) return;
    onAdd(label.trim(), contentType);
    setLabel("");
    setContentType("");
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="border-dashed border-border hover:border-primary hover:text-primary">
          <Plus className="mr-2 h-4 w-4" /> Add New Section
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground">Add New Section</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label className="text-foreground">Section Name</Label>
            <Input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g. Hero Photo, Behind the Scenes..."
              className="bg-muted border-border text-foreground"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-foreground">Content Type</Label>
            <Select value={contentType} onValueChange={setContentType}>
              <SelectTrigger className="bg-muted border-border text-foreground">
                <SelectValue placeholder="Select type..." />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                {contentTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    <div className="flex items-center gap-2">
                      <type.icon className="h-4 w-4 text-muted-foreground" />
                      <span>{type.label}</span>
                      <span className="text-muted-foreground text-xs">— {type.description}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" className="border-border">Cancel</Button>
          </DialogClose>
          <Button
            onClick={handleSubmit}
            disabled={!label.trim() || !contentType}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            Add Section
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddSectionDialog;
