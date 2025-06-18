import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, ElementRef, HostListener, OnDestroy, OnInit, Renderer2, ViewChild, NgZone } from '@angular/core';
import { ActivatedRoute, RouterModule, RouterOutlet } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { HttpClient } from '@angular/common/http';
import { NodeComponent } from '../../components/node/node.component';
import { ContextMenuComponent } from '../../components/context-menu/context-menu.component';
import { ToolboxComponent } from '../../components/toolbox/toolbox.component';
import { ControlpanComponent } from '../../components/controlpan/controlpan.component';
import { NodeService } from '../../services/node/node.service';
import { BoardService } from '@shared-services/board/board.service';
import { BoardDataService } from '@shared-services/board-data/board-data.service';
import { CookiesService } from '@core-services/cookies/cookies.service';
import { Subject, debounceTime, fromEvent, takeUntil } from 'rxjs';
import { ImageUploadModalComponent } from '../../components/image-upload-modal/image-upload-modal.component';
import { UserService } from '@core-services/user/user.service';
import { AuthService } from '@core-services/auth/auth.service';
import { MatDialog } from '@angular/material/dialog';
import { BoardNavbarComponent } from '../../components/board-navbar/board-navbar.component';
import { Connection } from '@jsplumb/browser-ui';
import { Board } from '../../../../core/models/interfaces/board';

