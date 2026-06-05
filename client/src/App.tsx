import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import PageLoader from "./components/PageLoader";
import { ThemeProvider } from "./contexts/ThemeContext";
import DashboardLayout from "./components/DashboardLayout";
import Login from "./pages/Login";
import Privacy from "./pages/Privacy";

const Home = lazy(() => import("./pages/Home"));
const CreatePost = lazy(() => import("./pages/CreatePost"));
const Approval = lazy(() => import("./pages/Approval"));
const CalendarView = lazy(() => import("./pages/CalendarView"));
const Themes = lazy(() => import("./pages/Themes"));
const HistoryView = lazy(() => import("./pages/HistoryView"));
const Assets = lazy(() => import("./pages/Assets"));
const Automation = lazy(() => import("./pages/Automation"));
const PublicationLogs = lazy(() => import("@/pages/PublicationLogs"));
const Analytics = lazy(() => import("@/pages/Analytics"));
const Research = lazy(() => import("@/pages/Research"));
const Accounts = lazy(() => import("@/pages/Accounts"));
const MarketIntel = lazy(() => import("@/pages/MarketIntel"));
const ActionPlan = lazy(() => import("@/pages/ActionPlan"));

function LazyPage({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<PageLoader />}>{children}</Suspense>;
}

function DashboardRoutes() {
  return (
    <Switch>
      <Route path="/">
        <LazyPage><Home /></LazyPage>
      </Route>
      <Route path="/create">
        <LazyPage><CreatePost /></LazyPage>
      </Route>
      <Route path="/approval">
        <LazyPage><Approval /></LazyPage>
      </Route>
      <Route path="/calendar">
        <LazyPage><CalendarView /></LazyPage>
      </Route>
      <Route path="/themes">
        <LazyPage><Themes /></LazyPage>
      </Route>
      <Route path="/history">
        <LazyPage><HistoryView /></LazyPage>
      </Route>
      <Route path="/automation">
        <LazyPage><Automation /></LazyPage>
      </Route>
      <Route path="/assets">
        <LazyPage><Assets /></LazyPage>
      </Route>
      <Route path="/logs">
        <LazyPage><PublicationLogs /></LazyPage>
      </Route>
      <Route path="/analytics">
        <LazyPage><Analytics /></LazyPage>
      </Route>
      <Route path="/research">
        <LazyPage><Research /></LazyPage>
      </Route>
      <Route path="/accounts">
        <LazyPage><Accounts /></LazyPage>
      </Route>
      <Route path="/market-intel">
        <LazyPage><MarketIntel /></LazyPage>
      </Route>
      <Route path="/action-plan">
        <LazyPage><ActionPlan /></LazyPage>
      </Route>
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/privacidade" component={Privacy} />
      <Route nest path="/">
        <DashboardLayout>
          <DashboardRoutes />
        </DashboardLayout>
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
