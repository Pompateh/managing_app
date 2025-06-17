import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Board } from '@custom-interfaces/board';
import { User } from '@core/models/user.model';
import { Project } from '@core/models/project.model';
import { BehaviorSubject, Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SupabaseService {
  private supabase: SupabaseClient;
  private realtimeSubscription: any;
  private boardChanges$ = new BehaviorSubject<Board | null>(null);

  constructor() {
    this.supabase = createClient(
      'https://hfiqukaslvvxepooilcq.supabase.co',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhmaXF1a2FzbHZ2eGVwb29pbGNxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxMzY0MDQsImV4cCI6MjA2NTcxMjQwNH0.-iU5NQ0oM01HHoW7V4t3_iqPsfJZy4I6ZMQcId6i_DU'
    );
  }

  // Auth methods
  async signUp(email: string, password: string, userData: Partial<User>) {
    const { data, error } = await this.supabase.auth.signUp({
      email,
      password,
      options: {
        data: userData
      }
    });
    if (error) throw error;
    return data;
  }

  async signIn(email: string, password: string) {
    const { data, error } = await this.supabase.auth.signInWithPassword({
      email,
      password
    });
    if (error) throw error;
    return data;
  }

  async signOut() {
    const { error } = await this.supabase.auth.signOut();
    if (error) throw error;
  }

  async getCurrentUser() {
    const { data: { user }, error } = await this.supabase.auth.getUser();
    if (error) throw error;
    return user;
  }

  // Board methods
  async getBoards(projectId?: string): Promise<Board[]> {
    let query = this.supabase
      .from('boards')
      .select('*');
    
    if (projectId) {
      query = query.eq('projectId', projectId);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  async getBoard(boardId: string): Promise<Board> {
    const { data, error } = await this.supabase
      .from('boards')
      .select('*')
      .eq('id', boardId)
      .single();
    
    if (error) throw error;
    return data;
  }

  async createBoard(board: Partial<Board>): Promise<Board> {
    const { data, error } = await this.supabase
      .from('boards')
      .insert([board])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async updateBoard(boardId: string, updates: Partial<Board>): Promise<Board> {
    const { data, error } = await this.supabase
      .from('boards')
      .update(updates)
      .eq('id', boardId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async deleteBoard(boardId: string): Promise<void> {
    const { error } = await this.supabase
      .from('boards')
      .delete()
      .eq('id', boardId);
    
    if (error) throw error;
  }

  // Real-time subscription methods
  subscribeToBoardChanges(boardId: string): Observable<Board | null> {
    // Unsubscribe from any existing subscription
    if (this.realtimeSubscription) {
      this.supabase.removeChannel(this.realtimeSubscription);
    }

    // Subscribe to board changes
    this.realtimeSubscription = this.supabase
      .channel(`board-${boardId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'boards',
          filter: `id=eq.${boardId}`
        },
        (payload) => {
          this.boardChanges$.next(payload.new as Board);
        }
      )
      .subscribe();

    return this.boardChanges$.asObservable();
  }

  unsubscribeFromBoardChanges(): void {
    if (this.realtimeSubscription) {
      this.supabase.removeChannel(this.realtimeSubscription);
      this.realtimeSubscription = null;
    }
  }

  // Project methods
  async getProjects(): Promise<Project[]> {
    const { data, error } = await this.supabase
      .from('projects')
      .select('*');
    
    if (error) throw error;
    return data || [];
  }

  async getProject(projectId: string): Promise<Project> {
    const { data, error } = await this.supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single();
    
    if (error) throw error;
    return data;
  }

  async createProject(project: Partial<Project>): Promise<Project> {
    const { data, error } = await this.supabase
      .from('projects')
      .insert([project])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async updateProject(projectId: string, updates: Partial<Project>): Promise<Project> {
    const { data, error } = await this.supabase
      .from('projects')
      .update(updates)
      .eq('id', projectId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async deleteProject(projectId: string): Promise<void> {
    const { error } = await this.supabase
      .from('projects')
      .delete()
      .eq('id', projectId);
    
    if (error) throw error;
  }

  // User methods
  async getUsers(): Promise<User[]> {
    const { data, error } = await this.supabase
      .from('users')
      .select('*');
    
    if (error) throw error;
    return data || [];
  }

  async getUser(userId: string): Promise<User> {
    const { data, error } = await this.supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (error) throw error;
    return data;
  }

  async createUser(user: Partial<User>): Promise<User> {
    const { data, error } = await this.supabase
      .from('users')
      .insert([user])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async updateUser(userId: string, updates: Partial<User>): Promise<User> {
    const { data, error } = await this.supabase
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async deleteUser(userId: string): Promise<void> {
    const { error } = await this.supabase
      .from('users')
      .delete()
      .eq('id', userId);
    
    if (error) throw error;
  }
} 