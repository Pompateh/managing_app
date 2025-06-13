import { AfterViewInit, Component, Input, OnInit, OnChanges, SimpleChanges, ChangeDetectorRef } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { IconService } from '@shared-services/icon/icon.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'node-component',
  standalone: true,
  imports: [MatIconModule, CommonModule],
  templateUrl: './node.component.html',
  styleUrl: './node.component.scss'
})
export class NodeComponent implements OnInit, OnChanges {
  @Input() isViewer: boolean = false;
  @Input() currentUserEmail: string = '';
  @Input() createdByUserId: string = '';
  @Input() isAccepted: boolean = false;
  @Input() imageSrc: string = '';
  @Input() innerTextarea: string = '';
  imageFit: 'cover' | 'contain' | 'auto' = 'cover';

  constructor(iconService: IconService, private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    console.log('NodeComponent imageSrc:', this.imageSrc);
    console.log('[DEBUG] NodeComponent: isViewer', this.isViewer, 'currentUserEmail', this.currentUserEmail, 'createdByUserId', this.createdByUserId);
    setTimeout(() => {
      const textarea = document.querySelector(`textarea.desc.nodeElement`);
      if (textarea) {
        console.log('[DEBUG] NodeComponent textarea attributes:', {
          classList: textarea.classList.value,
          readonly: textarea.getAttribute('readonly'),
          disabled: textarea.getAttribute('disabled'),
          tabindex: textarea.getAttribute('tabindex'),
        });
      }
    }, 0);
    this.cdr.markForCheck();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['imageSrc']) {
      this.cdr.markForCheck();
    }
    if (changes['isViewer'] || changes['currentUserEmail'] || changes['createdByUserId']) {
      console.log('[DEBUG] NodeComponent ngOnChanges: isViewer', this.isViewer, 'currentUserEmail', this.currentUserEmail, 'createdByUserId', this.createdByUserId);
      setTimeout(() => {
        const textarea = document.querySelector(`textarea.desc.nodeElement`);
        if (textarea) {
          console.log('[DEBUG] NodeComponent textarea attributes (ngOnChanges):', {
            classList: textarea.classList.value,
            readonly: textarea.getAttribute('readonly'),
            disabled: textarea.getAttribute('disabled'),
            tabindex: textarea.getAttribute('tabindex'),
          });
        }
      }, 0);
    }
  }

  setImageFit(fit: 'cover' | 'contain' | 'auto') {
    this.imageFit = fit;
  }

  get isLockedForViewer(): boolean {
    return this.isViewer && this.currentUserEmail !== this.createdByUserId;
  }

  onTextareaFocus(event: FocusEvent) {
    if (this.isLockedForViewer) {
      (event.target as HTMLTextAreaElement).blur();
    }
  }
}
