import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, from, of } from 'rxjs';
import { Router } from '@angular/router';
import { map, tap, catchError } from 'rxjs/operators';
import { User, UserRole, UserStatus } from '../../models/user.model';
import { SupabaseConfigService } from './supabase.config';
import { AuthState } from '../auth/auth.service';

const INITIAL_STATE: AuthState = {
  user: null,
  isAuthenticated: false,
  loading: false,
  error: null
};

@Injectable({
  providedIn: 'root'
})
export class SupabaseAuthService {
  private state = new BehaviorSubject<AuthState>(INITIAL_STATE);
  public state$ = this.state.asObservable();
  public user$ = this.state$.pipe(map(state => state.user));
  public isAuthenticated$ = this.state$.pipe(map(state => state.isAuthenticated));

  constructor(
    private router: Router,
    private supabaseConfig: SupabaseConfigService
  ) {
    this.initializeAuthState();
  }

  private async initializeAuthState() {
    const { data: { session } } = await this.supabaseConfig.getClient().auth.getSession();
    if (session) {
      const user = await this.getUserFromSession(session);
      this.updateState({
        user,
        isAuthenticated: true,
        loading: false,
        error: null
      });
    }
  }

  private async getUserFromSession(session: any): Promise<User> {
    const { data: profile } = await this.supabaseConfig.getClient()
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single();

    return {
      id: session.user.id,
      email: session.user.email,
      name: profile?.name || session.user.email,
      role: profile?.role || UserRole.MEMBER,
      status: UserStatus.ACTIVE,
      createdAt: new Date(session.user.created_at),
      lastLogin: new Date(),
      password: '' // We don't store passwords in the client
    };
  }

  private updateState(partialState: Partial<AuthState>): void {
    this.state.next({
      ...this.state.value,
      ...partialState
    });
  }

  async login(email: string, password: string): Promise<boolean> {
    this.updateState({ loading: true, error: null });

    try {
      const { data, error } = await this.supabaseConfig.getClient().auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;

      if (data.session) {
        const user = await this.getUserFromSession(data.session);
        this.updateState({
          user,
          isAuthenticated: true,
          loading: false,
          error: null
        });
        return true;
      }

      return false;
    } catch (error: any) {
      this.updateState({
        loading: false,
        error: error.message || 'An error occurred during login'
      });
      return false;
    }
  }

  async loginWithGoogle(): Promise<boolean> {
    this.updateState({ loading: true, error: null });
    
    try {
      const { data, error } = await this.supabaseConfig.getClient().auth.signInWithOAuth({
        provider: 'google'
      });

      if (error) throw error;
      return true;
    } catch (error: any) {
      this.updateState({
        loading: false,
        error: error.message || 'An error occurred during Google login'
      });
      return false;
    }
  }

  async logout(): Promise<void> {
    await this.supabaseConfig.getClient().auth.signOut();
    this.updateState(INITIAL_STATE);
    this.router.navigate(['/login']);
  }

  isAuthenticated(): boolean {
    return this.state.value.isAuthenticated;
  }

  getAuthError(): string | null {
    return this.state.value.error;
  }

  isLoading(): boolean {
    return this.state.value.loading;
  }

  getCurrentUser(): User | null {
    return this.state.value.user;
  }

  hasRole(role: string | string[]): boolean {
    const userRole = this.state.value.user?.role;
    if (!userRole) return false;
    
    const userRoleStr = UserRole[userRole];
    
    if (Array.isArray(role)) {
      return role.some(r => r === userRoleStr);
    }
    return role === userRoleStr;
  }
} 