import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, firstValueFrom } from 'rxjs';
import { Project, ProjectStatus, PhaseContent } from '../../models/project.model';
import { AuthService } from '../auth/auth.service';
import { BoardDataService } from '@shared-services/board-data/board-data.service';
import { uuid } from '@jsplumb/browser-ui';

@Injectable({
  providedIn: 'root'
})
export class ProjectService {
  private projects$ = new BehaviorSubject<Project[]>([]);

  constructor(
    private authService: AuthService,
    private boardDataService: BoardDataService
  ) {
    this.initializeMockProjects();
  }

  private createDefaultPhaseContent(name: string, description: string = ''): PhaseContent {
    return {
      name,
      completed: false,
      content: '',
      description,
      lastModified: new Date(),
      comments: [],
      attachments: []
    };
  }

  private initializeMockProjects() {
    const defaultPhases = {
      brief: this.createDefaultPhaseContent('Brief', 'Initial project requirements and scope'),
      contract: this.createDefaultPhaseContent('Contract', 'Legal agreements and terms'),
      present: {
        ...this.createDefaultPhaseContent('Present', 'Project presentation and review'),
        subPhases: {
          qa: this.createDefaultPhaseContent('Q&A', 'Questions and answers session'),
          brandStory: this.createDefaultPhaseContent('Brand Story', 'Company narrative and values'),
          conceptAndMood: this.createDefaultPhaseContent('Concept & Mood', 'Design direction and atmosphere'),
          direction: this.createDefaultPhaseContent('Direction', 'Project trajectory and goals'),
          phase: this.createDefaultPhaseContent('Phase', 'Project timeline and milestones')
        }
      },
      timeline: this.createDefaultPhaseContent('Timeline', 'Project schedule and deadlines'),
      deliveryFile: this.createDefaultPhaseContent('Delivery File', 'Final deliverables and assets')
    };

    const mockProjects: Project[] = [
      {
        id: '1',
        name: 'Website Redesign',
        description: 'Complete overhaul of the company website with new branding',
        deadline: new Date('2024-06-30'),
        completionPercentage: 65,
        status: ProjectStatus.IN_PROGRESS,
        createdAt: new Date('2024-01-15'),
        createdBy: 'newstalgia39@gmail.com',
        teamMembers: ['newstalgia39@gmail.com', 'designer@example.com', 'developer@example.com'],
        tasks: [
          { id: '1-1', name: 'Design Homepage', completed: true, assignedTo: 'designer@example.com' },
          { id: '1-2', name: 'Implement Frontend', completed: true, assignedTo: 'developer@example.com' },
          { id: '1-3', name: 'Backend Integration', completed: false, assignedTo: 'developer@example.com' }
        ],
        phases: { ...defaultPhases }
      },
      {
        id: '2',
        name: 'Mobile App Development',
        description: 'Develop iOS and Android apps for the platform',
        deadline: new Date('2024-08-15'),
        completionPercentage: 30,
        status: ProjectStatus.IN_PROGRESS,
        createdAt: new Date('2024-02-01'),
        createdBy: 'newstalgia39@gmail.com',
        teamMembers: ['newstalgia39@gmail.com', 'mobile.dev@example.com'],
        tasks: [
          { id: '2-1', name: 'UI/UX Design', completed: true, assignedTo: 'mobile.dev@example.com' },
          { id: '2-2', name: 'iOS Development', completed: false, assignedTo: 'mobile.dev@example.com' },
          { id: '2-3', name: 'Android Development', completed: false, assignedTo: 'mobile.dev@example.com' }
        ],
        phases: { ...defaultPhases }
      }
    ];

    this.projects$.next(mockProjects);
  }

  getProjects(): Observable<Project[]> {
    return this.projects$;
  }

  getProjectById(id: string): Project | undefined {
    const projects = this.projects$.value;
    return projects.find(project => project.id === id);
  }

  updatePhase(projectId: string, phaseKey: string, updatedPhase: PhaseContent) {
    const projects = this.projects$.value;
    const projectIndex = projects.findIndex(p => p.id === projectId);
    
    if (projectIndex !== -1) {
      const project = { ...projects[projectIndex] };
      project.phases[phaseKey] = updatedPhase;
      
      // Update completion percentage based on phases
      const completedPhases = Object.values(project.phases).filter(phase => phase.completed).length;
      project.completionPercentage = Math.round((completedPhases / Object.keys(project.phases).length) * 100);
      
      projects[projectIndex] = project;
      this.projects$.next([...projects]);
    }
  }

