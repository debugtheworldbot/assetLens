import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch, useLocation } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import AppShell from "./components/layout/AppShell";
import Home from "./pages/Home";
import Assets from "./pages/Assets";
import Advice from "./pages/Advice";
import Settings from "./pages/Settings";
import { AnimatePresence, motion } from "framer-motion";

const pageVariants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -4 },
};

const pageTransition = {
  type: "tween" as const,
  ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number],
  duration: 0.25,
};

function AnimatedPage({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={pageTransition}
    >
      {children}
    </motion.div>
  );
}

function Router() {
  const [location] = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Switch key={location}>
        <Route path="/">
          <AnimatedPage><Home /></AnimatedPage>
        </Route>
        <Route path="/assets">
          <AnimatedPage><Assets /></AnimatedPage>
        </Route>
        <Route path="/advice">
          <AnimatedPage><Advice /></AnimatedPage>
        </Route>
        <Route path="/settings">
          <AnimatedPage><Settings /></AnimatedPage>
        </Route>
        <Route>
          <AnimatedPage>
            <div className="flex items-center justify-center h-full">
              <p className="text-muted-foreground">页面未找到</p>
            </div>
          </AnimatedPage>
        </Route>
      </Switch>
    </AnimatePresence>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light" switchable>
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
