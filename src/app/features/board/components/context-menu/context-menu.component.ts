import { AfterViewInit, Component, ElementRef, Input, OnInit, QueryList, Renderer2, ViewChildren } from '@angular/core';
import { NodeService } from '../../services/node/node.service';
import { BoardService } from '../../../../shared/services/board/board.service';
import { AuthService } from '@core-services/auth/auth.service';

@Component({
  selector: 'context-menu-component',
  standalone: true,
  imports: [],
  templateUrl: './context-menu.component.html',
  styleUrl: './context-menu.component.scss'
})
export class ContextMenuComponent{
  @Input() show: boolean = false;
  @Input() target!: Element;


  constructor(
    public nodeService: NodeService,
    private boardService: BoardService,
    private renderer: Renderer2,
    private authService: AuthService
  ) {

  }

  newNode(type: string) {
    const x = this.boardService.contextMenu.x
    const y = this.boardService.contextMenu.y
    const user = this.authService.getCurrentUser();
    const userEmail = user?.email ? user.email : '';
    const userRole = user?.role ? user.role : '';
    this.nodeService.createNode(x, y, type, this.renderer, false, userEmail, userRole);
    this.boardService.contextMenu.show=false;
  }

  deleteNode() {
    if(!this.nodeService.activeNode)return

    this.nodeService.deleteNode(this.nodeService.activeNode,this.renderer,this.nodeService);
    this.boardService.contextMenu.show=false;
  }
}