  addPhase(projectId: string, phaseName: string, parentPhaseKey?: string) {
    const projects = this.projects$.value;
    const projectIndex = projects.findIndex(p => p.id === projectId);
    
    if (projectIndex !== -1) {
      const project = { ...projects[projectIndex] };
      const newPhase = this.createDefaultPhaseContent(phaseName);
      
      if (parentPhaseKey) {
        if (!project.phases[parentPhaseKey].subPhases) {
          project.phases[parentPhaseKey].subPhases = {};
        }
        project.phases[parentPhaseKey].subPhases![phaseName.toLowerCase()] = newPhase;
      } else {
        project.phases[phaseName.toLowerCase()] = newPhase;
      }
      
      projects[projectIndex] = project;
      this.projects$.next([...projects]);
    }
  }

  removePhase(projectId: string, phaseKey: string, parentPhaseKey?: string) {
    const projects = this.projects$.value;
    const projectIndex = projects.findIndex(p => p.id === projectId);
    
    if (projectIndex !== -1) {
      const project = { ...projects[projectIndex] };
      
      if (parentPhaseKey && project.phases[parentPhaseKey].subPhases) {
        delete project.phases[parentPhaseKey].subPhases![phaseKey];
      } else {
        delete project.phases[phaseKey];
      }
      
      projects[projectIndex] = project;
      this.projects$.next([...projects]);
    }
  }

  addComment(projectId: string, phaseKey: string, content: string) {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) return;

    const projects = this.projects$.value;
    const projectIndex = projects.findIndex(p => p.id === projectId);
    
    if (projectIndex !== -1) {
      const project = { ...projects[projectIndex] };
      const phase = project.phases[phaseKey];
      
      if (!phase.comments) {
        phase.comments = [];
      }
      
      phase.comments.push({
        id: Date.now().toString(),
        content,
        createdBy: currentUser.email,
        createdAt: new Date()
      });
      
      projects[projectIndex] = project;
      this.projects$.next([...projects]);
    }
  }

  createConceptMoodBoard(projectId: string) {
    try {
      const project = this.projects$.value.find(p => p.id === projectId);
      if (!project || !project.phases['present']?.subPhases?.['conceptAndMood']) {
        console.warn('Project or Concept & Mood phase not found:', projectId);
        return;
      }

      // Create a new board with a meaningful name
      const boardId = uuid();
      this.boardDataService.boards.push({
        id: boardId,
        dateCreated: new Date(),
        name: `${project.name} - Concept & Mood`,
        connetions: [],
        elements: [],
        groups: [],
        zoomScale: 1
      });

      // Update the project's Concept & Mood phase with the board ID
      const presentPhase = project.phases['present'];
      if (presentPhase.subPhases) {
        presentPhase.subPhases['conceptAndMood'].boardId = boardId;
        this.updatePhase(projectId, 'present', presentPhase);
      }

      return boardId;
    } catch (error) {
      console.error('Error creating concept mood board:', error);
      return undefined;
    }
  }

  getConceptMoodBoardId(projectId: string): string | undefined {
    const project = this.projects$.value.find(p => p.id === projectId);
    return project?.phases['present']?.subPhases?.['conceptAndMood']?.boardId;
  }

  async refreshProject(projectId: string): Promise<Project | undefined> {
    try {
      // Get fresh data from storage
      const projects = await firstValueFrom(this.projects$);
      const project = projects.find((p: Project) => p.id === projectId);
      
      if (!project) {
        console.warn('Project not found:', projectId);
        return undefined;
      }

      // Ensure we have a fresh copy of the project
      return { ...project };
    } catch (error) {
      console.error('Error refreshing project:', error);
      return undefined;
    }
  }

  async updateProject(project: Project): Promise<void> {
    try {
      const projects = await firstValueFrom(this.projects$);
      const index = projects.findIndex((p: Project) => p.id === project.id);
      
      if (index !== -1) {
        // Create a new array to trigger change detection
        const updatedProjects = [...projects];
        updatedProjects[index] = { ...project };
        this.projects$.next(updatedProjects);
      } else {
        console.warn('Project not found for update:', project.id);
      }
    } catch (error) {
      console.error('Error updating project:', error);
      throw error;
    }
  }
} 