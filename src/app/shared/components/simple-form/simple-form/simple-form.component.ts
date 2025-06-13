import { CommonModule } from '@angular/common';
import { AfterContentInit, Component, ContentChild, ElementRef, EventEmitter, Input, Output, Renderer2, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Button } from '@custom-interfaces/button';
import { SimpleButtonComponent } from '@shared-components/simple-button';

interface Field {
  label: string;
  type: string;
  aside?: string;
  name?: string;
}

@Component({
  selector: 'app-simple-form',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    SimpleButtonComponent,
    FormsModule
  ],
  templateUrl: './simple-form.component.html',
  styleUrl: './simple-form.component.scss'
})
export class SimpleFormComponent implements AfterContentInit {
  @Input() fields!: Field[];
  @Input() buttons!: Button[];
  @Output() formSubmit = new EventEmitter<any>();
  @ViewChild('formContainer', {static: true}) container!: ElementRef<HTMLElement>;
  @ContentChild('additionalContent')
  additionalContent?: ElementRef<HTMLElement>;

  formData: { [key: string]: string } = {};

  constructor(private renderer: Renderer2) {}

  ngAfterContentInit(): void {
    if(this.additionalContent) {
      this.renderer.appendChild(
        this.container.nativeElement,
        this.additionalContent.nativeElement
      );
    }
    // Initialize form data
    this.fields.forEach(field => {
      this.formData[field.name || field.label.toLowerCase()] = '';
    });
  }

  onSubmit(event: Event): void {
    event.preventDefault();
    this.formSubmit.emit(this.formData);
  }

  onButtonClick(button: Button): void {
    if (button.elementType === 'submit') {
      this.formSubmit.emit(this.formData);
    }
  }
}
