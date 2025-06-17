import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { Router } from '@angular/router';
import { tap, map } from 'rxjs/operators';
import { User, UserRole, UserStatus } from '../../models/user.model';
import { UserService } from '../user/user.service';
import { Auth, signInWithEmailAndPassword, signOut, onAuthStateChanged, User as FirebaseUser } from '@angular/fire/auth';

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
  private state = new BehaviorSubject<AuthState>(INITIAL_STATE);
  public state$ = this.state.asObservable();
  public user$ = this.state$.pipe(map(state => state.user));
  public isAuthenticated$ = this.state$.pipe(map(state => state.isAuthenticated));

  constructor(
    private router: Router, 
    private userService: UserService,
    private auth: Auth
  ) {
    // Listen to Firebase auth state changes
    onAuthStateChanged(this.auth, (firebaseUser) => {
      if (firebaseUser) {
        // Convert Firebase user to our User model
        const user: User = {
          id: firebaseUser.uid,
          email: firebaseUser.email || '',
          name: firebaseUser.displayName || '',
          role: UserRole.ADMIN, // You might want to store this in Firestore
          status: UserStatus.ACTIVE,
          createdAt: new Date(),
          lastLogin: new Date(),
          password: '' // Firebase handles password, so we don't need to store it
        };
        this.updateState({
          user,
          isAuthenticated: true,
          loading: false,
          error: null
        });
      } else {
        this.updateState(INITIAL_STATE);
      }
    });
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
      const userCredential = await signInWithEmailAndPassword(this.auth, email, password);
      return true;
    } catch (error: any) {
      this.updateState({
        loading: false,
        error: error.message || 'Invalid email or password'
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

  async logout(): Promise<void> {
    try {
      await signOut(this.auth);
      this.updateState(INITIAL_STATE);
      this.router.navigate(['/login']);
    } catch (error) {
      console.error('Error signing out:', error);
    }
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