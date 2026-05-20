import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import DashboardLayout from "./components/DashboardLayout";
import Home from "./pages/Home";
import CreatePost from "./pages/CreatePost";
import Approval from "./pages/Approval";
import CalendarView from "./pages/CalendarView";
import Themes from "./pages/Themes";
import HistoryView from "./pages/HistoryView";
import Assets from "./pages/Assets";
import Automation from "./pages/Automation";
import PublicationLogs from "@/pages/PublicationLogs";
import Analytics from "@/pages/Analytics";

function Router() {
  return (
    <DashboardLayout>
      <Switch>
        <Route path={"/"} component={Home} />
        <Route path={"/create"} component={CreatePost} />
        <Route path={"/approval"} component={Approval} />
        <Route path={"/calendar"} component={CalendarView} />
        <Route path={"/themes"} component={Themes} />
        <Route path={"/history"} component={HistoryView} />
        <Route path={"/automation"} component={Automation} />
        <Route path={"/assets"} component={Assets} />
        <Route path={"/logs"} component={PublicationLogs} />
        <Route path={"/analytics"} component={Analytics} />
        <Route path={"/404"} component={NotFound} />
        <Route component={NotFound} />
      </Switch>
    </DashboardLayout>
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
