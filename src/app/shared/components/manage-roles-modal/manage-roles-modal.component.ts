import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { UserService } from '../../../core/services/user/user.service';
import { User, UserRole, UserStatus } from '../../../core/models/user.model';

@Component({
  selector: 'app-manage-roles-modal',
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
    MatTableModule,
    MatIconModule
  ],
  template: `
    <div class="p-6">
      <h2 class="text-2xl font-bold mb-6">Manage User Roles</h2>
      
      <div class="overflow-x-auto">
        <table mat-table [dataSource]="users" class="w-full">
          <!-- Email Column -->
          <ng-container matColumnDef="email">
            <th mat-header-cell *matHeaderCellDef>Email</th>
            <td mat-cell *matCellDef="let user">{{ user.email }}</td>
          </ng-container>

          <!-- Role Column -->
          <ng-container matColumnDef="role">
            <th mat-header-cell *matHeaderCellDef>Role</th>
            <td mat-cell *matCellDef="let user">
              <mat-form-field class="w-full">
                <mat-select [value]="user.role" (selectionChange)="updateUserRole(user, $event.value)">
                  <mat-option [value]="UserRole.ADMIN">Admin</mat-option>
                  <mat-option [value]="UserRole.MANAGER">Manager</mat-option>
                  <mat-option [value]="UserRole.MEMBER">Member</mat-option>
                  <mat-option [value]="UserRole.VIEWER">Viewer</mat-option>
                </mat-select>
              </mat-form-field>
            </td>
          </ng-container>

          <!-- Status Column -->
          <ng-container matColumnDef="status">
            <th mat-header-cell *matHeaderCellDef>Status</th>
            <td mat-cell *matCellDef="let user">
              <span [class]="getStatusClass(user.status)">
                {{ user.status }}
              </span>
            </td>
          </ng-container>

          <!-- Actions Column -->
          <ng-container matColumnDef="actions">
            <th mat-header-cell *matHeaderCellDef>Actions</th>
            <td mat-cell *matCellDef="let user">
              <button 
                mat-icon-button 
                [color]="user.status === UserStatus.ACTIVE ? 'warn' : 'primary'"
                (click)="toggleUserStatus(user)">
                <mat-icon>
                  {{ user.status === UserStatus.ACTIVE ? 'block' : 'check_circle' }}
                </mat-icon>
              </button>
            </td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
          <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
        </table>
      </div>

      <div class="flex justify-end mt-6">
        <button mat-button (click)="onClose()">Close</button>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
      max-width: 800px;
    }

    .status-active {
      @apply text-green-600 font-medium;
    }

    .status-inactive {
      @apply text-red-600 font-medium;
    }

    .status-pending {
      @apply text-yellow-600 font-medium;
    }
  `]
})
export class ManageRolesModalComponent implements OnInit {
  users: User[] = [];
  displayedColumns: string[] = ['email', 'role', 'status', 'actions'];
  UserRole = UserRole;
  UserStatus = UserStatus;

  constructor(
    private dialogRef: MatDialogRef<ManageRolesModalComponent>,
    private userService: UserService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit() {
    this.loadUsers();
  }

  private loadUsers() {
    this.userService.getUsers().subscribe(users => {
      this.users = users;
    });
  }

  updateUserRole(user: User, newRole: UserRole) {
    try {
      this.userService.updateUserRole(user.id, newRole);
      this.snackBar.open('User role updated successfully', 'Close', {
        duration: 3000,
        horizontalPosition: 'end',
        verticalPosition: 'top'
      });
    } catch (error) {
      this.snackBar.open('Failed to update user role', 'Close', {
        duration: 5000,
        horizontalPosition: 'end',
        verticalPosition: 'top',
        panelClass: ['error-snackbar']
      });
    }
  }

  toggleUserStatus(user: User) {
    try {
      if (user.status === UserStatus.ACTIVE) {
        this.userService.deactivateUser(user.id);
        this.snackBar.open('User deactivated successfully', 'Close', {
          duration: 3000,
          horizontalPosition: 'end',
          verticalPosition: 'top'
        });
      } else {
        this.userService.activateUser(user.id);
        this.snackBar.open('User activated successfully', 'Close', {
          duration: 3000,
          horizontalPosition: 'end',
          verticalPosition: 'top'
        });
      }
    } catch (error) {
      this.snackBar.open('Failed to update user status', 'Close', {
        duration: 5000,
        horizontalPosition: 'end',
        verticalPosition: 'top',
        panelClass: ['error-snackbar']
      });
    }
  }

  getStatusClass(status: UserStatus): string {
    switch (status) {
      case UserStatus.ACTIVE:
        return 'status-active';
      case UserStatus.INACTIVE:
        return 'status-inactive';
      case UserStatus.PENDING:
        return 'status-pending';
      default:
        return '';
    }
  }

  onClose() {
    this.dialogRef.close();
  }
} 