import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-board-navbar',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatIconModule,
    MatButtonModule,
    MatInputModule,
    FormsModule,
    MatSnackBarModule
  ],
  template: `
    <nav class="board-navbar">
      <div class="nav-left">
        <a mat-icon-button routerLink="/projects" matTooltip="Back to Projects">
          <mat-icon>arrow_back</mat-icon>
        </a>
        <input
          matInput
          [value]="boardName"
          (blur)="onNameChange($event)"
          placeholder="Board Name"
          class="board-name-input"
        />
      </div>
      <div class="nav-right">
        <button mat-icon-button (click)="onSave()" matTooltip="Save Board">
          <mat-icon>save</mat-icon>
        </button>
        <a mat-icon-button routerLink="/projects" matTooltip="Back to Projects">
          <mat-icon>folder</mat-icon>
        </a>
      </div>
    </nav>
  `,
  styles: [`
    .board-navbar {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      height: 64px;
      background: white;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 16px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      z-index: 1000;
    }

    .nav-left, .nav-right {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .board-name-input {
      border: none;
      font-size: 1.2rem;
      padding: 4px 8px;
      border-radius: 4px;
      width: 200px;
      &:focus {
        outline: none;
        background: rgba(0,0,0,0.04);
      }
    }
  `]
})
export class BoardNavbarComponent {
  @Input() boardName: string = '';
  @Output() nameChange = new EventEmitter<string>();
  @Output() save = new EventEmitter<void>();

  constructor(private snackBar: MatSnackBar) {}

  onNameChange(event: Event) {
    const input = event.target as HTMLInputElement;
    this.nameChange.emit(input.value);
  }

  onSave() {
    this.save.emit();
    this.snackBar.open('Board saved successfully', 'Close', {
      duration: 2000,
      horizontalPosition: 'end',
      verticalPosition: 'top'
    });
  }
} 