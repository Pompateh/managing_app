import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Project, PhaseContent } from '../../core/models/project.model';
import { ProjectService } from '../../core/services/project/project.service';
import { AuthService } from '../../core/services/auth/auth.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BoardDataService } from '../../shared/services/board-data/board-data.service';

@Component({
  selector: 'app-project-details',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="container mx-auto px-4 py-8" *ngIf="project">
      <div class="flex justify-between items-center mb-8">
        <div>
          <h1 class="text-3xl font-bold">{{ project?.name }}</h1>
          <p class="text-gray-600">{{ project?.description }}</p>
        </div>
        <div *ngIf="isAdmin" class="flex gap-4">
          <button 
            (click)="addNewPhase()"
            class="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors">
            Add New Phase
          </button>
        </div>
      </div>
      
      <!-- Project Progress -->
      <div class="bg-white rounded-lg shadow-md p-6 mb-8">
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-xl font-semibold">Overall Progress</h2>
          <span class="text-2xl font-bold text-blue-500">{{ project?.completionPercentage }}%</span>
        </div>
        <div class="h-2 bg-gray-200 rounded-full">
          <div 
            class="h-full bg-blue-500 rounded-full transition-all duration-500"
            [style.width]="(project?.completionPercentage || 0) + '%'">
          </div>
        </div>
      </div>
      
      <!-- Main Phases -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 mb-8">
        <div 
          *ngFor="let phase of getPhases()" 
          class="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer"
          [class.border-2]="selectedPhase === phase.key"
          [class.border-blue-500]="selectedPhase === phase.key"
          (click)="selectPhase(phase.key)">
          <div class="p-6">
            <div class="flex justify-between items-center mb-4">
              <h2 class="text-xl font-semibold">{{ phase.content.name }}</h2>
              <div class="flex items-center gap-2">
                <button 
                  *ngIf="isAdmin"
                  (click)="togglePhaseCompletion(phase.key, $event)"
                  [class.text-green-500]="phase.content.completed"
                  [class.text-gray-400]="!phase.content.completed"
                  class="hover:text-green-600">
                  <i class="fas" [class.fa-check-circle]="phase.content.completed" [class.fa-circle]="!phase.content.completed"></i>
                </button>
                <button 
                  *ngIf="isAdmin"
                  (click)="removePhase(phase.key, $event)"
                  class="text-red-500 hover:text-red-600">
                  <i class="fas fa-times"></i>
                </button>
              </div>
            </div>
            <p class="text-gray-600 text-sm mb-4">{{ phase.content.description }}</p>
            <div class="h-1 bg-gray-200 rounded">
              <div 
                class="h-full bg-blue-500 rounded transition-all duration-500"
                [style.width]="phase.content.completed ? '100%' : '0%'">
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Phase Details -->
      <div *ngIf="selectedPhase && getSelectedPhaseContent()" class="bg-white rounded-lg shadow-md p-6">
        <div class="flex justify-between items-center mb-6">
          <h2 class="text-2xl font-bold">{{ getSelectedPhaseContent()?.name }}</h2>
          <div *ngIf="isAdmin" class="flex gap-4">
            <button 
              *ngIf="selectedPhase === 'present'"
              (click)="addNewSubPhase()"
              class="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors">
              Add Sub-phase
            </button>
          </div>
        </div>

        <!-- Content Editor -->
        <div class="mb-6">
          <textarea
            *ngIf="isAdmin && getSelectedPhaseContent()"
            [(ngModel)]="getSelectedPhaseContent()!.content"
            (blur)="updatePhaseContent()"
            class="w-full h-32 p-4 border rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="Add phase content...">
          </textarea>
          <div *ngIf="!isAdmin && getSelectedPhaseContent()?.content" class="prose max-w-none">
            {{ getSelectedPhaseContent()?.content }}
          </div>
        </div>

        <!-- Sub-phases (for Present phase) -->
        <div *ngIf="selectedPhase === 'present' && getSelectedPhaseContent()?.subPhases">
          <h3 class="text-xl font-semibold mb-4">Presentation Phases</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div 
              *ngFor="let subPhase of getSubPhases()"
              class="bg-gray-50 rounded-lg p-4">
              <div class="flex justify-between items-center mb-2">
                <h4 class="font-semibold">{{ subPhase.content.name }}</h4>
                <div class="flex items-center gap-2">
                  <button 
                    *ngIf="subPhase.key === 'conceptAndMood'"
                    (click)="openConceptMoodBoard($event)"
                    class="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 transition-colors">
                    Open Board
                  </button>
                  <button 
                    *ngIf="isAdmin"
                    (click)="toggleSubPhaseCompletion(subPhase.key, $event)"
                    [class.text-green-500]="subPhase.content.completed"
                    [class.text-gray-400]="!subPhase.content.completed"
                    class="hover:text-green-600">
                    <i class="fas" [class.fa-check-circle]="subPhase.content.completed" [class.fa-circle]="!subPhase.content.completed"></i>
                  </button>
                  <button 
                    *ngIf="isAdmin"
                    (click)="removeSubPhase(subPhase.key, $event)"
                    class="text-red-500 hover:text-red-600">
                    <i class="fas fa-times"></i>
                  </button>
                </div>
              </div>
              <p class="text-sm text-gray-600">{{ subPhase.content.description }}</p>
            </div>
          </div>
        </div>

        <!-- Comments Section -->
        <div class="mt-8">
          <h3 class="text-xl font-semibold mb-4">Comments</h3>
          <div class="space-y-4">
            <div *ngFor="let comment of getSelectedPhaseContent()?.comments" class="bg-gray-50 rounded-lg p-4">
              <div class="flex justify-between items-center mb-2">
                <span class="font-semibold">{{ comment.createdBy }}</span>
                <span class="text-sm text-gray-500">{{ comment.createdAt | date:'short' }}</span>
              </div>
              <p>{{ comment.content }}</p>
            </div>
          </div>
          
          <!-- Add Comment -->
          <div class="mt-4">
            <textarea
              [(ngModel)]="newComment"
              class="w-full p-4 border rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Add a comment...">
            </textarea>
            <button
              (click)="addComment()"
              class="mt-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors">
              Add Comment
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class ProjectDetailsComponent implements OnInit, OnDestroy {
  project: Project | undefined;
  selectedPhase: string = '';
  newComment: string = '';
  isAdmin: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private projectService: ProjectService,
    private authService: AuthService,
    private boardData: BoardDataService
  ) {}

  ngOnInit() {
    const projectId = this.route.snapshot.paramMap.get('id');
    if (projectId) {
      // Check if we're returning from the board view
      const returnedFromBoard = history.state?.returnedFromBoard;
      
      // Always refresh project data when initializing
      this.projectService.refreshProject(projectId).then(updatedProject => {
        if (updatedProject) {
          this.project = updatedProject;
          if (returnedFromBoard) {
            this.selectedPhase = 'present';
          }
        }
      });
    }
    
    const currentUser = this.authService.getCurrentUser();
    this.isAdmin = currentUser?.role === 'admin';
  }

  getPhases() {
    if (!this.project) return [];
    return Object.entries(this.project.phases).map(([key, content]) => ({
      key,
      content
    }));
  }

  getSubPhases() {
    if (!this.project || !this.selectedPhase) return [];
    const selectedPhaseContent = this.project.phases[this.selectedPhase];
    if (!selectedPhaseContent.subPhases) return [];
    return Object.entries(selectedPhaseContent.subPhases).map(([key, content]) => ({
      key,
      content
    }));
  }

  selectPhase(phaseKey: string) {
    this.selectedPhase = phaseKey;
  }

  getSelectedPhaseContent(): PhaseContent | undefined {
    return this.project?.phases[this.selectedPhase];
  }

  updatePhaseContent() {
    if (!this.project || !this.selectedPhase) return;
    const content = this.getSelectedPhaseContent();
    if (content) {
      this.projectService.updatePhase(this.project.id, this.selectedPhase, content);
    }
  }

  togglePhaseCompletion(phaseKey: string, event: Event) {
    event.stopPropagation();
    if (!this.project) return;
    
    const phase = this.project.phases[phaseKey];
    phase.completed = !phase.completed;
    this.projectService.updatePhase(this.project.id, phaseKey, phase);
  }

  toggleSubPhaseCompletion(subPhaseKey: string, event: Event) {
    event.stopPropagation();
    if (!this.project || !this.selectedPhase) return;
    
    const phase = this.project.phases[this.selectedPhase];
    if (phase.subPhases && phase.subPhases[subPhaseKey]) {
      phase.subPhases[subPhaseKey].completed = !phase.subPhases[subPhaseKey].completed;
      this.projectService.updatePhase(this.project.id, this.selectedPhase, phase);
    }
  }

  addNewPhase() {
    if (!this.project) return;
    const phaseName = prompt('Enter phase name:');
    if (phaseName) {
      this.projectService.addPhase(this.project.id, phaseName);
    }
  }

  addNewSubPhase() {
    if (!this.project) return;
    const subPhaseName = prompt('Enter sub-phase name:');
    if (subPhaseName) {
      this.projectService.addPhase(this.project.id, subPhaseName, this.selectedPhase);
    }
  }

  removePhase(phaseKey: string, event: Event) {
    event.stopPropagation();
    if (!this.project) return;
    
    if (confirm(`Are you sure you want to remove the "${this.project.phases[phaseKey].name}" phase?`)) {
      this.projectService.removePhase(this.project.id, phaseKey);
      if (this.selectedPhase === phaseKey) {
        this.selectedPhase = '';
      }
    }
  }

  removeSubPhase(subPhaseKey: string, event: Event) {
    event.stopPropagation();
    if (!this.project || !this.selectedPhase) return;
    
    const phase = this.project.phases[this.selectedPhase];
    if (phase.subPhases && phase.subPhases[subPhaseKey]) {
      if (confirm(`Are you sure you want to remove the "${phase.subPhases[subPhaseKey].name}" sub-phase?`)) {
        this.projectService.removePhase(this.project.id, subPhaseKey, this.selectedPhase);
      }
    }
  }

  addComment() {
    if (!this.project || !this.selectedPhase || !this.newComment.trim()) return;
    this.projectService.addComment(this.project.id, this.selectedPhase, this.newComment.trim());
    this.newComment = '';
  }

  openConceptMoodBoard(event: Event) {
    event.stopPropagation();
    if (!this.project) return;

    // Try to find a board for this project
    let board = this.boardData.boards.find(b => b.projectId === this.project?.id);
    
    if (!board) {
      // Create a new board for this project with the project name
      const newBoardId = this.boardData.createBoard({
        id: '',
        dateCreated: new Date(),
        name: `${this.project.name} - Concept & Mood`,
        connetions: [],
        elements: [],
        groups: [],
        zoomScale: 1,
        projectId: this.project.id
      }, true);
      
      this.router.navigate(['/board'], {
        queryParams: { id: newBoardId },
        state: { projectId: this.project?.id }
      });
      return;
    }

    // If the board exists but has the default name, update it
    if (board.name === 'Untitled board') {
      this.boardData.editBoardName(board.id, `${this.project.name} - Concept & Mood`);
    }

    // Navigate to existing board
    this.router.navigate(['/board'], {
      queryParams: { id: board.id },
      state: { projectId: this.project?.id }
    });
  }

  // Add cleanup when component is destroyed
  ngOnDestroy() {
    // Clear any remaining board-related state
    if (this.project) {
      this.projectService.updateProject(this.project);
    }
  }
} 