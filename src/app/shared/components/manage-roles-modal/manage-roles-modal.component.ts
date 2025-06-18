import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { MatDialog, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { UserService } from '../../../core/services/user/user.service';
import { User, UserRole, UserStatus } from '../../../core/models/user.model';
import { ProjectService } from '../../../core/services/project/project.service';

@Component({
  selector: 'app-confirm-dialog',
  template: `
    <div class="p-6">
      <h3 class="text-lg font-bold mb-4">Delete User</h3>
      <p>Are you sure you want to delete this user? This action can be undone.</p>
      <div class="flex justify-end gap-4 mt-6">
        <button mat-button (click)="onCancel()">Cancel</button>
        <button mat-raised-button color="warn" (click)="onConfirm()">Delete</button>
      </div>
    </div>
  `,
  standalone: true,
  imports: [CommonModule, MatButtonModule]
})
export class ConfirmDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<ConfirmDialogComponent>
  ) {}

  onCancel(): void {
    this.dialogRef.close(false);
  }

  onConfirm(): void {
    this.dialogRef.close(true);
  }
}

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
        <table mat-table [dataSource]="users" class="w-full" style="table-layout: fixed; width: 100%;">
          <!-- Email Column -->
          <ng-container matColumnDef="email">
            <th mat-header-cell *matHeaderCellDef style="padding: 12px; text-align: center; vertical-align: middle;">Email</th>
            <td mat-cell *matCellDef="let user">{{ user.email }}</td>
          </ng-container>

          <!-- Role Column -->
          <ng-container matColumnDef="role">
            <th mat-header-cell *matHeaderCellDef style="padding: 12px; text-align: center; vertical-align: middle;">Role</th>
            <td mat-cell *matCellDef="let user">
              <mat-form-field class="max-w-xs w-full" style="width: 100%; text-align: center;">
                <mat-select [value]="user.role" (selectionChange)="updateUserRole(user, $event.value)">
                  <mat-option [value]="UserRole.ADMIN">Admin</mat-option>
                  <mat-option [value]="UserRole.MANAGER">Manager</mat-option>
                  <mat-option [value]="UserRole.MEMBER">Member</mat-option>
                  <mat-option [value]="UserRole.VIEWER">Viewer</mat-option>
                </mat-select>
              </mat-form-field>
            </td>
          </ng-container>

          <!-- Assigned Project Column -->
          <ng-container matColumnDef="assignedProject">
            <th mat-header-cell *matHeaderCellDef style="padding: 12px; text-align: center; vertical-align: middle;">Assigned Project</th>
            <td mat-cell *matCellDef="let user">
              <ng-container *ngIf="user.role === UserRole.VIEWER && user.assignedProjectId">
                {{ getProjectName(user.assignedProjectId) }}
              </ng-container>
              <ng-container *ngIf="user.role !== UserRole.VIEWER || !user.assignedProjectId">-</ng-container>
            </td>
          </ng-container>

          <!-- Status Column -->
          <ng-container matColumnDef="status">
            <th mat-header-cell *matHeaderCellDef style="padding: 12px; text-align: center; vertical-align: middle;">Status</th>
            <td mat-cell *matCellDef="let user">
              <span [class]="getStatusClass(user.status)" style="display: block; text-align: center;">{{ user.status }}</span>
            </td>
          </ng-container>

          <!-- Actions Column -->
          <ng-container matColumnDef="actions">
            <th mat-header-cell *matHeaderCellDef style="padding: 12px; text-align: center; vertical-align: middle;">Actions</th>
            <td mat-cell *matCellDef="let user" style="width: 120px; min-width: 120px; text-align: center; vertical-align: middle;">
              <button (click)="toggleUserStatus(user)" style="background: none; border: none; cursor: pointer; font-size: 24px;">
                <span [style.color]="user.status === UserStatus.ACTIVE ? '#ef4444' : '#22c55e'">
                  {{ user.status === UserStatus.ACTIVE ? '🚫' : '✅' }}
                </span>
              </button>
              <button (click)="confirmDeleteUser(user)" style="background: none; border: none; cursor: pointer; font-size: 22px; margin-left: 8px;" title="Delete User">
                <span style="color: #ef4444;">🗑️</span>
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
  displayedColumns: string[] = ['email', 'role', 'assignedProject', 'status', 'actions'];
  UserRole = UserRole;
  UserStatus = UserStatus;
  @ViewChild('confirmDialog') confirmDialog!: TemplateRef<any>;
  deletedUser: User | null = null;
  deletedUserIndex: number | null = null;

  constructor(
    private dialogRef: MatDialogRef<ManageRolesModalComponent>,
    private userService: UserService,
    private snackBar: MatSnackBar,
    private projectService: ProjectService,
    private dialog: MatDialog
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

  getProjectName(projectId: string): string {
    return this.projectService.getProjectName(projectId);
  }

  onClose() {
    this.dialogRef.close();
  }

  confirmDeleteUser(user: User) {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      disableClose: true
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.deleteUser(user);
      }
    });
  }

  deleteUser(user: User) {
    try {
      this.deletedUser = user;
      this.deletedUserIndex = this.users.findIndex(u => u.id === user.id);
      this.users = this.users.filter(u => u.id !== user.id);
      this.userService.deleteUser(user.id);
      this.snackBar.open('User deleted', 'Undo', {
        duration: 5000,
        horizontalPosition: 'end',
        verticalPosition: 'top'
      }).onAction().subscribe(() => {
        if (this.deletedUser && this.deletedUserIndex !== null) {
          this.users.splice(this.deletedUserIndex, 0, this.deletedUser);
          this.userService.saveUsers(this.users);
          this.deletedUser = null;
          this.deletedUserIndex = null;
        }
      });
    } catch (error) {
      this.snackBar.open('Failed to delete user', 'Close', {
        duration: 5000,
        horizontalPosition: 'end',
        verticalPosition: 'top',
        panelClass: ['error-snackbar']
      });
    }
  }
} 