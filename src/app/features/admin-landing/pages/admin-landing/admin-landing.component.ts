import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../../core/services/auth/auth.service';

@Component({
  selector: 'app-admin-landing',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="min-h-screen bg-background-300 polka">
      <div class="container mx-auto px-4 py-16">
        <div class="max-w-4xl mx-auto">
          <h1 class="text-4xl font-bold text-center mb-12 text-gray-800">Select Your Workspace</h1>
          
          <div class="grid md:grid-cols-2 gap-8">
            <!-- Newstalgia Studio Card -->
            <div 
              (click)="navigateToStudio()"
              class="bg-white/80 backdrop-blur-sm rounded-lg p-8 shadow-lg cursor-pointer transform transition-all duration-300 hover:scale-105 hover:shadow-xl"
            >
              <div class="text-center">
                <h2 class="text-2xl font-bold mb-4 text-gray-800">Newstalgia Studio</h2>
                <p class="text-gray-600 mb-6">Access your creative workspace for digital content creation and management.</p>
                <div class="inline-block px-6 py-3 bg-primary-base-600 text-white rounded-lg hover:bg-primary-base-700 transition-colors">
                  Enter Studio
                </div>
              </div>
            </div>

            <!-- Rolling Oasis Card -->
            <div 
              class="bg-white/80 backdrop-blur-sm rounded-lg p-8 shadow-lg cursor-not-allowed opacity-75"
            >
              <div class="text-center">
                <h2 class="text-2xl font-bold mb-4 text-gray-800">Rolling Oasis</h2>
                <p class="text-gray-600 mb-6">Coming soon - Your gateway to advanced project management and collaboration.</p>
                <div class="inline-block px-6 py-3 bg-gray-400 text-white rounded-lg">
                  Coming Soon
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .polka {
      background-image: radial-gradient(rgb(5, 1, 21) 13.6%, transparent 13.6%);
      background-position: 8px 8px;
      background-size: 16px 16px;
      background-color: rgb(250, 248, 241);
    }
  `]
})
export class AdminLandingComponent {
  constructor(
    private router: Router,
    private authService: AuthService
  ) {}

  navigateToStudio() {
    console.log('Navigating to studio...');
    console.log('Is authenticated:', this.authService.isAuthenticated());
    console.log('Current user:', this.authService.getCurrentUser());
    
    if (this.authService.isAuthenticated()) {
      const currentUser = this.authService.getCurrentUser();
      if (currentUser && (currentUser.role === 'admin' || currentUser.role === 'user')) {
        this.router.navigate(['/projects']);
      } else {
        console.log('User does not have required role');
        this.router.navigate(['/404'], {
          queryParams: { error: 'You do not have permission to access this page' }
        });
      }
    } else {
      console.log('User is not authenticated');
      this.router.navigate(['/login'], {
        queryParams: { 
          returnUrl: '/projects',
          error: 'Please log in to access this page'
        }
      });
    }
  }
} 