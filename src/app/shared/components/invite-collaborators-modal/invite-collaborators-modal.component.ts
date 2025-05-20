import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatIconModule } from '@angular/material/icon';
import { UserService } from '../../../core/services/user/user.service';
import { UserRole } from '../../../core/models/user.model';

@Component({
  selector: 'app-invite-collaborators-modal',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatSnackBarModule,
    MatIconModule
  ],
  template: `
    <div class="p-6">
      <h2 class="text-2xl font-bold mb-6">Invite Collaborators</h2>
      
      <div class="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6">
        <div class="flex">
          <div class="flex-shrink-0">
            <mat-icon class="text-blue-500">info</mat-icon>
          </div>
          <div class="ml-3">
            <p class="text-sm text-blue-700">
              The collaborator will receive an invitation email and can sign in using their email address 
              with the default password: <strong>newstalgia123</strong>
            </p>
          </div>
        </div>
      </div>
      
      <form [formGroup]="inviteForm" (ngSubmit)="onSubmit()" class="space-y-4">
        <!-- Email -->
        <mat-form-field class="w-full">
          <mat-label>Email Address</mat-label>
          <input matInput formControlName="email" required type="email">
          <mat-error *ngIf="inviteForm.get('email')?.hasError('required')">
            Email is required
          </mat-error>
          <mat-error *ngIf="inviteForm.get('email')?.hasError('email')">
            Please enter a valid email address
          </mat-error>
        </mat-form-field>

        <!-- Role -->
        <mat-form-field class="w-full">
          <mat-label>Role</mat-label>
          <mat-select formControlName="role" required>
            <mat-option [value]="UserRole.MANAGER">Manager</mat-option>
            <mat-option [value]="UserRole.MEMBER">Member</mat-option>
            <mat-option [value]="UserRole.VIEWER">Viewer</mat-option>
          </mat-select>
          <mat-error *ngIf="inviteForm.get('role')?.hasError('required')">
            Role is required
          </mat-error>
        </mat-form-field>

        <div class="flex justify-end gap-4 mt-6">
          <button mat-button type="button" (click)="onCancel()">Cancel</button>
          <button 
            mat-raised-button 
            color="primary" 
            type="submit"
            [disabled]="inviteForm.invalid">
            Send Invitation
          </button>
        </div>
      </form>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
      max-width: 500px;
    }
  `]
})
export class InviteCollaboratorsModalComponent {
  inviteForm: FormGroup;
  UserRole = UserRole;

  constructor(
    private dialogRef: MatDialogRef<InviteCollaboratorsModalComponent>,
    private fb: FormBuilder,
    private userService: UserService,
    private snackBar: MatSnackBar
  ) {
    this.inviteForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      role: [UserRole.MEMBER, Validators.required]
    });
  }

  onSubmit() {
    if (this.inviteForm.valid) {
      const { email, role } = this.inviteForm.value;
      
      try {
        this.userService.inviteUser(email, role);
        this.snackBar.open('Collaborator invited successfully! They can sign in with their email and default password.', 'Close', {
          duration: 5000,
          horizontalPosition: 'end',
          verticalPosition: 'top'
        });
        this.dialogRef.close(true);
      } catch (error) {
        this.snackBar.open(error instanceof Error ? error.message : 'Failed to send invitation. Please try again.', 'Close', {
          duration: 5000,
          horizontalPosition: 'end',
          verticalPosition: 'top',
          panelClass: ['error-snackbar']
        });
      }
    }
  }

  onCancel() {
    this.dialogRef.close();
  }
} 