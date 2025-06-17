import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, map } from 'rxjs';
import { User, UserRole, UserStatus } from '../../models/user.model';
import { UserService } from '../user/user.service';
import { SupabaseService } from '../supabase/supabase.service';

const INITIAL_STATE: AuthState = {
  user: null,
  isAuthenticated: false,
  loading: false,
  error: null
};

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private state = new BehaviorSubject<AuthState>(INITIAL_STATE);
  public state$ = this.state.asObservable();
  public user$ = this.state$.pipe(map(state => state.user));
  public isAuthenticated$ = this.state$.pipe(map(state => state.isAuthenticated));

  constructor(
    private router: Router,
    private userService: UserService,
    private supabaseService: SupabaseService
  ) {
    this.initializeFromSupabase();
  }

  private async initializeFromSupabase(): Promise<void> {
    try {
      const user = await this.supabaseService.getCurrentUser();
      if (user) {
        // Get additional user data from the users table
        const userData = await this.userService.getUser(user.id);
        if (userData) {
          this.updateState({
            user: userData,
            isAuthenticated: true,
            loading: false,
            error: null
          });
        }
      }
    } catch (error) {
      console.error('Error initializing auth state:', error);
      this.logout();
    }
  }

  private updateState(newState: Partial<AuthState>): void {
    this.state.next({
      ...this.state.value,
      ...newState
    });
  }

  async login(email: string, password: string): Promise<boolean> {
    this.updateState({ loading: true, error: null });

    try {
      const { user } = await this.supabaseService.signIn(email, password);
      
      if (user) {
        // Get additional user data from the users table
        const userData = await this.userService.getUser(user.id);
        if (userData) {
          this.updateState({
            user: userData,
            isAuthenticated: true,
            loading: false,
            error: null
          });
          return true;
        }
      }

      this.updateState({
        loading: false,
        error: 'Invalid email or password'
      });
      return false;
    } catch (error: any) {
      this.updateState({
        loading: false,
        error: error.message || 'An error occurred during login'
      });
      return false;
    }
  }

  async logout(): Promise<void> {
    try {
      await this.supabaseService.signOut();
      this.updateState(INITIAL_STATE);
      this.router.navigate(['/login']);
    } catch (error) {
      console.error('Error during logout:', error);
      // Still clear the state even if the server logout fails
      this.updateState(INITIAL_STATE);
      this.router.navigate(['/login']);
    }
  }

  getCurrentUser(): User | null {
    return this.state.value.user;
  }

  isAuthenticated(): boolean {
    return this.state.value.isAuthenticated;
  }

  isLoading(): boolean {
    return this.state.value.loading;
  }

  getAuthError(): string | null {
    return this.state.value.error;
  }

  hasRole(role: string | string[]): boolean {
    const userRole = this.state.value.user?.role;
    if (!userRole) return false;
    
    // Convert role to string for comparison
    const userRoleStr = UserRole[userRole];
    
    if (Array.isArray(role)) {
      return role.some(r => r === userRoleStr);
    }
    return role === userRoleStr;
  }
} 