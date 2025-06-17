import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Project, ProjectStatus, PhaseContent } from '../../models/project.model';
import { AuthService } from '../auth/auth.service';
import { BoardDataService } from '@shared-services/board-data/board-data.service';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable({
  providedIn: 'root'
})
export class ProjectService {
  private projects$ = new BehaviorSubject<Project[]>([]);

  constructor(
    private authService: AuthService,
    private boardDataService: BoardDataService,
    private supabaseService: SupabaseService
  ) {
    this.loadProjects();
  }

  private async loadProjects() {
    try {
      const projects = await this.supabaseService.getProjects();
      this.projects$.next(projects);
    } catch (error) {
      console.error('Error loading projects:', error);
    }
  }

  getProjects(): Observable<Project[]> {
    return this.projects$.asObservable();
  }

  async getProject(projectId: string): Promise<Project | null> {
    try {
      return await this.supabaseService.getProject(projectId);
    } catch (error) {
      console.error('Error getting project:', error);
      return null;
    }
  }

  async createProject(project: Partial<Project>): Promise<Project> {
    try {
      const newProject = await this.supabaseService.createProject(project);
      await this.loadProjects(); // Reload projects to update the list
      return newProject;
    } catch (error) {
      console.error('Error creating project:', error);
      throw error;
    }
  }

  async updateProject(projectId: string, updates: Partial<Project>): Promise<Project> {
    try {
      const updatedProject = await this.supabaseService.updateProject(projectId, updates);
      await this.loadProjects(); // Reload projects to update the list
      return updatedProject;
    } catch (error) {
      console.error('Error updating project:', error);
      throw error;
    }
  }

  async deleteProject(projectId: string): Promise<void> {
    try {
      await this.supabaseService.deleteProject(projectId);
      await this.loadProjects(); // Reload projects to update the list
    } catch (error) {
      console.error('Error deleting project:', error);
      throw error;
    }
  }

  async updatePhaseContent(projectId: string, phaseId: string, content: string): Promise<Project> {
    try {
      const project = await this.getProject(projectId);
      if (!project) {
        throw new Error('Project not found');
      }

      const updatedPhases = {
        ...project.phases,
        [phaseId]: {
          ...project.phases[phaseId],
          content
        }
      };

      return await this.updateProject(projectId, { phases: updatedPhases });
    } catch (error) {
      console.error('Error updating phase content:', error);
      throw error;
    }
  }

  async updateProjectStatus(projectId: string, status: ProjectStatus): Promise<Project> {
    try {
      return await this.updateProject(projectId, { status });
    } catch (error) {
      console.error('Error updating project status:', error);
      throw error;
    }
  }

  getProjectsByUser(userId: string): Project[] {
    return this.projects$.value.filter(project => 
      project.teamMembers?.includes(userId)
    );
  }

  getActiveProjects(): Project[] {
    return this.projects$.value.filter(project => 
      project.status === ProjectStatus.IN_PROGRESS
    );
  }

  getCompletedProjects(): Project[] {
    return this.projects$.value.filter(project => 
      project.status === ProjectStatus.COMPLETED
    );
  }
} 