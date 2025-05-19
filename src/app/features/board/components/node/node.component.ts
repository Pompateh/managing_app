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
  @Input() innerTextarea: string| null = null;
  @Input() imageSrc: string | null = null;
  imageFit: 'cover' | 'contain' | 'auto' = 'cover';

  constructor(iconService: IconService, private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    console.log('NodeComponent imageSrc:', this.imageSrc);
    this.cdr.markForCheck();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['imageSrc']) {
      this.cdr.markForCheck();
    }
  }

  setImageFit(fit: 'cover' | 'contain' | 'auto') {
    this.imageFit = fit;
  }
}
