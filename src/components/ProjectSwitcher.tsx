import { useProject } from '@/contexts/ProjectContext';
import { HealthBadge } from './HealthBadge';
import { useState, useRef, useEffect } from 'react';

export function ProjectSwitcher() {
  const { projects, activeProject, setActiveProjectId } = useProject();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="w-full text-left p-3 rounded-lg hover:bg-secondary/50 transition-colors border border-border/50"
      >
        <div className="text-xs text-muted-foreground font-display mb-1">ACTIVE PROJECT</div>
        {activeProject ? (
          <>
            <div className="text-sm text-foreground font-medium truncate">{activeProject.name}</div>
            <div className="flex items-center gap-2 mt-1">
              <HealthBadge status={activeProject.healthStatus} label={`${activeProject.healthScore}%`} />
              <span className="text-[10px] text-muted-foreground">▼</span>
            </div>
          </>
        ) : (
          <div className="text-sm text-health-yellow">No project selected</div>
        )}
      </button>

      {open && (
        <div className="absolute bottom-full left-0 right-0 mb-1 bg-card border border-border rounded-lg shadow-xl z-[60] overflow-hidden">
          <div className="text-[10px] font-display text-muted-foreground px-3 pt-2 pb-1 uppercase tracking-wider">
            Switch Project
          </div>
          {projects.map(p => (
            <button
              key={p.id}
              onClick={() => { setActiveProjectId(p.id); setOpen(false); }}
              className={`w-full text-left px-3 py-2.5 hover:bg-secondary/50 transition-colors flex items-center justify-between ${
                p.id === activeProject?.id ? 'bg-primary/10' : ''
              }`}
            >
              <div>
                <div className="text-sm font-medium truncate">{p.name}</div>
                <div className="text-xs text-muted-foreground">{p.deadline}</div>
              </div>
              <HealthBadge status={p.healthStatus} label={`${p.healthScore}%`} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