@Component({
  selector: 'app-board',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatIconModule,
    NodeComponent,
    ContextMenuComponent,
    ToolboxComponent,
    ControlpanComponent,
    ImageUploadModalComponent,
    BoardNavbarComponent
  ],
  templateUrl: './board.component.html',
  styleUrl: './board.component.scss'
})
export class BoardComponent implements AfterViewInit, OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private autoSaveDebouncer$ = new Subject<void>();

  @ViewChild('main', {static: true}) container!: ElementRef<HTMLElement>;
  @ViewChild('toolbox', {static: true}) toolbox!: ElementRef<HTMLElement>;
  @ViewChild('board', {static: true}) boardContainer!: ElementRef<HTMLElement>;

  @HostListener('window:mousemove',['$event'])
    onMouseMove(event: MouseEvent) {
      if(event.button != 0) return
      if(!this.boardService.draggable) this.nodeService.resizeElement(event, this.renderer)
    }

  @HostListener('dragstart',['$event'])
    onDragStart(event: DragEvent) {
      if(event.target instanceof Element && event.dataTransfer) {
        event.dataTransfer.setData('text',event.target.id);
        event.dataTransfer.effectAllowed = 'move';
      }
    }

  @HostListener('window:mouseup',['$event'])
    onMouseUp(event: MouseEvent) {
      if(!this.boardService.draggable) this.boardService.draggable=true;
    }

  @HostListener('window:mousedown',['$event'])
    onMouseDown(event: MouseEvent) {
      if(!(event.target instanceof Element)) return
      if(event.button != 2 && !event.target.classList.contains('contextMenu')) this.boardService.contextMenu.show = false;

    }

  @HostListener('window:keydown',['$event'])
    onKeyDown(event: KeyboardEvent) {
      if(this.isAccepted) return;
      if(event.key === 'Delete' && this.nodeService.activeNode) {
        // Restrict viewers: only allow deleting their own nodes
        if (this.isViewer) {
          const node = this.nodeService.activeNode as HTMLElement;
          console.log('[DEBUG] Delete check:', node.dataset['createdByUserId'], this.currentUserEmail);
          if (node.dataset['createdByUserId'] !== this.currentUserEmail) return;
        }
        const activeNode = this.nodeService.activeNode
        this.nodeService.deleteNode(activeNode,this.renderer,this.nodeService)
      }
    }

  @HostListener('window:unload', ['$event'])
    unloadHandler(event: Event) {
        this.PostCall();
    }

  @HostListener('window:beforeunload', ['$event'])
    beforeUnloadHander(event: Event) {
        this.boardData.saveData().then(()=>{
          return true;
        }).catch(()=>{
          return false;
        })
    }

  PostCall() {
        console.log('PostCall');
    }


  editNode(attribute: string, value: string) {
    if(this.isAccepted) return;
    if(!this.nodeService.activeNode) return;
    // Restrict viewers: only allow editing their own nodes
    if (this.isViewer) {
      const node = this.nodeService.activeNode as HTMLElement;
      console.log('[DEBUG] Edit check:', node.dataset['createdByUserId'], this.currentUserEmail);
      if (node.dataset['createdByUserId'] !== this.currentUserEmail) return;
    }
    this.nodeService.editNode(attribute,this.nodeService.activeNode,this.renderer,value);
  }

  disactivateNode() {
    this.nodeService.clearActiveNote(this.renderer)
  }

  initEvents() {
    this.ngZone.runOutsideAngular(() => {
      this.renderer.listen(document, 'pointerup', this.boardService.pointerUp);

      this.renderer.listen(this.boardContainer.nativeElement,
        'pointerdown',
        (event: PointerEvent) => {
          this.ngZone.run(() => {
            if(event.button != 2) this.boardService.contextMenu.show = false;
            this.boardService.contextMenu.show = false;
            this.boardService.pointerDown(event, this.nodeService, this.renderer, this.boardContainer.nativeElement);
          });
      });

      this.renderer.listen(this.boardContainer.nativeElement,
        'pointerup',
        (event: PointerEvent) => {
          this.ngZone.run(() => {
            this.boardService.pointerUpBoard(event, this.nodeService, this.renderer);
          });
      });

      this.renderer.listen(this.boardContainer.nativeElement, 'wheel', this.boardService.zoom);

      this.renderer.listen(this.boardContainer.nativeElement,
        'dragover',
        (event: DragEvent) => {
          this.ngZone.run(() => {
            this.boardService.droppable = true;
            this.boardService.dragOverBoard(event);
          });
      });

      this.renderer.listen(window, 'keydown', (event: KeyboardEvent) => {
        this.ngZone.run(() => {
          this.boardService.keydown(event);
          if(event.code === "Space") this.boardContainer.nativeElement.style.cursor = 'grab';
        });
      });

      this.renderer.listen(window, 'keyup', (event: KeyboardEvent) => {
        this.ngZone.run(() => {
          this.boardService.keyup(event);
          if(event.code === "Space") this.boardContainer.nativeElement.style.cursor = '';
        });
      });

      this.renderer.listen(this.boardContainer.nativeElement, 'contextmenu', (event: MouseEvent) => {
        this.ngZone.run(() => {
          event.preventDefault();
          this.boardService.contextMenu.show = true;
          this.boardService.contextMenu.x = event.clientX;
          this.boardService.contextMenu.y = event.clientY;
        });
      });
    });
  }

  isViewer: boolean = false;
  isAccepted: boolean = false;
  currentUserEmail: string | null = null;
  showDoneDialog: boolean = false;

  constructor(
    public renderer: Renderer2,
    private activeRoute: ActivatedRoute,
    public nodeService: NodeService,
    public boardService: BoardService,
    public boardData: BoardDataService,
    private cookiesService: CookiesService,
    private ngZone: NgZone,
    private authService: AuthService,
    private userService: UserService,
    private dialog: MatDialog
  ) {
    boardService.appRenderer = renderer;

    // Setup auto-save with debounce
    this.autoSaveDebouncer$
      .pipe(
        debounceTime(2000), // Wait 2 seconds after last change
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.ngZone.run(() => {
          this.boardData.saveData();
        });
      });
  }

  ngOnInit(): void {
    // Clear any existing state
    this.nodeService.clearActiveConnection();
    this.nodeService.clearActiveNote(this.renderer);

    // Use NgZone to ensure proper change detection
    this.ngZone.runOutsideAngular(() => {
      // Listen for board changes that should trigger auto-save
      fromEvent(document, 'mouseup')
        .pipe(takeUntil(this.destroy$))
        .subscribe(() => {
          this.ngZone.run(() => this.triggerAutoSave());
        });

      // Listen for board changes that should trigger auto-save
      fromEvent(document, 'keyup')
        .pipe(takeUntil(this.destroy$))
        .subscribe(() => {
          this.ngZone.run(() => this.triggerAutoSave());
        });
    });

    // Add window unload handler
    window.addEventListener('beforeunload', this.beforeUnloadHander.bind(this));

    const user = this.authService.getCurrentUser();
    this.isViewer = user?.role === 'VIEWER';
    this.currentUserEmail = user?.email ? user.email : '';
    this.isAccepted = !!this.boardData.getActiveBoard()?.accepted;
    
    // If board is accepted, apply restrictions immediately
    if (this.isAccepted) {
      console.log('[DEBUG] Board is accepted, applying restrictions on init');
      // Add accepted class to main container
      const mainContainer = document.querySelector('#main');
      if (mainContainer) {
        this.renderer.addClass(mainContainer, 'accepted');
      }
      
      // Disable all interactions
      this.boardService.disablePanzoom();
      this.nodeService.clearActiveConnection();
      this.nodeService.clearActiveNote(this.renderer);
      
      // Disable all nodes
      const nodes = document.querySelectorAll('.nodeContainer');
      nodes.forEach(node => {
        if (node instanceof HTMLElement) {
          // Add no-interact class to disable all interactions
          this.renderer.addClass(node, 'no-interact');
          
          // Disable text editing
          const textarea = node.querySelector('.desc');
          if (textarea instanceof HTMLElement) {
            this.renderer.setAttribute(textarea, 'readonly', '');
            this.renderer.setAttribute(textarea, 'disabled', '');
            this.renderer.addClass(textarea, 'no-interact');
          }
          
          // Hide resize and link buttons
          const resizeButton = node.querySelector('.resizeButton');
          const linkButton = node.querySelector('.linkActionButton');
          if (resizeButton) this.renderer.addClass(resizeButton, 'hidden');
          if (linkButton) this.renderer.addClass(linkButton, 'hidden');
          
          // Disable dragging by adding no-drag class
          this.renderer.addClass(node, 'no-drag');
        }
      });
      
      // Disable all connections by adding no-interact class
      const connections = document.querySelectorAll('.jtk-connector');
      connections.forEach(conn => {
        if (conn instanceof HTMLElement) {
          this.renderer.addClass(conn, 'no-interact');
        }
      });
      
      // Disable all endpoints
      const endpoints = document.querySelectorAll('.jtk-endpoint');
      endpoints.forEach(endpoint => {
        if (endpoint instanceof HTMLElement) {
          this.renderer.addClass(endpoint, 'no-interact');
        }
      });
    }
    
    // Pass to BoardService for connection restrictions
    this.boardService.currentUserEmail = this.currentUserEmail;
    this.boardService.isViewer = this.isViewer;

    this.boardData.initializeBoards();
  }

  async ngAfterViewInit() {
    console.log('[DEBUG] ngAfterViewInit called. isViewer:', this.isViewer);
    // Use NgZone to ensure proper initialization
    this.ngZone.runOutsideAngular(async () => {
      try {
        // Wait for container to be available
        if (!this.container?.nativeElement) {
          console.error('Container not initialized');
          return;
        }

        // Set container in NodeService
        this.nodeService.setContainer(this.container.nativeElement);

        // Initialize board service
        await this.boardService.init(this.container, this.nodeService, this.boardData, this.renderer);
        this.boardData.renderer = this.renderer;
        
        // Load board data
        await this.boardData.checkData(this.renderer);
        
        // Initialize events
        this.initEvents();
        
        // Initialize panzoom
        this.boardService.disablePanzoom();
        this.boardService.enablePanzoom();

        // Force a redraw of connections
        setTimeout(() => {
          if (this.boardService.instance) {
            this.boardService.instance.repaintEverything();
          }
        }, 100);
      } catch (error) {
        console.error('Error initializing board:', error);
      }
    });
  }

  ngOnDestroy() {
    // Remove window unload handler
    window.removeEventListener('beforeunload', this.beforeUnloadHander.bind(this));

    // Save data before destroying
    this.boardData.saveData().then(() => {
      // Clean up board service
      if (this.boardService.instance) {
        try {
          this.boardService.instance.reset();
        } catch (error) {
          console.error('Error resetting board instance:', error);
        }
      }
      
      if (this.boardService.panzoom) {
        try {
          this.boardService.panzoom.destroy();
        } catch (error) {
          console.error('Error destroying panzoom:', error);
        }
      }
      
      // Clear active nodes and connections
      this.nodeService.clearActiveConnection();
      this.nodeService.clearActiveNote(this.renderer);
      
      // Clear any remaining event listeners
      this.destroy$.next();
      this.destroy$.complete();
    }).catch(error => {
      console.error('Error during board cleanup:', error);
      // Still try to clean up even if save fails
      this.destroy$.next();
      this.destroy$.complete();
    });
  }

  private triggerAutoSave() {
    if (!this.destroy$.closed) {
      this.autoSaveDebouncer$.next();
    }
  }

  showImageModal = false;
  dropPosition = { x: 0, y: 0 };

  @HostListener('drop', ['$event'])
  onDrop(event: DragEvent) {
    if (this.isAccepted) return;
    event.preventDefault();
    const type = event.dataTransfer?.getData('text');
    if (type === 'image') {
      // Store drop position
      const rect = this.boardContainer.nativeElement.getBoundingClientRect();
      this.dropPosition = {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top
      };
      // Show modal instead of immediate upload
      this.showImageModal = true;
      return;
    }
    // Only for viewers: pass user info to createNode
    if (this.isViewer) {
      const rect = this.boardContainer.nativeElement.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      console.log('[DEBUG] Viewer creating node with', this.currentUserEmail, 'VIEWER');
      const viewerEmail = this.currentUserEmail ? this.currentUserEmail : '';
      const nodeType = typeof type === 'string' ? type : 'note';
      this.nodeService.createNode(x, y, nodeType, this.renderer, false, viewerEmail, 'VIEWER');
      return;
    }
    // For non-viewers: pass current user's email and role
    const rect = this.boardContainer.nativeElement.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const user = this.authService.getCurrentUser();
    const userEmail = user?.email ? user.email : '';
    const userRole = user?.role ? user.role : '';
    const nodeType = typeof type === 'string' ? type : 'note';
    this.nodeService.createNode(x, y, nodeType, this.renderer, false, userEmail, userRole);
  }

  onImageSelected(imageUrl: string) {
    if (!imageUrl) return;
    
    try {
      // Calculate position considering zoom and pan
      const x = this.dropPosition.x;
      const y = this.dropPosition.y;
      
      // Ensure container and board service are initialized
      if (!this.container?.nativeElement) {
        console.error('Container element not found');
        return;
      }

      if (!this.boardService.instance) {
        console.error('Board service not initialized');
        return;
      }

      // Create the image node
      const nodeId = this.nodeService.createNodeWithImage(
        x,
        y,
        imageUrl,
        this.renderer,
        false
      );

      if (nodeId) {
        console.log('Image node created successfully:', nodeId);
      }

      this.showImageModal = false;
    } catch (error) {
      console.error('Error creating image node:', error);
    }
  }

  closeImageModal() {
    this.showImageModal = false;
  }

  onDoneClick() {
    this.showDoneDialog = true;
  }

  confirmAcceptBoard() {
    // Set board as accepted and save
    if (this.boardData.getActiveBoard()) {
      const activeBoard = this.boardData.getActiveBoard();
      if (
        activeBoard &&
        typeof activeBoard.id === 'string' &&
        activeBoard.dateCreated &&
        Array.isArray(activeBoard.connetions) &&
        typeof activeBoard.name === 'string' &&
        Array.isArray(activeBoard.elements) &&
        Array.isArray(activeBoard.groups) &&
        typeof activeBoard.zoomScale === 'number'
      ) {
        const updatedBoard: Board = {
          id: activeBoard.id,
          projectId: activeBoard.projectId,
          dateCreated: activeBoard.dateCreated,
          connetions: activeBoard.connetions,
          name: activeBoard.name,
          elements: activeBoard.elements,
          groups: activeBoard.groups,
          zoomScale: activeBoard.zoomScale,
          tag: activeBoard.tag,
          favorite: activeBoard.favorite,
          accepted: true,
          acceptedBy: this.currentUserEmail || undefined,
        };
        this.boardData.updateBoard(updatedBoard);
        this.isAccepted = true;
        this.showDoneDialog = false;
        
        // Force disable all interactions
        this.ngZone.run(() => {
          // Add accepted class to main container
          const mainContainer = document.querySelector('#main');
          if (mainContainer) {
            this.renderer.addClass(mainContainer, 'accepted');
          }
          
          // Disable panzoom completely
          this.boardService.disablePanzoom();
          this.boardService.panzoom.destroy();
          
          // Clear any active states
          this.nodeService.clearActiveConnection();
          this.nodeService.clearActiveNote(this.renderer);
          
          // Disable all nodes
          const nodes = document.querySelectorAll('.nodeContainer');
          nodes.forEach(node => {
            if (node instanceof HTMLElement) {
              // Add no-interact class to disable all interactions
              this.renderer.addClass(node, 'no-interact');
              
              // Disable text editing
              const textarea = node.querySelector('.desc');
              if (textarea instanceof HTMLElement) {
                this.renderer.setAttribute(textarea, 'readonly', '');
                this.renderer.setAttribute(textarea, 'disabled', '');
                this.renderer.addClass(textarea, 'no-interact');
                this.renderer.setStyle(textarea, 'pointer-events', 'none');
              }
              
              // Hide resize and link buttons
              const resizeButton = node.querySelector('.resizeButton');
              const linkButton = node.querySelector('.linkActionButton');
              if (resizeButton instanceof HTMLElement) {
                this.renderer.addClass(resizeButton, 'hidden');
                this.renderer.setStyle(resizeButton, 'display', 'none');
              }
              if (linkButton instanceof HTMLElement) {
                this.renderer.addClass(linkButton, 'hidden');
                this.renderer.setStyle(linkButton, 'display', 'none');
              }
              
              // Disable dragging by adding no-drag class
              this.renderer.addClass(node, 'no-drag');
              this.renderer.setStyle(node, 'pointer-events', 'none');
            }
          });
          
          // Disable all connections
          const connections = document.querySelectorAll('.jtk-connector');
          connections.forEach(conn => {
            if (conn instanceof HTMLElement) {
              this.renderer.addClass(conn, 'no-interact');
              this.renderer.setStyle(conn, 'pointer-events', 'none');
            }
          });
          
          // Disable all endpoints
          const endpoints = document.querySelectorAll('.jtk-endpoint');
          endpoints.forEach(endpoint => {
            if (endpoint instanceof HTMLElement) {
              this.renderer.addClass(endpoint, 'no-interact');
              this.renderer.setStyle(endpoint, 'pointer-events', 'none');
            }
          });
          
          // Disable jsPlumb instance
          if (this.boardService.instance) {
            // Disable all interactions at the DOM level
            const container = this.boardService.instance.getContainer();
            if (container instanceof HTMLElement) {
              // Add no-interact class to container
              this.renderer.addClass(container, 'no-interact');
              this.renderer.setStyle(container, 'pointer-events', 'none');
              
              // Disable all interactive elements within the container
              const interactiveElements = container.querySelectorAll('*');
              interactiveElements.forEach(element => {
                if (element instanceof HTMLElement) {
                  this.renderer.addClass(element, 'no-interact');
                  this.renderer.setStyle(element, 'pointer-events', 'none');
                }
              });
            }
          }
          
          // Force a redraw
          setTimeout(() => {
            if (this.boardService.instance) {
              this.boardService.instance.repaintEverything();
            }
          }, 100);
        });
      }
    }
  }

  // Helper method to check if board is read-only
  isBoardReadOnly(): boolean {
    return this.isAccepted;
  }

  cancelAcceptBoard() {
    this.showDoneDialog = false;
  }

  acceptBoard() {
    const activeBoard = this.boardData.getActiveBoard();
    if (
      activeBoard &&
      typeof activeBoard.id === 'string' &&
      activeBoard.dateCreated &&
      Array.isArray(activeBoard.connetions) &&
      typeof activeBoard.name === 'string' &&
      Array.isArray(activeBoard.elements) &&
      Array.isArray(activeBoard.groups) &&
      typeof activeBoard.zoomScale === 'number'
    ) {
      const updatedBoard: Board = {
        id: activeBoard.id,
        projectId: activeBoard.projectId,
        dateCreated: activeBoard.dateCreated,
        connetions: activeBoard.connetions,
        name: activeBoard.name,
        elements: activeBoard.elements,
        groups: activeBoard.groups,
        zoomScale: activeBoard.zoomScale,
        tag: activeBoard.tag,
        favorite: activeBoard.favorite,
        accepted: true,
        acceptedBy: this.currentUserEmail || undefined,
      };
      this.boardData.updateBoard(updatedBoard);
      this.isAccepted = true;
    }
  }
}
