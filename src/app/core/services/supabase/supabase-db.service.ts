import { Injectable } from '@angular/core';
import { SupabaseConfigService } from './supabase.config';
import { User, UserRole, UserStatus } from '../../models/user.model';
import { Project, ProjectStatus, ProjectTask, PhaseContent } from '../../models/project.model';
import { Board } from '../../models/interfaces/board';
import { SupabaseClient } from '@supabase/supabase-js';

@Injectable({
  providedIn: 'root'
})
export class SupabaseDbService {
  constructor(private supabaseConfig: SupabaseConfigService) {}

  getClient(): SupabaseClient {
    return this.supabaseConfig.getClient();
  }

  // User Operations
  async createUser(user: User): Promise<User> {
    const { data, error } = await this.supabaseConfig.getClient()
      .from('users')
      .insert([{
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        status: user.status,
        created_at: user.createdAt,
        last_login: user.lastLogin,
        assigned_project_id: user.assignedProjectId
      }])
      .select()
      .single();

    if (error) throw error;
    return this.mapUserFromDb(data);
  }

  async updateUser(user: User): Promise<User> {
    const { data, error } = await this.supabaseConfig.getClient()
      .from('users')
      .update({
        name: user.name,
        role: user.role,
        status: user.status,
        last_login: user.lastLogin,
        assigned_project_id: user.assignedProjectId
      })
      .eq('id', user.id)
      .select()
      .single();

    if (error) throw error;
    return this.mapUserFromDb(data);
  }

  async getUserById(id: string): Promise<User | null> {
    const { data, error } = await this.supabaseConfig.getClient()
      .from('users')
      .select('*')
      .eq('id', id)
      .single();

    if (error) return null;
    return this.mapUserFromDb(data);
  }

  async getUserByEmail(email: string): Promise<User | null> {
    const { data, error } = await this.supabaseConfig.getClient()
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (error) return null;
    return this.mapUserFromDb(data);
  }

  // Project Operations
  async createProject(project: Project): Promise<Project> {
    const { data, error } = await this.supabaseConfig.getClient()
      .from('projects')
      .insert([{
        id: project.id,
        name: project.name,
        description: project.description,
        deadline: project.deadline,
        completion_percentage: project.completionPercentage,
        status: project.status,
        created_at: project.createdAt,
        created_by: project.createdBy,
        team_members: project.teamMembers,
        tasks: project.tasks,
        phases: project.phases
      }])
      .select()
      .single();

    if (error) throw error;
    return this.mapProjectFromDb(data);
  }

  async updateProject(project: Project): Promise<Project> {
    const { data, error } = await this.supabaseConfig.getClient()
      .from('projects')
      .update({
        name: project.name,
        description: project.description,
        deadline: project.deadline,
        completion_percentage: project.completionPercentage,
        status: project.status,
        team_members: project.teamMembers,
        tasks: project.tasks,
        phases: project.phases
      })
      .eq('id', project.id)
      .select()
      .single();

    if (error) throw error;
    return this.mapProjectFromDb(data);
  }

  async getProjectById(id: string): Promise<Project | null> {
    const { data, error } = await this.supabaseConfig.getClient()
      .from('projects')
      .select('*')
      .eq('id', id)
      .single();

    if (error) return null;
    return this.mapProjectFromDb(data);
  }

  async getProjects(): Promise<Project[]> {
    const { data, error } = await this.supabaseConfig.getClient()
      .from('projects')
      .select('*');

    if (error) throw error;
    return data.map(this.mapProjectFromDb);
  }

  // Board Operations
  async createBoard(board: Board): Promise<Board> {
    const { data, error } = await this.supabaseConfig.getClient()
      .from('boards')
      .insert([{
        id: board.id,
        name: board.name,
        project_id: board.projectId,
        created_at: board.dateCreated,
        connections: board.connetions,
        elements: board.elements,
        groups: board.groups,
        zoom_scale: board.zoomScale,
        tag: board.tag,
        favorite: board.favorite,
        accepted: board.accepted,
        accepted_by: board.acceptedBy
      }])
      .select()
      .single();

    if (error) throw error;
    return this.mapBoardFromDb(data);
  }

  async updateBoard(board: Board): Promise<Board> {
    const { data, error } = await this.supabaseConfig.getClient()
      .from('boards')
      .update({
        name: board.name,
        connections: board.connetions,
        elements: board.elements,
        groups: board.groups,
        zoom_scale: board.zoomScale,
        tag: board.tag,
        favorite: board.favorite,
        accepted: board.accepted,
        accepted_by: board.acceptedBy
      })
      .eq('id', board.id)
      .select()
      .single();

    if (error) throw error;
    return this.mapBoardFromDb(data);
  }

  async getBoardById(id: string): Promise<Board | null> {
    const { data, error } = await this.supabaseConfig.getClient()
      .from('boards')
      .select('*')
      .eq('id', id)
      .single();

    if (error) return null;
    return this.mapBoardFromDb(data);
  }

  async getBoardsByProjectId(projectId: string): Promise<Board[]> {
    const { data, error } = await this.supabaseConfig.getClient()
      .from('boards')
      .select('*')
      .eq('project_id', projectId);

    if (error) throw error;
    return data.map(this.mapBoardFromDb);
  }

  // Helper methods for mapping database records to application models
  private mapUserFromDb(data: any): User {
    return {
      id: data.id,
      email: data.email,
      name: data.name,
      role: data.role as UserRole,
      status: data.status as UserStatus,
      createdAt: new Date(data.created_at),
      lastLogin: data.last_login ? new Date(data.last_login) : null,
      password: '', // We don't store passwords in the client
      assignedProjectId: data.assigned_project_id
    };
  }

  private mapProjectFromDb(data: any): Project {
    return {
      id: data.id,
      name: data.name,
      description: data.description,
      deadline: new Date(data.deadline),
      completionPercentage: data.completion_percentage,
      status: data.status as ProjectStatus,
      createdAt: new Date(data.created_at),
      createdBy: data.created_by,
      teamMembers: data.team_members,
      tasks: data.tasks as ProjectTask[],
      phases: data.phases as { [key: string]: PhaseContent }
    };
  }

  private mapBoardFromDb(data: any): Board {
    return {
      id: data.id,
      name: data.name,
      projectId: data.project_id,
      dateCreated: new Date(data.created_at),
      connetions: data.connections,
      elements: data.elements,
      groups: data.groups,
      zoomScale: data.zoom_scale,
      tag: data.tag,
      favorite: data.favorite,
      accepted: data.accepted,
      acceptedBy: data.accepted_by
    };
  }
} 