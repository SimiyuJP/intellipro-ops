import { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { Project, ChatMessage } from '@/types/project';
import { seedProject } from '@/data/seedProject';
import { seedBrandingProject } from '@/data/seedBrandingProject';

const allProjects: Project[] = [seedProject, seedBrandingProject];

interface ProjectContextType {
  projects: Project[];
  activeProject: Project | null;
  activeProjectId: string | null;
  setActiveProjectId: (id: string | null) => void;
  chatHistory: Record<string, ChatMessage[]>;
  setChatMessages: (projectId: string, messages: ChatMessage[]) => void;
  getChatMessages: (projectId: string) => ChatMessage[];
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export function ProjectProvider({ children }: { children: ReactNode }) {
  const [activeProjectId, setActiveProjectId] = useState<string | null>(allProjects[0].id);
  const [chatHistory, setChatHistory] = useState<Record<string, ChatMessage[]>>({});

  const activeProject = allProjects.find(p => p.id === activeProjectId) ?? null;

  const setChatMessages = useCallback((projectId: string, messages: ChatMessage[]) => {
    setChatHistory(prev => ({ ...prev, [projectId]: messages }));
  }, []);

  const getChatMessages = useCallback((projectId: string) => {
    return chatHistory[projectId] ?? [];
  }, [chatHistory]);

  return (
    <ProjectContext.Provider value={{
      projects: allProjects,
      activeProject,
      activeProjectId,
      setActiveProjectId,
      chatHistory,
      setChatMessages,
      getChatMessages,
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
