import { Component, OnInit } from '@angular/core';
import { AuthService } from '@core/services/auth/auth.service';
import { UserService } from '@core/services/user/user.service';
import { User } from '@core/models/user.model';

@Component({
  selector: 'app-auth-test',
  template: `
    <div class="p-4">
      <h2>Auth Test Component</h2>
      
      <div *ngIf="!isAuthenticated" class="mb-4">
        <button (click)="testSignIn()" class="btn btn-primary">Test Sign In</button>
      </div>

      <div *ngIf="isAuthenticated" class="mb-4">
        <h3>Welcome, {{ currentUser?.name }}!</h3>
        <p>Email: {{ currentUser?.email }}</p>
        <p>Role: {{ currentUser?.role }}</p>
        <button (click)="testSignOut()" class="btn btn-danger">Sign Out</button>
      </div>

      <div *ngIf="error" class="alert alert-danger">
        {{ error }}
      </div>
    </div>
  `,
  styles: [`
    .btn {
      padding: 0.5rem 1rem;
      border-radius: 0.25rem;
      cursor: pointer;
    }
    .btn-primary {
      background-color: #007bff;
      color: white;
      border: none;
    }
    .btn-danger {
      background-color: #dc3545;
      color: white;
      border: none;
    }
    .alert {
      padding: 1rem;
      border-radius: 0.25rem;
      margin-top: 1rem;
    }
    .alert-danger {
      background-color: #f8d7da;
      color: #721c24;
      border: 1px solid #f5c6cb;
    }
  `]
})
export class AuthTestComponent implements OnInit {
  isAuthenticated = false;
  currentUser: User | null = null;
  error: string | null = null;

  constructor(
    private authService: AuthService,
    private userService: UserService
  ) {}

  ngOnInit() {
    // Subscribe to auth state changes
    this.authService.isAuthenticated$.subscribe(
      isAuthenticated => this.isAuthenticated = isAuthenticated
    );

    // Subscribe to current user changes
    this.authService.getCurrentUser().subscribe(
      user => this.currentUser = user
    );
  }

  async testSignIn() {
    try {
      this.error = null;
      // Test with a sample user
      const result = await this.authService.login('test@example.com', 'password123');
      console.log('Sign in result:', result);
    } catch (err) {
      this.error = err instanceof Error ? err.message : 'An error occurred during sign in';
      console.error('Sign in error:', err);
    }
  }

  async testSignOut() {
    try {
      this.error = null;
      await this.authService.logout();
      console.log('Signed out successfully');
    } catch (err) {
      this.error = err instanceof Error ? err.message : 'An error occurred during sign out';
      console.error('Sign out error:', err);
    }
  }
} 