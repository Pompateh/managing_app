import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-image-upload-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule],
  template: `
    <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg p-6 w-96">
        <h2 class="text-xl font-semibold mb-4">Add Image</h2>
        
        <!-- URL Input -->
        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-700 mb-2">Image URL</label>
          <input 
            type="text" 
            [(ngModel)]="imageUrl" 
            placeholder="Enter image URL"
            class="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          />
          <button 
            (click)="useImageUrl()"
            class="mt-2 w-full bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors">
            Use URL
          </button>
        </div>

        <!-- File Upload -->
        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-700 mb-2">Upload Image</label>
          <div class="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
            <input 
              type="file" 
              accept="image/*" 
              (change)="onFileSelected($event)"
              class="hidden" 
              #fileInput
            />
            <button 
              (click)="fileInput.click()"
              class="w-full bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors">
              Choose File
            </button>
            <p class="text-sm text-gray-500 mt-2">{{ selectedFileName || 'No file chosen' }}</p>
          </div>
        </div>

        <!-- Close Button -->
        <button 
          (click)="close()"
          class="w-full bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors">
          Cancel
        </button>
      </div>
    </div>
  `,
  styles: []
})
export class ImageUploadModalComponent {
  @Output() imageSelected = new EventEmitter<string>();
  @Output() closeModal = new EventEmitter<void>();

  imageUrl: string = '';
  selectedFileName: string = '';

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;
    
    const file = input.files[0];
    this.selectedFileName = file.name;
    
    const reader = new FileReader();
    reader.onload = (e: any) => {
      this.imageSelected.emit(e.target.result);
      this.close();
    };
    reader.readAsDataURL(file);
  }

  useImageUrl() {
    if (this.imageUrl) {
      this.imageSelected.emit(this.imageUrl);
      this.close();
    }
  }

  close() {
    this.closeModal.emit();
  }
} 