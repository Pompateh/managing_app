import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { Project } from '../../core/models/project.model';
import { ProjectService } from '../../core/services/project/project.service';
import { AuthService } from '../../core/services/auth/auth.service';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-project-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="container mx-auto px-4 py-8">
      <div class="flex justify-between items-center mb-8">
        <h1 class="text-3xl font-bold">Projects</h1>
        <button 
          *ngIf="isAdmin"
          (click)="createNewProject()"
          class="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors">
          Create Project
        </button>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div 
          *ngFor="let project of projects$ | async"
          class="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer"
          (click)="navigateToProject(project.id)">
          <div class="p-6">
            <div class="flex justify-between items-center mb-4">
              <h2 class="text-xl font-semibold">{{ project.name }}</h2>
              <span 
                class="px-3 py-1 rounded-full text-sm"
                [class.bg-green-100]="project.status === 'COMPLETED'"
                [class.text-green-800]="project.status === 'COMPLETED'"
                [class.bg-blue-100]="project.status === 'IN_PROGRESS'"
                [class.text-blue-800]="project.status === 'IN_PROGRESS'"
                [class.bg-yellow-100]="project.status === 'ON_HOLD'"
                [class.text-yellow-800]="project.status === 'ON_HOLD'"
                [class.bg-gray-100]="project.status === 'NOT_STARTED'"
                [class.text-gray-800]="project.status === 'NOT_STARTED'">
                {{ project.status | titlecase }}
              </span>
            </div>
            
            <p class="text-gray-600 mb-4">{{ project.description }}</p>
            
            <div class="space-y-4">
              <!-- Progress -->
              <div>
                <div class="flex justify-between text-sm mb-1">
                  <span>Progress</span>
                  <span>{{ project.completionPercentage }}%</span>
                </div>
                <div class="h-2 bg-gray-200 rounded-full">
                  <div 
                    class="h-full bg-blue-500 rounded-full transition-all duration-500"
                    [style.width]="project.completionPercentage + '%'">
                  </div>
                </div>
              </div>

              <!-- Deadline -->
              <div class="flex justify-between items-center text-sm">
                <span>Deadline</span>
                <span 
                  [class.text-red-600]="isOverdue(project)"
                  [class.font-semibold]="isOverdue(project)">
                  {{ project.deadline | date }}
                </span>
              </div>

              <!-- Team -->
              <div>
                <div class="text-sm mb-2">Team Members</div>
                <div class="flex flex-wrap gap-2">
                  <span 
                    *ngFor="let member of project.teamMembers"
                    class="px-2 py-1 bg-gray-100 rounded-full text-sm">
                    {{ member | slice:0:member.indexOf('@') }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class ProjectListComponent implements OnInit {
  projects$: Observable<Project[]>;
  isAdmin: boolean = false;

  constructor(
    private projectService: ProjectService,
    private authService: AuthService,
    private router: Router
  ) {
    this.projects$ = this.projectService.getProjects();
  }

  ngOnInit() {
    const currentUser = this.authService.getCurrentUser();
    this.isAdmin = currentUser?.role === 'admin';
  }

  navigateToProject(projectId: string) {
    this.router.navigate(['/projects', projectId]);
  }

  isOverdue(project: Project): boolean {
    return new Date() > new Date(project.deadline);
  }

  createNewProject() {
    // This is a placeholder - you'll need to implement the actual project creation logic
    alert('Project creation functionality will be implemented soon!');
  }
} 