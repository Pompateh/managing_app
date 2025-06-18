import { Component, OnInit } from '@angular/core';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { SimpleFormComponent } from '@shared-components/simple-form';
import { SupabaseAuthService } from '../../../../core/services/supabase/supabase-auth.service';
import { CommonModule } from '@angular/common';
import { UserRole } from '../../../../core/models/user.model';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [RouterModule, SimpleFormComponent, CommonModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent implements OnInit {
  returnUrl: string = '/';
  error: string | null = null;
  loading: boolean = false;

  constructor(
    private authService: SupabaseAuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    // Get return url from route parameters or default to '/admin' for admin users
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/admin';
    this.error = this.route.snapshot.queryParams['error'] || null;
    
    // Subscribe to auth state changes
    this.authService.state$.subscribe(state => {
      this.loading = state.loading;
      this.error = state.error;
      
      if (state.isAuthenticated) {
        // If a returnUrl is present, always use it
        if (this.route.snapshot.queryParams['returnUrl']) {
          this.router.navigate([this.returnUrl]);
        } else if (state.user?.role === UserRole.ADMIN) {
          this.router.navigate(['/admin']);
        } else if (state.user?.role === UserRole.MEMBER) {
          this.router.navigate(['/projects']);
        } else if (state.user?.role === UserRole.VIEWER && state.user.assignedProjectId) {
          this.router.navigate([`/projects/${state.user.assignedProjectId}`]);
        } else {
          this.router.navigate(['/']); // fallback
        }
      }
    });
  }

  async onSubmit(formData: any) {
    this.error = null;
    
    if (!formData.email || !formData.password) {
      this.error = 'Please enter both email and password';
      return;
    }

    try {
      const success = await this.authService.login(formData.email, formData.password);
      if (!success && !this.error) {
        this.error = 'Invalid email or password';
      }
    } catch (error) {
      this.error = 'An error occurred during login';
      console.error('Login error:', error);
    }
  }

  async loginWithGoogle() {
    try {
      const success = await this.authService.loginWithGoogle();
      if (!success && !this.error) {
        this.error = 'Google login failed';
      }
    } catch (error) {
      this.error = 'An error occurred during Google login';
      console.error('Google login error:', error);
    }
  }
}
