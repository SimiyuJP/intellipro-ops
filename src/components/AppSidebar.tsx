import { Link, useLocation } from 'react-router-dom';
import { ProjectSwitcher } from './ProjectSwitcher';
import { GlobalSearch, useGlobalSearch } from './GlobalSearch';

const navGroups = [
  {
    label: 'Project',
    items: [
      { path: '/dashboard', label: 'Home', icon: '◈' },
      { path: '/about', label: 'Overview', icon: '▦' },
      { path: '/rooms', label: 'Rooms', icon: '⬡' },
      { path: '/people', label: 'People', icon: '👤' },
      { path: '/decisions', label: 'Decisions', icon: '⚖' },
      { path: '/meetings', label: 'Meetings', icon: '📅' },
      { path: '/alerts', label: 'Alerts', icon: '🚩' },
    ],
  },
  {
    label: 'Layers',
    items: [
      { path: '/intelligence', label: 'Intelligence', icon: '🧠' },
      { path: '/visibility', label: 'Visibility', icon: '👁' },
      { path: '/predictive', label: 'Predictive', icon: '🔮' },
      { path: '/accountability', label: 'Accountability', icon: '🤝' },
      { path: '/memory', label: 'Memory', icon: '📋' },
    ],
  },
  {
    label: 'Tools',
    items: [
      { path: '/chat', label: 'Command', icon: '▸' },
      { path: '/report', label: 'Report', icon: '📄' },
      { path: '/brief', label: 'New Project', icon: '+' },
    ],
  },
];

export function AppSidebar() {
  const location = useLocation();
  const { open, setOpen } = useGlobalSearch();

  return (
    <>
      <GlobalSearch open={open} onClose={() => setOpen(false)} />
      <aside className="fixed left-0 top-0 bottom-0 w-64 bg-card border-r border-border flex flex-col z-50">
        <div className="p-4 border-b border-border space-y-3">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-primary/20 flex items-center justify-center">
              <span className="text-primary font-display font-bold text-sm">PP</span>
            </div>
            <span className="font-display font-bold text-foreground text-sm tracking-tight">
              PROJECT PULSE
            </span>
          </Link>
          <button
            data-testid="global-search-trigger"
            onClick={() => setOpen(true)}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary/60 hover:bg-secondary transition-colors text-left"
          >
            <span className="text-muted-foreground text-xs">🔍</span>
            <span className="text-xs text-muted-foreground flex-1">Search anything…</span>
            <kbd className="text-[9px] font-display text-muted-foreground/60 bg-background px-1 py-0.5 rounded border border-border flex items-center gap-0.5">
              <span>⌘</span><span>K</span>
            </kbd>
          </button>
        </div>

        <nav className="flex-1 p-3 space-y-4 overflow-y-auto">
          {navGroups.map((group) => (
            <div key={group.label}>
              <div className="px-3 py-1 text-[10px] font-display text-muted-foreground/50 uppercase tracking-widest">
                {group.label}
              </div>
              <div className="space-y-0.5 mt-1">
                {group.items.map((item) => {
                  const isActive = location.pathname === item.path;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-display transition-colors ${
                        isActive
                          ? 'bg-primary/10 text-primary'
                          : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
                      }`}
                    >
                      <span className="text-base">{item.icon}</span>
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="p-3 border-t border-border">
          <ProjectSwitcher />
        </div>
      </aside>
    </>
  );
}
