import { Card } from "@/components/ui/card";
import { Image, Film, FileText, Eye } from "lucide-react";

const stats = [
  { label: "Total Media", value: "147", icon: Image, color: "text-brand-orange" },
  { label: "Videos", value: "23", icon: Film, color: "text-brand-orange" },
  { label: "Pages", value: "12", icon: FileText, color: "text-brand-orange" },
  { label: "Page Views", value: "2.4k", icon: Eye, color: "text-brand-orange" },
];

const recentActivity = [
  { action: "Updated Homepage showreel", time: "2 hours ago" },
  { action: "Added new wedding photos", time: "5 hours ago" },
  { action: "Modified About page content", time: "1 day ago" },
  { action: "Uploaded fashion editorial images", time: "2 days ago" },
  { action: "Updated media production stills", time: "3 days ago" },
];

const Dashboard = () => {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">Overview of your content</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="bg-card border-border p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">{stat.label}</p>
                <p className="text-3xl font-bold text-foreground mt-1">{stat.value}</p>
              </div>
              <stat.icon className={`h-8 w-8 ${stat.color} opacity-60`} />
            </div>
          </Card>
        ))}
      </div>

      {/* Recent Activity */}
      <Card className="bg-card border-border p-6">
        <h2 className="text-lg font-bold text-foreground mb-4">Recent Activity</h2>
        <div className="space-y-3">
          {recentActivity.map((item, i) => (
            <div key={i} className="flex items-center justify-between py-2 border-b border-border last:border-0">
              <span className="text-sm text-foreground">{item.action}</span>
              <span className="text-xs text-muted-foreground">{item.time}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default Dashboard;
