import { Card } from "@/components/ui/card";
import { Image, Film, FileText, Eye } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const Dashboard = () => {
  const [stats, setStats] = useState({ media: 0, videos: 0, pages: 9, images: 0 });

  useEffect(() => {
    const fetchStats = async () => {
      const { data: mediaData } = await supabase.from("media_files").select("file_type");
      if (mediaData) {
        setStats({
          media: mediaData.length,
          videos: mediaData.filter((m) => m.file_type === "video").length,
          pages: 9,
          images: mediaData.filter((m) => m.file_type === "image").length,
        });
      }
    };
    fetchStats();
  }, []);

  const statCards = [
    { label: "Total Media", value: String(stats.media), icon: Image },
    { label: "Videos", value: String(stats.videos), icon: Film },
    { label: "Pages", value: String(stats.pages), icon: FileText },
    { label: "Images", value: String(stats.images), icon: Eye },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">Overview of your content</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <Card key={stat.label} className="bg-card border-border p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">{stat.label}</p>
                <p className="text-3xl font-bold text-foreground mt-1">{stat.value}</p>
              </div>
              <stat.icon className="h-8 w-8 text-brand-orange opacity-60" />
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;
