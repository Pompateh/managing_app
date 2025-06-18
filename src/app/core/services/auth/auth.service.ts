import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { Router } from '@angular/router';
import { tap, map } from 'rxjs/operators';
import { User, UserRole, UserStatus } from '../../models/user.model';
import { UserService } from '../user/user.service';

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

const INITIAL_STATE: AuthState = {
  user: null,
  isAuthenticated: false,
  loading: false,
  error: null
};

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly STORAGE_KEY = 'auth_state';
  private readonly ADMIN_EMAIL = 'newstalgia39@gmail.com';
  private readonly ADMIN_PASSWORD = 'justdoit';
  private readonly TOKEN_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours

  private state = new BehaviorSubject<AuthState>(INITIAL_STATE);
  public state$ = this.state.asObservable();
  public user$ = this.state$.pipe(map(state => state.user));
  public isAuthenticated$ = this.state$.pipe(map(state => state.isAuthenticated));

  constructor(private router: Router, private userService: UserService) {
    this.initializeFromStorage();
  }

  private initializeFromStorage(): void {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const { user, timestamp } = JSON.parse(stored);
        // Check if the stored session is still valid (24 hours)
        if (user && timestamp && (Date.now() - timestamp) < this.TOKEN_EXPIRY) {
          this.updateState({ user, isAuthenticated: true, loading: false, error: null });
        } else {
          this.logout(); // Clear expired session
        }
      }
    } catch (error) {
      console.error('Error reading auth state:', error);
      this.logout();
    }
  }

  private updateState(partialState: Partial<AuthState>): void {
    this.state.next({
      ...this.state.value,
      ...partialState
    });
  }

  private persistToStorage(user: User | null): void {
    if (user) {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify({
        user,
        timestamp: Date.now()
      }));
    } else {
      localStorage.removeItem(this.STORAGE_KEY);
    }
  }

  async login(email: string, password: string): Promise<boolean> {
    this.updateState({ loading: true, error: null });

    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 500));

      if (email === this.ADMIN_EMAIL && password === this.ADMIN_PASSWORD) {
        const user: User = {
          id: '1',
          email: this.ADMIN_EMAIL,
          name: 'Admin',
          role: UserRole.ADMIN,
          status: UserStatus.ACTIVE,
          createdAt: new Date(),
          lastLogin: new Date(),
          password: this.ADMIN_PASSWORD
        };
        this.updateState({
          user,
          isAuthenticated: true,
          loading: false,
          error: null
        });
        this.persistToStorage(user);
        return true;
      }

      // Try to authenticate as a collaborator/user
      let user: User | undefined;
      try {
        user = this.userService.authenticateUser(email, password);
      } catch (err: any) {
        this.updateState({
          loading: false,
          error: err.message || 'Invalid email or password'
        });
        return false;
      }

      if (user) {
        this.updateState({
          user,
          isAuthenticated: true,
          loading: false,
          error: null
        });
        this.persistToStorage(user);
        return true;
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

  async loginWithGoogle(): Promise<boolean> {
    this.updateState({ loading: true, error: null });
    // TODO: Implement Google OAuth
    this.updateState({ loading: false, error: 'Google login not implemented yet' });
    return false;
  }

  logout(): void {
    this.updateState(INITIAL_STATE);
    this.persistToStorage(null);
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
    
    // Convert role to string for comparison
    const userRoleStr = UserRole[userRole];
    
    if (Array.isArray(role)) {
      return role.some(r => r === userRoleStr);
    }
    return role === userRoleStr;
  }
} 