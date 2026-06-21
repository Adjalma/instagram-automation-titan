import { useAuth } from "@/_core/hooks/useAuth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { useIsMobile } from "@/hooks/useMobile";
import {
  LayoutDashboard, LogOut, PanelLeft, PenSquare, CheckCircle,
  Calendar, BookOpen, Image, History, Zap, ScrollText, BarChart2, Menu, Newspaper, Users, TrendingUp, Target,
} from "lucide-react";
import { CSSProperties, useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DashboardLayoutSkeleton } from './DashboardLayoutSkeleton';

const bottomBarItems = [
  { icon: LayoutDashboard, label: "Início", path: "/" },
  { icon: PenSquare, label: "Criar", path: "/create" },
  { icon: CheckCircle, label: "Aprovar", path: "/approval" },
  { icon: BarChart2, label: "Analytics", path: "/analytics" },
  { icon: Menu, label: "Mais", path: "__menu__" },
];

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/" },
  { icon: PenSquare, label: "Criar Post", path: "/create" },
  { icon: CheckCircle, label: "Aprovação", path: "/approval" },
  { icon: Calendar, label: "Calendário", path: "/calendar" },
  { icon: BookOpen, label: "Cronograma", path: "/themes" },
  { icon: History, label: "Histórico", path: "/history" },
  { icon: Zap, label: "Automação", path: "/automation" },
  { icon: Image, label: "Assets", path: "/assets" },
  { icon: ScrollText, label: "Logs", path: "/logs" },
  { icon: BarChart2, label: "Analytics", path: "/analytics" },
  { icon: Newspaper, label: "Pesquisa Diária", path: "/research" },
  { icon: Users, label: "Contas", path: "/accounts" },
  { icon: TrendingUp, label: "Inteligência", path: "/market-intel" },
  { icon: Target, label: "Plano de Ação", path: "/action-plan" },
];

const SIDEBAR_WIDTH_KEY = "sidebar-width";
const DEFAULT_WIDTH = 256;
const MIN_WIDTH = 200;
const MAX_WIDTH = 380;

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const saved = localStorage.getItem(SIDEBAR_WIDTH_KEY);
    return saved ? parseInt(saved, 10) : DEFAULT_WIDTH;
  });
  const { loading, user, isAuthenticated } = useAuth();
  const [slowLoad, setSlowLoad] = useState(false);

  useEffect(() => {
    localStorage.setItem(SIDEBAR_WIDTH_KEY, sidebarWidth.toString());
  }, [sidebarWidth]);

  useEffect(() => {
    if (!loading) { setSlowLoad(false); return; }
    const t = setTimeout(() => setSlowLoad(true), 12_000);
    return () => clearTimeout(t);
  }, [loading]);

  useEffect(() => {
    if (loading) return;
    if (isAuthenticated) return;
    window.location.replace("/login");
  }, [loading, isAuthenticated]);

  if (loading && !slowLoad) return <DashboardLayoutSkeleton />;

  if (loading && slowLoad) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Carregando… o servidor pode estar lento.</p>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => window.location.reload()}>Atualizar</Button>
          <Button onClick={() => { window.location.href = "/login"; }}>Ir para login</Button>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Redirecionando para login...</p>
        <Button variant="outline" onClick={() => { window.location.href = "/login"; }}>
          Ir para login
        </Button>
      </div>
    );
  }

  return (
    <SidebarProvider
      style={{ "--sidebar-width": `${sidebarWidth}px` } as CSSProperties}
    >
      <DashboardLayoutContent setSidebarWidth={setSidebarWidth}>
        {children}
      </DashboardLayoutContent>
    </SidebarProvider>
  );
}

