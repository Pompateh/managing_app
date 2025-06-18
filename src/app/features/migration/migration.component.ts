import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MigrationService } from '../../core/services/supabase/migration.service';

@Component({
  selector: 'app-migration',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatProgressBarModule,
    MatCardModule,
    MatIconModule
  ],
  template: `
    <div class="container mx-auto px-4 py-8">
      <mat-card class="max-w-2xl mx-auto">
        <mat-card-header>
          <mat-card-title>Data Migration</mat-card-title>
          <mat-card-subtitle>Migrate your data to Supabase</mat-card-subtitle>
        </mat-card-header>

        <mat-card-content class="p-6">
          <div class="mb-6">
            <p class="text-gray-600 mb-4">
              This will migrate your local data to Supabase. Make sure you have backed up your data before proceeding.
            </p>
            <div class="flex items-center gap-4">
              <mat-progress-bar
                mode="determinate"
                [value]="migrationStatus.progress"
                [color]="migrationStatus.status === 'error' ? 'warn' : 'primary'">
              </mat-progress-bar>
              <span class="text-sm text-gray-600">{{ migrationStatus.progress }}%</span>
            </div>
            <p class="mt-2 text-sm" [ngClass]="{
              'text-gray-600': migrationStatus.status === 'idle',
              'text-blue-600': migrationStatus.status === 'in_progress',
              'text-green-600': migrationStatus.status === 'completed',
              'text-red-600': migrationStatus.status === 'error'
            }">
              {{ migrationStatus.message }}
            </p>
          </div>
        </mat-card-content>

        <mat-card-actions class="p-6 pt-0 flex justify-end">
          <button
            mat-raised-button
            color="primary"
            (click)="startMigration()"
            [disabled]="migrationStatus.status === 'in_progress'">
            <mat-icon class="mr-2">cloud_upload</mat-icon>
            Start Migration
          </button>
        </mat-card-actions>
      </mat-card>
    </div>
  `,
  styles: []
})
export class MigrationComponent implements OnInit {
  migrationStatus = {
    status: 'idle' as 'idle' | 'in_progress' | 'completed' | 'error',
    progress: 0,
    message: ''
  };

  constructor(private migrationService: MigrationService) {}

  ngOnInit() {
    this.migrationService.getMigrationStatus().subscribe(status => {
      this.migrationStatus = status;
    });
  }

  async startMigration() {
    try {
      await this.migrationService.migrateData();
    } catch (error) {
      console.error('Migration failed:', error);
    }
  }
} 