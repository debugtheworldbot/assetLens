import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import AppShell from "./components/layout/AppShell";
import Home from "./pages/Home";
import Assets from "./pages/Assets";
import Advice from "./pages/Advice";
import Settings from "./pages/Settings";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/assets" component={Assets} />
      <Route path="/advice" component={Advice} />
      <Route path="/settings" component={Settings} />
      <Route>
        <div className="flex items-center justify-center h-full">
          <p className="text-muted-foreground">页面未找到</p>
        </div>
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
          <AppShell>
            <Router />
          </AppShell>
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
