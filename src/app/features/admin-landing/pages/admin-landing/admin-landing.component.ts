import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../../core/services/auth/auth.service';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatBadgeModule } from '@angular/material/badge';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ProjectCreationModalComponent } from '../../../../shared/components/project-creation-modal/project-creation-modal.component';
import { ProjectService } from '../../../../core/services/project/project.service';
import { Project } from '../../../../core/models/project.model';
import { InviteCollaboratorsModalComponent } from '../../../../shared/components/invite-collaborators-modal/invite-collaborators-modal.component';
import { ManageRolesModalComponent } from '../../../../shared/components/manage-roles-modal/manage-roles-modal.component';
import { UserService } from '../../../../core/services/user/user.service';

@Component({
  selector: 'app-admin-landing',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatIconModule,
    MatButtonModule,
    MatCardModule,
    MatDividerModule,
    MatBadgeModule,
    MatDialogModule
  ],
  template: `
    <div class="min-h-screen bg-background-300 polka">
      <div class="container mx-auto px-4 py-8">
        <div class="max-w-7xl mx-auto">
          <h1 class="text-4xl font-bold text-center mb-8 text-gray-800">Admin Dashboard</h1>
          
          <!-- Quick Stats -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div class="bg-white rounded-lg p-6 shadow-lg">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-gray-600 text-sm font-medium">Total Projects</p>
                  <h3 class="text-2xl font-bold text-gray-800">{{ totalProjects }}</h3>
                </div>
                <mat-icon class="text-blue-500 text-3xl">folder</mat-icon>
              </div>
            </div>
            <div class="bg-white rounded-lg p-6 shadow-lg">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-gray-600 text-sm font-medium">Active Users</p>
                  <h3 class="text-2xl font-bold text-gray-800">{{ activeUsers }}</h3>
                </div>
                <mat-icon class="text-green-500 text-3xl">people</mat-icon>
              </div>
            </div>
            <div class="bg-white rounded-lg p-6 shadow-lg">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-gray-600 text-sm font-medium">Near Due Projects</p>
                  <h3 class="text-2xl font-bold" [class.text-red-500]="nearDueProjects.length > 0">
                    {{ nearDueProjects.length }}
                  </h3>
                </div>
                <mat-icon [class]="nearDueProjects.length > 0 ? 'text-red-500' : 'text-green-500'" class="text-3xl">
                  {{ nearDueProjects.length > 0 ? 'warning' : 'check_circle' }}
                </mat-icon>
              </div>
            </div>
          </div>

          <!-- Near Due Projects Alert -->
          <div *ngIf="nearDueProjects.length > 0" class="mb-8">
            <div class="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg">
              <div class="flex items-center">
                <mat-icon class="text-red-500 mr-3">warning</mat-icon>
                <div>
                  <h3 class="text-lg font-semibold text-red-700">Projects Near Due Date</h3>
                  <p class="text-red-600">The following projects are approaching their deadline:</p>
                </div>
              </div>
              <div class="mt-4 space-y-2">
                <div *ngFor="let project of nearDueProjects" 
                     class="bg-white p-3 rounded-lg shadow-sm flex items-center justify-between">
                  <div>
                    <h4 class="font-medium text-gray-900">{{ project.name }}</h4>
                    <p class="text-sm text-gray-600">
                      Due in {{ getDaysUntilDue(project.deadline) }} days
                      ({{ project.deadline | date:'mediumDate' }})
                    </p>
                  </div>
                  <button mat-button color="primary" (click)="navigateToProject(project.id)">
                    View Project
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Main Features Grid -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <!-- Project Management -->
            <div class="bg-white rounded-lg p-6 shadow-lg">
              <h2 class="text-xl font-bold mb-4 text-gray-800">Project Management</h2>
              <div class="space-y-4">
                <button 
                  (click)="openProjectCreationModal()"
                  class="w-full flex items-center justify-between p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
                  <span class="text-gray-800 font-medium">Create New Project</span>
                  <mat-icon class="text-blue-500">add_circle</mat-icon>
                </button>
                <button 
                  (click)="openVersionControl()"
                  class="w-full flex items-center justify-between p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
                  <span class="text-gray-800 font-medium">Version Control</span>
                  <mat-icon class="text-blue-500">history</mat-icon>
                </button>
              </div>
            </div>

            <!-- User Management -->
            <div class="bg-white rounded-lg p-6 shadow-lg">
              <h2 class="text-xl font-bold mb-4 text-gray-800">User Management</h2>
              <div class="space-y-4">
                <button 
                  (click)="openInviteCollaborators()"
                  class="w-full flex items-center justify-between p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors">
                  <span class="text-gray-800 font-medium">Invite Collaborators</span>
                  <mat-icon class="text-green-500">person_add</mat-icon>
                </button>
                <button 
                  (click)="openManageRoles()"
                  class="w-full flex items-center justify-between p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors">
                  <span class="text-gray-800 font-medium">Manage Roles</span>
                  <mat-icon class="text-green-500">admin_panel_settings</mat-icon>
                </button>
                <button 
                  (click)="openUserActivity()"
                  class="w-full flex items-center justify-between p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors">
                  <span class="text-gray-800 font-medium">User Activity</span>
                  <mat-icon class="text-green-500">analytics</mat-icon>
                </button>
              </div>
            </div>
          </div>

          <!-- Recent Activity -->
          <div class="mt-8 bg-white rounded-lg p-6 shadow-lg">
            <h2 class="text-xl font-bold mb-4 text-gray-800">Recent Activity</h2>
            <div class="space-y-4">
              <div *ngFor="let activity of recentActivities" 
                   class="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div class="flex items-center">
                  <mat-icon [class]="'text-' + activity.iconColor + '-500 mr-3'">{{ activity.icon }}</mat-icon>
                  <div>
                    <p class="font-semibold text-gray-800">{{ activity.title }}</p>
                    <p class="text-sm text-gray-600">{{ activity.description }}</p>
                  </div>
                </div>
                <mat-icon class="text-gray-400">chevron_right</mat-icon>
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
export class AdminLandingComponent implements OnInit {
  totalProjects: number = 0;
  activeUsers: number = 0;
  recentActivities: any[] = [];
  nearDueProjects: Project[] = [];
  private readonly DUE_DATE_THRESHOLD_DAYS = 7; // Show projects due within 7 days

  constructor(
    private router: Router,
    private authService: AuthService,
    private dialog: MatDialog,
    private projectService: ProjectService
  ) {}

  ngOnInit() {
    this.loadDashboardData();
  }

  private loadDashboardData() {
    // Load total projects and check for near due dates
    this.projectService.getProjects().subscribe(projects => {
      this.totalProjects = projects.length;
      this.nearDueProjects = this.getNearDueProjects(projects);
    });

    // TODO: Load active users from user service
    this.activeUsers = 156;

    // Load recent activities
    this.recentActivities = [
      {
        icon: 'edit',
        iconColor: 'blue',
        title: 'Project "Website Redesign" Updated',
        description: 'By John Doe - 2 hours ago'
      },
      {
        icon: 'person_add',
        iconColor: 'green',
        title: 'New User Invited',
        description: 'By Admin - 4 hours ago'
      }
    ];
  }

  private getNearDueProjects(projects: Project[]): Project[] {
    const today = new Date();
    return projects.filter(project => {
      if (!project.deadline || project.status === 'COMPLETED') return false;
      
      const deadline = new Date(project.deadline);
      const daysUntilDue = Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      
      return daysUntilDue <= this.DUE_DATE_THRESHOLD_DAYS && daysUntilDue >= 0;
    }).sort((a, b) => {
      const dateA = new Date(a.deadline).getTime();
      const dateB = new Date(b.deadline).getTime();
      return dateA - dateB;
    });
  }

  getDaysUntilDue(deadline: Date): number {
    const today = new Date();
    const dueDate = new Date(deadline);
    return Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  }

  navigateToProject(projectId: string) {
    this.router.navigate(['/projects', projectId]);
  }

  openProjectCreationModal() {
    const dialogRef = this.dialog.open(ProjectCreationModalComponent, {
      width: '600px',
      disableClose: true
    });

    dialogRef.afterClosed().subscribe(async (result: Partial<Project>) => {
      if (result) {
        try {
          const newProject = await this.projectService.createProject(result);
          this.router.navigate(['/projects', newProject.id]);
        } catch (error) {
          console.error('Error creating project:', error);
        }
      }
    });
  }

  openVersionControl() {
    // TODO: Implement version control
    console.log('Version control will be implemented soon');
  }

  openInviteCollaborators() {
    const dialogRef = this.dialog.open(InviteCollaboratorsModalComponent, {
      width: '500px',
      disableClose: true
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadDashboardData();
      }
    });
  }

  openManageRoles() {
    const dialogRef = this.dialog.open(ManageRolesModalComponent, {
      width: '800px',
      disableClose: true
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadDashboardData();
      }
    });
  }

  openUserActivity() {
    // TODO: Implement user activity
    console.log('User activity will be implemented soon');
  }
} 