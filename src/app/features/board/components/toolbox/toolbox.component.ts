import { AfterViewInit, Component, ElementRef, Renderer2, ViewChild } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { NodeService } from '../../services/node/node.service';
import { CommonModule } from '@angular/common';
import { BoardService } from '../../../../shared/services/board/board.service';
import { MatTooltip, MatTooltipModule } from '@angular/material/tooltip';
import { IconService } from '@shared-services/icon/icon.service';

@Component({
  selector: 'toolbox-component',
  standalone: true,
  imports: [MatIconModule, CommonModule, MatTooltipModule],
  templateUrl: './toolbox.component.html',
  styleUrl: './toolbox.component.scss'
})
export class ToolboxComponent implements AfterViewInit {

  @ViewChild('toolbox',{static: true}) toolboxContainer!: ElementRef;

  constructor(
    public nodeService: NodeService,
    private boardService: BoardService,
    private renderer: Renderer2,
    private iconService: IconService
  ) {

  }

  deactivateNode() {
    this.nodeService.clearActiveNote(this.renderer)
  }

  deactivateConnection() {
    this.nodeService.clearActiveConnection();
  }

  editNode(attribute: string, value: string) {
    if(!this.nodeService.activeNode) return
    this.nodeService.editNode(attribute,this.nodeService.activeNode,this.renderer,value)
  }

  editConnection(value: string) {
    this.nodeService.editConnection(value)
  }

  toggleLabelConnection() {
    this.nodeService.toggleLabelConnection(this.renderer);
  }

  ngAfterViewInit(): void {
    const imageElement = this.toolboxContainer.nativeElement.querySelector('#image');
    if (imageElement) {
      imageElement.addEventListener('dragstart', (event: DragEvent) => {
        if (event.dataTransfer) {
          event.dataTransfer.setData('text', 'image');
        }
      });
    }

    this.renderer.listen(this.toolboxContainer.nativeElement,
      'pointerdown',
      ()=>{
      this.boardService.contextMenu.show = false;

      this.boardService.disablePanzoom()
    });
  }

  onImageUpload(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;
    const file = input.files[0];
    const reader = new FileReader();
    reader.onload = (e: any) => {
      const imageUrl = e.target.result;
      // Place the image node at a default position (center of board or fixed offset)
      this.nodeService.createNodeWithImage(300, 100, imageUrl, this.renderer, false);
    };
    reader.readAsDataURL(file);
    // Reset input so the same file can be uploaded again if needed
    input.value = '';
  }
}
