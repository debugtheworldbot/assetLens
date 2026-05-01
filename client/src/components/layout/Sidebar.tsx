import { useLocation, Link } from 'wouter';
import { Home, Wallet, Lightbulb, Settings, Moon, Sun } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/contexts/ThemeContext';

const navItems = [
  { path: '/', label: '体检', icon: Home },
  { path: '/assets', label: '资产', icon: Wallet },
  { path: '/advice', label: '建议', icon: Lightbulb },
  { path: '/settings', label: '设置', icon: Settings },
];

export default function Sidebar() {
  const [location] = useLocation();
  const { theme, toggleTheme } = useTheme();

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-[240px] flex-col bg-sidebar border-r border-sidebar-border">
        {/* Logo */}
        <div className="px-6 py-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-warm-orange to-sand-gold flex items-center justify-center">
              <span className="text-white font-bold text-sm">A</span>
            </div>
            <div>
              <h1 className="text-base font-semibold text-foreground tracking-tight">
                AssetLens
              </h1>
              <p className="text-[10px] text-muted-foreground leading-tight">资产管理</p>
            </div>
          </div>
        </div>

        <Separator className="mx-4 w-auto" />

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.path;
            return (
              <Link key={item.path} href={item.path}>
                <motion.div
                  className={cn(
                    'relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors',
                    isActive
                      ? 'text-primary'
                      : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                  )}
                  whileHover={{ x: 2 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                >
                  {isActive && (
                    <motion.div
                      layoutId="sidebar-active"
                      className="absolute inset-0 bg-primary/8 border border-primary/15 rounded-xl"
                      transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                    />
                  )}
                  <Icon className="w-[18px] h-[18px] relative z-10" />
                  <span className="relative z-10">{item.label}</span>
                </motion.div>
              </Link>
            );
          })}
        </nav>

        {/* Footer with theme toggle */}
        <div className="px-4 py-4 space-y-3">
          <div className="flex items-center justify-center">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleTheme}
                  className="h-8 w-8 rounded-lg"
                >
                  {theme === 'dark' ? (
                    <Sun className="w-4 h-4 text-muted-foreground" />
                  ) : (
                    <Moon className="w-4 h-4 text-muted-foreground" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right" className="text-xs">
                {theme === 'dark' ? '切换到浅色模式' : '切换到深色模式'}
              </TooltipContent>
            </Tooltip>
          </div>
          <div className="px-3 py-2.5 rounded-xl bg-muted/50">
            <p className="text-[10px] text-muted-foreground text-center">
              数据仅存本地 · v1.0
            </p>
          </div>
        </div>
      </aside>

      {/* Mobile bottom tab bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-card/80 backdrop-blur-xl border-t border-border flex items-center justify-around py-2 px-2 safe-area-pb">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location === item.path;
          return (
            <Link key={item.path} href={item.path}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <motion.div
                    className={cn(
                      'relative flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-xl transition-colors',
                      isActive
                        ? 'text-primary'
                        : 'text-muted-foreground'
                    )}
                    whileTap={{ scale: 0.9 }}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="mobile-tab-active"
                        className="absolute inset-0 bg-primary/8 rounded-xl"
                        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                      />
                    )}
                    <Icon className="w-5 h-5 relative z-10" />
                    <span className="text-[10px] font-medium relative z-10">{item.label}</span>
                  </motion.div>
                </TooltipTrigger>
                <TooltipContent side="top" className="text-xs">
                  {item.label}
                </TooltipContent>
              </Tooltip>
            </Link>
          );
        })}
        {/* Mobile theme toggle */}
        <Tooltip>
          <TooltipTrigger asChild>
            <motion.div
              className="relative flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-xl text-muted-foreground"
              whileTap={{ scale: 0.9 }}
              onClick={toggleTheme}
            >
              {theme === 'dark' ? (
                <Sun className="w-5 h-5 relative z-10" />
              ) : (
                <Moon className="w-5 h-5 relative z-10" />
              )}
              <span className="text-[10px] font-medium relative z-10">主题</span>
            </motion.div>
          </TooltipTrigger>
          <TooltipContent side="top" className="text-xs">
            {theme === 'dark' ? '浅色模式' : '深色模式'}
          </TooltipContent>
        </Tooltip>
      </nav>
    </>
  );
}
