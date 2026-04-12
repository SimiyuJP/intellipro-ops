import { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { Project, ChatMessage, Deliverable } from '@/types/project';
import { seedProject } from '@/data/seedProject';
import { seedBrandingProject } from '@/data/seedBrandingProject';

const initialProjects: Project[] = [structuredClone(seedProject), structuredClone(seedBrandingProject)];

interface ProjectContextType {
  projects: Project[];
  activeProject: Project | null;
  activeProjectId: string | null;
  setActiveProjectId: (id: string | null) => void;
  chatHistory: Record<string, ChatMessage[]>;
  setChatMessages: (projectId: string, messages: ChatMessage[]) => void;
  getChatMessages: (projectId: string) => ChatMessage[];
  addDeliverable: (roomId: string, deliverable: Deliverable) => void;
  updateDeliverable: (roomId: string, deliverableId: string, updates: Partial<Deliverable>) => void;
  deleteDeliverable: (roomId: string, deliverableId: string) => void;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export function ProjectProvider({ children }: { children: ReactNode }) {
  const [projects, setProjects] = useState<Project[]>(initialProjects);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(projects[0].id);
  const [chatHistory, setChatHistory] = useState<Record<string, ChatMessage[]>>({});

  const activeProject = projects.find(p => p.id === activeProjectId) ?? null;

  const setChatMessages = useCallback((projectId: string, messages: ChatMessage[]) => {
    setChatHistory(prev => ({ ...prev, [projectId]: messages }));
  }, []);

  const getChatMessages = useCallback((projectId: string) => {
    return chatHistory[projectId] ?? [];
  }, [chatHistory]);

  const updateProjectRooms = useCallback((updater: (projects: Project[]) => Project[]) => {
    setProjects(updater);
  }, []);

  const addDeliverable = useCallback((roomId: string, deliverable: Deliverable) => {
    updateProjectRooms(prev => prev.map(p => {
      if (p.id !== activeProjectId) return p;
      return {
        ...p,
        rooms: p.rooms.map(r => {
          if (r.id !== roomId) return r;
          return { ...r, deliverables: [...r.deliverables, deliverable] };
        }),
      };
    }));
  }, [activeProjectId, updateProjectRooms]);

  const updateDeliverable = useCallback((roomId: string, deliverableId: string, updates: Partial<Deliverable>) => {
    updateProjectRooms(prev => prev.map(p => {
      if (p.id !== activeProjectId) return p;
      return {
        ...p,
        rooms: p.rooms.map(r => {
          if (r.id !== roomId) return r;
          return {
            ...r,
            deliverables: r.deliverables.map(d =>
              d.id === deliverableId ? { ...d, ...updates } : d
            ),
          };
        }),
      };
    }));
  }, [activeProjectId, updateProjectRooms]);

  const deleteDeliverable = useCallback((roomId: string, deliverableId: string) => {
    updateProjectRooms(prev => prev.map(p => {
      if (p.id !== activeProjectId) return p;
      return {
        ...p,
        rooms: p.rooms.map(r => {
          if (r.id !== roomId) return r;
          return {
            ...r,
            deliverables: r.deliverables.filter(d => d.id !== deliverableId),
          };
        }),
      };
    }));
  }, [activeProjectId, updateProjectRooms]);

  return (
    <ProjectContext.Provider value={{
      projects,
      activeProject,
      activeProjectId,
      setActiveProjectId,
      chatHistory,
      setChatMessages,
      getChatMessages,
      addDeliverable,
      updateDeliverable,
      deleteDeliverable,
    }}>
      {children}
    </ProjectContext.Provider>
  );
}

export function useProject() {
  const ctx = useContext(ProjectContext);
  if (!ctx) throw new Error('useProject must be used within ProjectProvider');
  return ctx;
}
