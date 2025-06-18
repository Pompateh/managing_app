import { Injectable } from '@angular/core';
import { SupabaseDbService } from './supabase-db.service';
import { AuthService } from '../auth/auth.service';
import { User } from '../../models/user.model';
import { Project } from '../../models/project.model';
import { Board } from '../../models/interfaces/board';
import { BehaviorSubject } from 'rxjs';
import { PostgrestError } from '@supabase/supabase-js';
import { db } from '../../../../../db';

@Injectable({
  providedIn: 'root'
})
export class MigrationService {
  private migrationStatus = new BehaviorSubject<{
    status: 'idle' | 'in_progress' | 'completed' | 'error';
    progress: number;
    message: string;
  }>({
    status: 'idle',
    progress: 0,
    message: ''
  });

  constructor(
    private supabaseDb: SupabaseDbService,
    private authService: AuthService
  ) {}

  getMigrationStatus() {
    return this.migrationStatus.asObservable();
  }

  async migrateData() {
    try {
      this.migrationStatus.next({
        status: 'in_progress',
        progress: 0,
        message: 'Starting migration...'
      });

      // Get current user
      const currentUser = await this.authService.getCurrentUser();
      if (!currentUser) {
        throw new Error('No authenticated user found');
      }

      // Migrate user data
      this.migrationStatus.next({
        status: 'in_progress',
        progress: 10,
        message: 'Migrating user data...'
      });
      await this.migrateUser(currentUser);

      // Migrate projects
      this.migrationStatus.next({
        status: 'in_progress',
        progress: 30,
        message: 'Migrating projects...'
      });
      const projects = await this.getLocalProjects();
      await this.migrateProjects(projects);

      // Migrate boards
      this.migrationStatus.next({
        status: 'in_progress',
        progress: 60,
        message: 'Migrating boards...'
      });
      const boards = await this.getLocalBoards();
      await this.migrateBoards(boards);

      this.migrationStatus.next({
        status: 'completed',
        progress: 100,
        message: 'Migration completed successfully'
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      this.migrationStatus.next({
        status: 'error',
        progress: 0,
        message: `Migration failed: ${errorMessage}`
      });
      throw error;
    }
  }

  private async migrateUser(user: User) {
    try {
      await this.supabaseDb.createUser(user);
    } catch (error: unknown) {
      if (error instanceof PostgrestError && error.code === '23505') { // Unique violation
        // User already exists, try to update
        await this.supabaseDb.updateUser(user);
      } else {
        throw error;
      }
    }
  }

  private async migrateProjects(projects: Project[]) {
    for (const project of projects) {
      try {
        await this.supabaseDb.createProject(project);
      } catch (error: unknown) {
        if (error instanceof PostgrestError && error.code === '23505') { // Unique violation
          // Project already exists, try to update
          await this.supabaseDb.updateProject(project);
        } else {
          throw error;
        }
      }
    }
  }

  private async migrateBoards(boards: Board[]) {
    for (const board of boards) {
      try {
        await this.supabaseDb.createBoard(board);
      } catch (error: unknown) {
        if (error instanceof PostgrestError && error.code === '23505') { // Unique violation
          // Board already exists, try to update
          await this.supabaseDb.updateBoard(board);
        } else {
          throw error;
        }
      }
    }
  }

  private async getLocalProjects(): Promise<Project[]> {
    // Try to get projects from localStorage first
    const storedProjects = localStorage.getItem('projects');
    if (storedProjects) {
      const projects = JSON.parse(storedProjects);
      // Convert string dates back to Date objects
      projects.forEach((project: Project) => {
        project.createdAt = new Date(project.createdAt);
        project.deadline = new Date(project.deadline);
        // Convert dates in phases
        Object.values(project.phases).forEach(phase => {
          if (phase.lastModified) {
            phase.lastModified = new Date(phase.lastModified);
          }
          if (phase.comments) {
            phase.comments.forEach(comment => {
              comment.createdAt = new Date(comment.createdAt);
            });
          }
          if (phase.subPhases) {
            Object.values(phase.subPhases).forEach(subPhase => {
              if (subPhase.lastModified) {
                subPhase.lastModified = new Date(subPhase.lastModified);
              }
              if (subPhase.comments) {
                subPhase.comments.forEach(comment => {
                  comment.createdAt = new Date(comment.createdAt);
                });
              }
            });
          }
        });
      });
      return projects;
    }

    // If no projects in localStorage, return empty array since projects are not stored in Dexie
    return [];
  }

  private async getLocalBoards(): Promise<Board[]> {
    // Get boards from Dexie
    try {
      const boards = await db.boards.toArray();
      return boards;
    } catch (error) {
      console.error('Error getting boards from Dexie:', error);
      return [];
    }
  }
} 