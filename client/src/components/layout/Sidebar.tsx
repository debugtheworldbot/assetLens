import { useLocation, Link } from 'wouter';
import { Home, Wallet, Lightbulb, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { path: '/', label: '体检', icon: Home },
  { path: '/assets', label: '资产', icon: Wallet },
  { path: '/advice', label: '建议', icon: Lightbulb },
  { path: '/settings', label: '设置', icon: Settings },
];

export default function Sidebar() {
  const [location] = useLocation();

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-[220px] flex-col border-r border-border bg-card">
        <div className="p-5 pb-3">
          <h1 className="text-lg font-bold text-foreground tracking-tight">
            <span className="text-warm-orange">Asset</span>
            <span className="text-sage-green">Lens</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">看懂你的资产，守住你的风险</p>
        </div>
        
        <nav className="flex-1 px-3 py-2 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.path;
            return (
              <Link key={item.path} href={item.path}>
                <div
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                    isActive
                      ? 'bg-warm-orange/10 text-warm-orange shadow-sm'
                      : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                  )}
                >
                  <Icon className="w-4.5 h-4.5" />
                  <span>{item.label}</span>
                </div>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-border">
          <p className="text-xs text-muted-foreground text-center">v1.0 · 数据仅存本地</p>
        </div>
      </aside>

      {/* Mobile bottom tab bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border flex items-center justify-around py-2 px-1 safe-area-pb">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location === item.path;
          return (
            <Link key={item.path} href={item.path}>
              <div
                className={cn(
                  'flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg transition-all',
                  isActive
                    ? 'text-warm-orange'
                    : 'text-muted-foreground'
                )}
              >
                <Icon className="w-5 h-5" />
                <span className="text-[10px] font-medium">{item.label}</span>
              </div>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
