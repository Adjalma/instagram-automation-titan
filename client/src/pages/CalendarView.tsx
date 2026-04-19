import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, ChevronLeft, ChevronRight, Instagram } from "lucide-react";

const DAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const MONTHS = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

export default function CalendarView() {
  const [currentDate, setCurrentDate] = useState(new Date());
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
    const map: Record<number, typeof allPosts> = {};
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

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const getAccount = (accountId: number) => accounts?.find(a => a.id === accountId);

  const statusColor: Record<string, string> = {
    draft: "bg-gray-300",
    pending: "bg-amber-400",
    approved: "bg-blue-400",
    scheduled: "bg-indigo-400",
    published: "bg-emerald-400",
    rejected: "bg-red-400",
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Calendário</h1>
        <p className="label-mono mt-1">Agendamento visual // {MONTHS[month]} {year}</p>
      </div>

      <Card className="card-blueprint">
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
            {DAYS.map(day => (
              <div key={day} className="bg-muted/50 p-2 text-center">
                <span className="label-mono">{day}</span>
              </div>
            ))}
            {calendarDays.map((day, i) => {
              const dayPosts = day ? postsByDay[day] : undefined;
              const isToday = day === new Date().getDate() && month === new Date().getMonth() && year === new Date().getFullYear();
              return (
                <div key={i} className={`bg-background min-h-[80px] p-1.5 ${!day ? "bg-muted/20" : ""} ${isToday ? "ring-2 ring-primary ring-inset" : ""}`}>
                  {day && (
                    <>
                      <span className={`text-xs font-mono font-semibold ${isToday ? "text-primary" : "text-muted-foreground"}`}>{day}</span>
                      <div className="mt-0.5 space-y-0.5">
                        {dayPosts?.slice(0, 3).map(post => {
                          const acct = getAccount(post.accountId);
                          return (
                            <div key={post.id} className="flex items-center gap-1 rounded px-1 py-0.5 bg-muted/50 hover:bg-muted transition-colors">
                              <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${statusColor[post.status] ?? "bg-gray-300"}`} />
                              <span className="text-[10px] truncate font-mono">{acct ? `@${acct.handle.substring(0, 8)}` : "?"}</span>
                            </div>
                          );
                        })}
                        {dayPosts && dayPosts.length > 3 && (
                          <span className="text-[10px] text-muted-foreground font-mono px-1">+{dayPosts.length - 3}</span>
                        )}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex flex-wrap gap-3 mt-4 justify-center">
            {Object.entries(statusColor).map(([status, color]) => (
              <div key={status} className="flex items-center gap-1.5">
                <div className={`w-2 h-2 rounded-full ${color}`} />
                <span className="label-mono">{status}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
