import { useState, useMemo, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2, ChevronLeft, ChevronRight, X } from "lucide-react";

const DAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const MONTHS = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

const STATUS_COLOR: Record<string, string> = {
  draft: "bg-gray-400",
  pending: "bg-amber-400",
  approved: "bg-blue-400",
  scheduled: "bg-indigo-400",
  published: "bg-emerald-500",
  rejected: "bg-red-400",
};

const STATUS_LABEL: Record<string, string> = {
  draft: "Rascunho",
  pending: "Pendente",
  approved: "Aprovado",
  scheduled: "Agendado",
  published: "Publicado",
  rejected: "Rejeitado",
};

export default function CalendarView() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<{ day: number; posts: any[] } | null>(null);

  const { data: allPosts, isLoading } = trpc.posts.list.useQuery({});
  const { data: accounts } = trpc.accounts.list.useQuery();

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const calendarDays = useMemo(() => {
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days: (number | null)[] = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(i);
    return days;
  }, [year, month]);

  const postsByDay = useMemo(() => {
    const map: Record<number, any[]> = {};
    if (!allPosts) return map;
    for (const post of allPosts) {
      const date = post.scheduledAt ?? post.createdAt;
      if (!date) continue;
      const d = new Date(date);
      if (d.getFullYear() === year && d.getMonth() === month) {
        const day = d.getDate();
        if (!map[day]) map[day] = [];
        map[day]!.push(post);
      }
    }
    return map;
  }, [allPosts, year, month]);

  const getAccount = useCallback(
    (accountId: number) => accounts?.find((a: any) => a.id === accountId),
    [accounts]
  );

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const today = new Date();

  const handleDayClick = (day: number) => {
    const posts = postsByDay[day];
    if (posts && posts.length > 0) {
      setSelectedDay({ day, posts });
    }
  };

  const totalPosts = allPosts?.length ?? 0;
  const publishedCount = allPosts?.filter((p: any) => p.status === "published").length ?? 0;
  const scheduledCount = allPosts?.filter((p: any) => p.status === "scheduled").length ?? 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Calendário</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {MONTHS[month]} {year} · {totalPosts} posts · {publishedCount} publicados · {scheduledCount} agendados
          </p>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="icon" onClick={prevMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <CardTitle className="text-lg font-extrabold">{MONTHS[month]} {year}</CardTitle>
            <Button variant="ghost" size="icon" onClick={nextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-px bg-border rounded-lg overflow-hidden">
            {DAYS.map((day) => (
              <div key={day} className="bg-muted/50 p-2 text-center">
                <span className="text-xs font-semibold text-muted-foreground">{day}</span>
              </div>
            ))}
            {calendarDays.map((day, i) => {
              const dayPosts = day ? postsByDay[day] : undefined;
              const isToday =
                day === today.getDate() &&
                month === today.getMonth() &&
                year === today.getFullYear();
              const hasPosts = dayPosts && dayPosts.length > 0;

              return (
                <div
                  key={i}
                  onClick={() => day && hasPosts && handleDayClick(day)}
                  className={[
                    "bg-background min-h-[80px] p-1.5 transition-colors",
                    !day ? "bg-muted/20" : "",
                    isToday ? "ring-2 ring-primary ring-inset" : "",
                    hasPosts ? "cursor-pointer hover:bg-muted/30" : "",
                  ].join(" ")}
                >
                  {day && (
                    <>
                      <span className={`text-xs font-mono font-semibold ${
                        isToday ? "text-primary" : "text-muted-foreground"
                      }`}>{day}</span>
                      <div className="mt-0.5 space-y-0.5">
                        {dayPosts?.slice(0, 3).map((post: any) => {
                          const acct = getAccount(post.accountId);
                          return (
                            <div key={post.id} className="flex items-center gap-1 rounded px-1 py-0.5 bg-muted/50">
                              <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${STATUS_COLOR[post.status] ?? "bg-gray-300"}`} />
                              <span className="text-[10px] truncate font-mono">
                                {acct ? `@${acct.handle.substring(0, 8)}` : "?"}
                              </span>
                            </div>
                          );
                        })}
                        {dayPosts && dayPosts.length > 3 && (
                          <span className="text-[10px] text-muted-foreground font-mono px-1">
                            +{dayPosts.length - 3}
                          </span>
                        )}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>

          {/* Legenda */}
          <div className="flex flex-wrap gap-3 mt-4 justify-center">
            {Object.entries(STATUS_LABEL).map(([status, label]) => (
              <div key={status} className="flex items-center gap-1.5">
                <div className={`w-2 h-2 rounded-full ${STATUS_COLOR[status]}`} />
                <span className="text-xs text-muted-foreground">{label}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Dialog de detalhe do dia */}
      <Dialog open={!!selectedDay} onOpenChange={() => setSelectedDay(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {selectedDay && `${selectedDay.day} de ${MONTHS[month]} de ${year}`} · {selectedDay?.posts.length} post{selectedDay?.posts.length !== 1 ? "s" : ""}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
            {selectedDay?.posts.map((post: any) => {
              const acct = getAccount(post.accountId);
              const date = post.scheduledAt ?? post.createdAt;
              return (
                <div key={post.id} className="rounded-lg border border-border p-3 space-y-2">
                  <div className="flex items-center gap-2 justify-between">
                    <span className="font-semibold text-sm">@{acct?.handle ?? "?"}</span>
                    <div className="flex items-center gap-2">
                      {post.theme && <Badge variant="outline" className="text-xs">{post.theme}</Badge>}
                      <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${STATUS_COLOR[post.status]}`} />
                        {STATUS_LABEL[post.status] ?? post.status}
                      </div>
                    </div>
                  </div>
                  {post.caption && (
                    <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed">{post.caption}</p>
                  )}
                  {date && (
                    <p className="text-xs text-muted-foreground font-mono">
                      {new Date(date).toLocaleString("pt-BR")}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
