import {
  Home,
  Info,
  Film,
  Camera,
  Tv,
  Heart,
  Image,
  Video,
  BookOpen,
  FolderOpen,
  LayoutDashboard,
  ChevronDown,
  LogOut,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useState } from "react";
import { Button } from "@/components/ui/button";

const mainItems = [
  { title: "Dashboard", url: "/admin/dashboard", icon: LayoutDashboard },
  { title: "Media Library", url: "/admin/media", icon: FolderOpen },
];

const pageItems = [
  { title: "Homepage", url: "/admin/pages/homepage", icon: Home },
  { title: "About Page", url: "/admin/pages/about", icon: Info },
  { title: "Ad Commercials", url: "/admin/pages/ad-commercials", icon: Tv },
  { title: "Fashion Editorial", url: "/admin/pages/fashion-editorial", icon: Camera },
  { title: "Media Production", url: "/admin/pages/media-production", icon: Film },
];

const weddingItems = [
  { title: "Wedding Landing", url: "/admin/pages/wedding-landing", icon: Heart },
  { title: "Wedding Photos", url: "/admin/pages/wedding-photos", icon: Image },
  { title: "Wedding Films", url: "/admin/pages/wedding-films", icon: Video },
  { title: "Wedding Stories", url: "/admin/pages/wedding-stories", icon: BookOpen },
];

export function AdminSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const navigate = useNavigate();
  const [weddingOpen, setWeddingOpen] = useState(
    weddingItems.some((i) => location.pathname === i.url)
  );

  const handleLogout = () => {
    localStorage.removeItem("admin_authenticated");
    navigate("/admin");
  };

  return (
    <Sidebar collapsible="icon" className="border-r border-border">
      <SidebarContent className="bg-sidebar">
        {/* Brand */}
        <div className="p-4 border-b border-border">
          {!collapsed ? (
            <div>
              <h2 className="font-display text-lg tracking-wider text-brand-orange">TMF</h2>
              <p className="text-[10px] tracking-[0.2em] text-muted-foreground uppercase">Admin Panel</p>
            </div>
          ) : (
            <span className="font-display text-sm text-brand-orange">T</span>
          )}
        </div>

        {/* Main Nav */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-muted-foreground text-[10px] tracking-widest uppercase">
            Overview
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end
                      className="hover:bg-sidebar-accent"
                      activeClassName="bg-sidebar-accent text-brand-orange font-semibold"
                    >
                      <item.icon className="mr-2 h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Pages */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-muted-foreground text-[10px] tracking-widest uppercase">
            Pages
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {pageItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end
                      className="hover:bg-sidebar-accent"
                      activeClassName="bg-sidebar-accent text-brand-orange font-semibold"
                    >
                      <item.icon className="mr-2 h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Wedding */}
        <SidebarGroup>
          <Collapsible open={weddingOpen} onOpenChange={setWeddingOpen}>
            <CollapsibleTrigger className="w-full">
              <SidebarGroupLabel className="text-muted-foreground text-[10px] tracking-widest uppercase flex items-center justify-between cursor-pointer w-full">
                Wedding
                {!collapsed && (
                  <ChevronDown
                    className={`h-3 w-3 transition-transform ${weddingOpen ? "rotate-180" : ""}`}
                  />
                )}
              </SidebarGroupLabel>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <SidebarGroupContent>
                <SidebarMenu>
                  {weddingItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild>
                        <NavLink
                          to={item.url}
                          end
                          className="hover:bg-sidebar-accent"
                          activeClassName="bg-sidebar-accent text-brand-orange font-semibold"
                        >
                          <item.icon className="mr-2 h-4 w-4" />
                          {!collapsed && <span>{item.title}</span>}
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </CollapsibleContent>
          </Collapsible>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-border p-3">
        <Button
          variant="ghost"
          onClick={handleLogout}
          className="w-full justify-start text-muted-foreground hover:text-destructive hover:bg-destructive/10"
        >
          <LogOut className="mr-2 h-4 w-4" />
          {!collapsed && "Logout"}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
