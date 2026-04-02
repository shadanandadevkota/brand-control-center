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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Image, Film, Type, Link, Images, FileVideo, Copy } from "lucide-react";

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
};

type AddSectionDialogProps = {
  onAdd: (label: string, contentType: string) => void;
  onDuplicate?: (section: Section, newLabel: string) => void;
  existingSections?: Section[];
};

const contentTypes = [
  { value: "image", label: "Photo", icon: Image, description: "Single image upload" },
  { value: "video", label: "Video", icon: Film, description: "Single video upload" },
  { value: "media", label: "Photo / Video", icon: FileVideo, description: "Single photo or video (up to 50MB)" },
  { value: "gallery", label: "Media Gallery", icon: Images, description: "Multiple photos & videos (up to 50MB each)" },
  { value: "text", label: "Text", icon: Type, description: "Text content" },
  { value: "vimeo_url", label: "Vimeo URL", icon: Link, description: "Vimeo video link" },
];

const AddSectionDialog = ({ onAdd, onDuplicate, existingSections = [] }: AddSectionDialogProps) => {
  const [label, setLabel] = useState("");
  const [contentType, setContentType] = useState("");
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState("new");
  const [selectedExisting, setSelectedExisting] = useState("");
  const [duplicateLabel, setDuplicateLabel] = useState("");

  const handleSubmitNew = () => {
    if (!label.trim() || !contentType) return;
    onAdd(label.trim(), contentType);
    resetAndClose();
  };

  const handleSubmitDuplicate = () => {
    if (!selectedExisting || !duplicateLabel.trim() || !onDuplicate) return;
    const section = existingSections.find(s => s.id === selectedExisting);
    if (!section) return;
    onDuplicate(section, duplicateLabel.trim());
    resetAndClose();
  };

  const resetAndClose = () => {
    setLabel("");
    setContentType("");
    setSelectedExisting("");
    setDuplicateLabel("");
    setTab("new");
    setOpen(false);
  };

  const handleExistingSelect = (id: string) => {
    setSelectedExisting(id);
    const section = existingSections.find(s => s.id === id);
    if (section) {
      setDuplicateLabel(`${section.label} (Copy)`);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="border-dashed border-border hover:border-primary hover:text-primary">
          <Plus className="mr-2 h-4 w-4" /> Add New Section
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-card border-border sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-foreground">Add Section</DialogTitle>
        </DialogHeader>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="w-full grid grid-cols-2">
            <TabsTrigger value="new" className="text-xs">
              <Plus className="mr-1 h-3 w-3" /> Create New
            </TabsTrigger>
            <TabsTrigger value="duplicate" className="text-xs" disabled={existingSections.length === 0}>
              <Copy className="mr-1 h-3 w-3" /> Duplicate Existing
            </TabsTrigger>
          </TabsList>

          <TabsContent value="new" className="space-y-4 pt-2">
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
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline" className="border-border">Cancel</Button>
              </DialogClose>
              <Button
                onClick={handleSubmitNew}
                disabled={!label.trim() || !contentType}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                Add Section
              </Button>
            </DialogFooter>
          </TabsContent>

          <TabsContent value="duplicate" className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label className="text-foreground">Select Section to Duplicate</Label>
              <Select value={selectedExisting} onValueChange={handleExistingSelect}>
                <SelectTrigger className="bg-muted border-border text-foreground">
                  <SelectValue placeholder="Choose a section..." />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {existingSections.map((section) => (
                    <SelectItem key={section.id} value={section.id}>
                      <div className="flex items-center gap-2">
                        <span>{section.label}</span>
                        <span className="text-muted-foreground text-xs">— {section.content_type}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-foreground">New Section Name</Label>
              <Input
                value={duplicateLabel}
                onChange={(e) => setDuplicateLabel(e.target.value)}
                placeholder="Name for the duplicated section..."
                className="bg-muted border-border text-foreground"
              />
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline" className="border-border">Cancel</Button>
              </DialogClose>
              <Button
                onClick={handleSubmitDuplicate}
                disabled={!selectedExisting || !duplicateLabel.trim()}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <Copy className="mr-2 h-4 w-4" /> Duplicate Section
              </Button>
            </DialogFooter>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default AddSectionDialog;
