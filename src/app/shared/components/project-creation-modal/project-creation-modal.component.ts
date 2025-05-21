import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Project, ProjectStatus } from '../../../core/models/project.model';

@Component({
  selector: 'app-project-creation-modal',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatSelectModule,
    MatSnackBarModule
  ],
  template: `
    <div class="p-6">
      <h2 class="text-2xl font-bold mb-6">Create New Project</h2>
      
      <form [formGroup]="projectForm" (ngSubmit)="onSubmit()" class="space-y-4">
        <!-- Project Name -->
        <mat-form-field class="w-full">
          <mat-label>Project Name</mat-label>
          <input matInput formControlName="name" required>
          <mat-error *ngIf="projectForm.get('name')?.hasError('required')">
            Project name is required
          </mat-error>
          <mat-error *ngIf="projectForm.get('name')?.hasError('minlength')">
            Project name must be at least 3 characters
          </mat-error>
        </mat-form-field>

        <!-- Project Description -->
        <mat-form-field class="w-full">
          <mat-label>Description</mat-label>
          <textarea matInput formControlName="description" rows="3"></textarea>
          <mat-error *ngIf="projectForm.get('description')?.hasError('maxlength')">
            Description cannot exceed 500 characters
          </mat-error>
        </mat-form-field>

        <!-- Deadline -->
        <mat-form-field class="w-full">
          <mat-label>Deadline</mat-label>
          <input matInput [matDatepicker]="picker" formControlName="deadline" required>
          <mat-datepicker-toggle matSuffix [for]="picker"></mat-datepicker-toggle>
          <mat-datepicker #picker></mat-datepicker>
          <mat-error *ngIf="projectForm.get('deadline')?.hasError('required')">
            Deadline is required
          </mat-error>
          <mat-error *ngIf="projectForm.get('deadline')?.hasError('invalidDate')">
            Deadline must be in the future
          </mat-error>
        </mat-form-field>

        <!-- Status -->
        <mat-form-field class="w-full">
          <mat-label>Status</mat-label>
          <mat-select formControlName="status" required>
            <mat-option [value]="ProjectStatus.NOT_STARTED">Not Started</mat-option>
            <mat-option [value]="ProjectStatus.IN_PROGRESS">In Progress</mat-option>
            <mat-option [value]="ProjectStatus.ON_HOLD">On Hold</mat-option>
            <mat-option [value]="ProjectStatus.COMPLETED">Completed</mat-option>
          </mat-select>
          <mat-error *ngIf="projectForm.get('status')?.hasError('required')">
            Status is required
          </mat-error>
        </mat-form-field>

        <!-- Team Members -->
        <mat-form-field class="w-full">
          <mat-label>Team Members (comma-separated emails)</mat-label>
          <input matInput formControlName="teamMembers" (blur)="updateTeamMembers()">
          <mat-error *ngIf="projectForm.get('teamMembers')?.hasError('invalidEmails')">
            Please enter valid email addresses separated by commas
          </mat-error>
        </mat-form-field>

        <div class="flex justify-end gap-4 mt-6">
          <button mat-button type="button" (click)="onCancel()">Cancel</button>
          <button 
            mat-raised-button 
            color="primary" 
            type="submit"
            [disabled]="projectForm.invalid">
            Create Project
          </button>
        </div>
      </form>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
      max-width: 600px;
    }
  `]
})
export class ProjectCreationModalComponent {
  @Output() projectCreated = new EventEmitter<Project>();
  
  projectForm: FormGroup;
  ProjectStatus = ProjectStatus;

  constructor(
    private dialogRef: MatDialogRef<ProjectCreationModalComponent>,
    private fb: FormBuilder,
    private snackBar: MatSnackBar
  ) {
    this.projectForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      description: ['', [Validators.maxLength(500)]],
      deadline: ['', [Validators.required, this.futureDateValidator()]],
      status: [ProjectStatus.NOT_STARTED, Validators.required],
      teamMembers: ['', [this.emailListValidator()]]
    });
  }

  futureDateValidator() {
    return (control: any) => {
      const date = new Date(control.value);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return date >= today ? null : { invalidDate: true };
    };
  }

  emailListValidator() {
    return (control: any) => {
      if (!control.value) return null;
      const emails = control.value.split(',').map((email: string) => email.trim());
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const invalidEmails = emails.filter((email: string) => !emailRegex.test(email));
      return invalidEmails.length > 0 ? { invalidEmails: true } : null;
    };
  }

  updateTeamMembers() {
    const teamMembersInput = this.projectForm.get('teamMembers')?.value;
    if (teamMembersInput) {
      const emails = teamMembersInput
        .split(',')
        .map((email: string) => email.trim())
        .filter((email: string) => email.length > 0);
      this.projectForm.patchValue({ teamMembers: emails.join(', ') });
    }
  }

  onSubmit() {
    if (this.projectForm.valid) {
      const formValue = this.projectForm.value;
      const project: Partial<Project> = {
        name: formValue.name,
        description: formValue.description,
        deadline: formValue.deadline,
        status: formValue.status,
        completionPercentage: 0,
        createdAt: new Date(),
        teamMembers: formValue.teamMembers
          ? formValue.teamMembers.split(',').map((email: string) => email.trim())
          : [],
        phases: {}
      };

      this.projectCreated.emit(project as Project);
      this.dialogRef.close(project);
      this.snackBar.open('Project created successfully!', 'Close', {
        duration: 3000,
        horizontalPosition: 'end',
        verticalPosition: 'top'
      });
    } else {
      this.snackBar.open('Please fill in all required fields correctly', 'Close', {
        duration: 5000,
        horizontalPosition: 'end',
        verticalPosition: 'top',
        panelClass: ['error-snackbar']
      });
    }
  }

  onCancel() {
    this.dialogRef.close();
  }
} 