function DashboardLayoutContent({
  children,
  setSidebarWidth,
}: {
  children: React.ReactNode;
  setSidebarWidth: (w: number) => void;
}) {
  const { user, logout } = useAuth();
  const [location, setLocation] = useLocation();
  const { state, toggleSidebar } = useSidebar();
  const isCollapsed = state === "collapsed";
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();
  const activeMenuItem = menuItems.find(item => item.path === location);

  useEffect(() => {
    if (isCollapsed) setIsResizing(false);
  }, [isCollapsed]);

  useEffect(() => {
    if (isMobile && state === "expanded") toggleSidebar();
  }, [location]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      const left = sidebarRef.current?.getBoundingClientRect().left ?? 0;
      const w = e.clientX - left;
      if (w >= MIN_WIDTH && w <= MAX_WIDTH) setSidebarWidth(w);
    };
    const handleMouseUp = () => setIsResizing(false);
    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    }
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isResizing, setSidebarWidth]);

  return (
    <>
      <div className="relative" ref={sidebarRef}>
        <Sidebar
          collapsible="icon"
          className="border-r-0"
          disableTransition={isResizing}
          style={{
            background: "oklch(0.07 0.02 240)",
            borderRight: "1px solid oklch(0.82 0.18 195 / 12%)",
          }}
        >
          {/* Header da sidebar */}
          <SidebarHeader className="h-14 justify-center" style={{ borderBottom: "1px solid oklch(0.82 0.18 195 / 10%)" }}>
            <div className="flex items-center gap-2 px-2 w-full">
              <button
                onClick={toggleSidebar}
                className="h-8 w-8 flex items-center justify-center rounded-lg transition-all shrink-0"
                style={{ color: "oklch(0.82 0.18 195 / 60%)" }}
                onMouseEnter={e => (e.currentTarget.style.background = "oklch(0.82 0.18 195 / 10%)")}
                onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                aria-label="Toggle navigation"
              >
                <PanelLeft className="h-4 w-4" />
              </button>
              {!isCollapsed && (
                <div className="flex items-center gap-2 min-w-0">
                  <div className="relative h-7 w-7 shrink-0">
                    <img src="/logo.svg" alt="Triarc" className="h-7 w-7 rounded-full object-cover" />
                    <div className="absolute inset-0 rounded-full" style={{ boxShadow: "0 0 10px oklch(0.82 0.18 195 / 40%)" }} />
                  </div>
                  <span className="font-bold tracking-tight truncate text-sm" style={{ fontFamily: "'Orbitron', sans-serif", letterSpacing: "0.05em" }}>
                    Triarc<span style={{ color: "oklch(0.82 0.18 195)", textShadow: "0 0 10px oklch(0.82 0.18 195 / 60%)" }}>SM</span>
                  </span>
                </div>
              )}
            </div>
          </SidebarHeader>

          {/* Menu items */}
          <SidebarContent className="gap-0 py-2">
            <SidebarMenu className="px-2">
              {menuItems.map(item => {
                const isActive = location === item.path;
                return (
                  <SidebarMenuItem key={item.path}>
                    <SidebarMenuButton
                      isActive={isActive}
                      onClick={() => setLocation(item.path)}
                      tooltip={item.label}
                      className="h-9 font-normal transition-all"
                      style={isActive ? {
                        background: "oklch(0.82 0.18 195 / 12%)",
                        color: "oklch(0.82 0.18 195)",
                        borderLeft: "2px solid oklch(0.82 0.18 195)",
                        paddingLeft: "calc(0.5rem - 2px)",
                      } : {
                        color: "oklch(0.65 0.01 240)",
                        borderLeft: "2px solid transparent",
                      }}
                    >
                      <item.icon className="h-4 w-4 shrink-0" style={isActive ? { color: "oklch(0.82 0.18 195)", filter: "drop-shadow(0 0 4px oklch(0.82 0.18 195 / 60%))" } : {}} />
                      <span className="text-xs font-medium">{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarContent>

          {/* Footer */}
          <SidebarFooter className="p-3" style={{ borderTop: "1px solid oklch(0.82 0.18 195 / 10%)" }}>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-3 rounded-lg px-2 py-2 transition-all w-full text-left focus:outline-none"
                  style={{ color: "oklch(0.75 0.01 240)" }}
                  onMouseEnter={e => (e.currentTarget.style.background = "oklch(0.82 0.18 195 / 8%)")}
                  onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                >
                  <Avatar className="h-7 w-7 shrink-0" style={{ border: "1px solid oklch(0.82 0.18 195 / 30%)" }}>
                    <AvatarFallback className="text-xs font-bold" style={{ background: "oklch(0.82 0.18 195 / 15%)", color: "oklch(0.82 0.18 195)" }}>
                      {user?.name?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  {!isCollapsed && (
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold truncate leading-none" style={{ color: "oklch(0.85 0.01 220)" }}>{user?.name || "-"}</p>
                      <p className="text-[10px] truncate mt-0.5" style={{ color: "oklch(0.50 0.02 240)" }}>{user?.email || "-"}</p>
                    </div>
                  )}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuItem onClick={logout} className="cursor-pointer text-destructive focus:text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarFooter>
        </Sidebar>

        {/* Resize handle */}
        {!isMobile && (
          <div
            className={`absolute top-0 right-0 w-1 h-full cursor-col-resize transition-colors ${isCollapsed ? "hidden" : ""}`}
            onMouseDown={() => { if (!isCollapsed) setIsResizing(true); }}
            style={{ zIndex: 50, background: "oklch(0.82 0.18 195 / 0%)" }}
            onMouseEnter={e => (e.currentTarget.style.background = "oklch(0.82 0.18 195 / 20%)")}
            onMouseLeave={e => (e.currentTarget.style.background = "oklch(0.82 0.18 195 / 0%)")}
          />
        )}
      </div>

      <SidebarInset className={isMobile ? "pb-16" : ""} style={{ background: "oklch(0.09 0.02 240)" }}>
        {/* Top bar mobile */}
        {isMobile && (
          <div className="sticky top-0 z-40 flex h-14 items-center gap-3 px-4 backdrop-blur"
            style={{ background: "oklch(0.07 0.02 240 / 95%)", borderBottom: "1px solid oklch(0.82 0.18 195 / 12%)" }}
          >
            <SidebarTrigger className="h-9 w-9 rounded-lg" />
            <div className="flex items-center gap-2">
              <img src="/logo.svg" alt="Triarc" className="h-7 w-7 rounded-full object-cover" />
              <span className="font-semibold text-sm" style={{ color: "oklch(0.85 0.01 220)" }}>
                {activeMenuItem?.label ?? "Triarc SM"}
              </span>
            </div>
          </div>
        )}

        {/* Conteúdo principal */}
        <main className="flex-1 p-4 md:p-6">{children}</main>

        {/* Bottom nav mobile */}
        {isMobile && (
          <nav className="fixed bottom-0 left-0 right-0 z-50 flex h-16 items-center justify-around px-1 backdrop-blur"
            style={{ background: "oklch(0.07 0.02 240 / 95%)", borderTop: "1px solid oklch(0.82 0.18 195 / 12%)" }}
          >
            {bottomBarItems.map(item => {
              const isMore = item.path === "__menu__";
              const isActive = !isMore && location === item.path;
              return (
                <button
                  key={item.path}
                  onClick={() => {
                    if (isMore) toggleSidebar();
                    else setLocation(item.path);
                  }}
                  className="flex flex-col items-center justify-center gap-1 flex-1 h-full rounded-lg transition-all"
                  style={isActive ? { color: "oklch(0.82 0.18 195)" } : { color: "oklch(0.50 0.02 240)" }}
                >
                  <item.icon className="h-5 w-5" style={isActive ? { filter: "drop-shadow(0 0 4px oklch(0.82 0.18 195 / 60%))" } : {}} />
                  <span className="text-[10px] font-medium leading-none">{item.label}</span>
                </button>
              );
            })}
          </nav>
        )}
      </SidebarInset>
    </>
  );
}
