import { Injectable, OnInit, Renderer2 } from '@angular/core';
import { Board } from '../../../core/models/interfaces/board';
import { BoardService } from '../board/board.service';
import { ActivatedRoute, Router } from '@angular/router';
import { Connection, Overlay, OverlaySpec, UINode, uuid } from '@jsplumb/browser-ui';
import { NodeService } from '../../../features/board/services/node/node.service';
import { CookieService } from 'ngx-cookie-service';
import { CookiesService } from '@core-services/cookies/cookies.service';
import kanban from '@core-board-templates/kanban';
import sprintRetrospective from '@core-board-templates/sprint-retrospective';
import { TemplateBoard } from '../../../core/models/types/template-board';
import sprintRetro2 from '@core-board-templates/sprint-retrospective2';
import sprintRetro from '@core-board-templates/sprint-retrospective';
import useCase from '@core-board-templates/usecase';
import Dexie from 'dexie';
import { db } from '../../../../../db';
import { SavedConnection } from '@custom-interfaces/saved-connection';
import { SavedNode } from '@custom-interfaces/saved-node';
import { Tag } from '@custom-interfaces/tag';
import { AuthService } from '@core-services/auth/auth.service';

@Injectable({
  providedIn: 'root'
})
export class BoardDataService implements OnInit{

  _boards: Board[] = [];
  activeId!: string;
  activeBoard!: Board;
  renderer!: Renderer2;


  public get boards() : Board[] {
    return this._boards;
}

  public set boards(v : Board[]) {
    this._boards = v;
  }

  constructor(
    protected boardService: BoardService,
    protected activatedRoute: ActivatedRoute,
    protected nodeService: NodeService,
    private router: Router,
    private cookieService: CookieService,
    private cookiesService: CookiesService,
    private authService: AuthService
  ) {
    // Initialize boards array
    this._boards = [];
    
    // Initialize BoardService with this instance
    this.boardService.setBoardData(this);
    
    // Subscribe to route changes
    this.activatedRoute.queryParamMap.subscribe((p) => {
      const newId = p.get("id") ?? '';
      if (newId !== this.activeId) {
        this.activeId = newId;
        const selectedBoard = this.boards.find(e => e.id === this.activeId);
        if (selectedBoard) {
          this.activeBoard = selectedBoard;
        }
      }
    });

    // Load boards with error handling
    this.loadBoards().catch(error => {
      console.error('Error loading boards:', error);
    });
  }

  async deleteAll() {
    db.boards.clear();
  }

  async loadBoards() {
    try {
      const boards = await this.getBoards();
      this.boards = boards;
      
      // Get board ID from route params
      const id = this.activatedRoute.snapshot.queryParamMap.get('id');
      const projectId = history.state?.projectId;
      
      if (id) {
        // Try to find the board with the given ID
        const selectedBoard = projectId 
          ? this.getBoard(id, projectId)
          : this.getBoard(id);
          
        if (selectedBoard) {
          this.activeBoard = selectedBoard;
          this.activeId = id;
        } else {
          // If board not found and user is viewer, redirect to their project details
          const user = this.authService.getCurrentUser();
          if (user?.role === 'VIEWER' && user.assignedProjectId) {
            this.router.navigate(['/projects', user.assignedProjectId]);
            return;
          }
        }
      } else {
        // If no board ID and user is viewer, redirect to their project details
        const user = this.authService.getCurrentUser();
        if (user?.role === 'VIEWER' && user.assignedProjectId) {
          this.router.navigate(['/projects', user.assignedProjectId]);
          return;
        }
      }
      
      if (this.renderer) {
        this.checkData(this.renderer);
      }
    } catch (error) {
      console.error('Error in loadBoards:', error);
      throw error;
    }
  }

  async getBoards():Promise<Board[]> {
    const boards = await db.boards.toArray();
    return boards;
  }

  getBoard(id: string, projectId?: string) {
    if (projectId) {
      return this.boards.find(e => e.id === id && e.projectId === projectId);
    }
    return this.boards.find(e => e.id === id);
  }

  getBoardsByProject(projectId: string): Board[] {
    return this.boards.filter(board => board.projectId === projectId);
  }

  async checkData(renderer: Renderer2) {
    console.log('[DEBUG] checkData called');
    if(!this.cookiesService.accepted) return;
    const id = this.activatedRoute.snapshot.queryParamMap.get('id') ?? '';
    const activeBoard: Board | undefined = this.getData(id);

    if(activeBoard) {
      // Set the active board
      this.activeBoard = activeBoard;
      
      // If board is accepted, apply restrictions immediately
      if (activeBoard.accepted) {
        console.log('[DEBUG] Board is accepted, applying restrictions');
        // Add accepted class to main container
        const mainContainer = document.querySelector('#main');
        if (mainContainer) {
          renderer.addClass(mainContainer, 'accepted');
        }
        
        // Disable all interactions
        this.boardService.disablePanzoom();
        this.nodeService.clearActiveConnection();
        this.nodeService.clearActiveNote(renderer);
        
        // Disable all nodes
        const nodes = document.querySelectorAll('.nodeContainer');
        nodes.forEach(node => {
          if (node instanceof HTMLElement) {
            // Add no-interact class to disable all interactions
            renderer.addClass(node, 'no-interact');
            
            // Disable text editing
            const textarea = node.querySelector('.desc');
            if (textarea instanceof HTMLElement) {
              renderer.setAttribute(textarea, 'readonly', '');
              renderer.setAttribute(textarea, 'disabled', '');
              renderer.addClass(textarea, 'no-interact');
            }
            
            // Hide resize and link buttons
            const resizeButton = node.querySelector('.resizeButton');
            const linkButton = node.querySelector('.linkActionButton');
            if (resizeButton) renderer.addClass(resizeButton, 'hidden');
            if (linkButton) renderer.addClass(linkButton, 'hidden');
            
            // Disable dragging by adding no-drag class
            renderer.addClass(node, 'no-drag');
          }
        });
        
        // Disable all connections by adding no-interact class
        const connections = document.querySelectorAll('.jtk-connector');
        connections.forEach(conn => {
          if (conn instanceof HTMLElement) {
            renderer.addClass(conn, 'no-interact');
          }
        });
        
        // Disable all endpoints
        const endpoints = document.querySelectorAll('.jtk-endpoint');
        endpoints.forEach(endpoint => {
          if (endpoint instanceof HTMLElement) {
            renderer.addClass(endpoint, 'no-interact');
          }
        });
      }

      // Restore zoom and pan first
      const scale = activeBoard.zoomScale;
      this.boardService.zoomScale = scale;
      this.boardService.panzoom.zoom(scale);
      this.boardService.instance.setZoom(scale);
      this.boardService.translation = this.boardService.panzoom.getPan();

      // Restore nodes (positions/sizes are set directly)
      if(activeBoard.elements) {
        const nodePromises = activeBoard.elements.map(async (e: SavedNode) => {
          const x = e.x;
          const y = e.y;
          const width = e.width ?? undefined;
          const height = e.height ?? undefined;
          const color = e.color;
          const innerText = e.innerText ?? '';
          const type = e.type;
          const nodeId = e.id;

          if (e.imageSrc) {
            return this.nodeService.createNodeWithImage(
              x,
              y,
              e.imageSrc,
              renderer,
              false,
              width,
              height,
              nodeId,
              e.createdByUserId,
              e.createdByRole
            );
          } else {
            return this.nodeService.loadNode(
              x,
              y,
              width === undefined ? null : width,
              height === undefined ? null : height,
              color,
              innerText,
              type,
              renderer,
              nodeId,
              e.createdByUserId,
              e.createdByRole
            );
          }
        });
        await Promise.all(nodePromises);
      }

      // Restore connections
      if(activeBoard.connetions) {
        activeBoard.connetions.forEach(c => {
          const sourceEl = this.boardService.instance.getManagedElement(c.sourceId);
          const targetEl = this.boardService.instance.getManagedElement(c.targetId);

          let source;
          try {
            source = this.boardService.instance.getGroup(c.sourceId)?.el;
          } catch (error) {
            source = sourceEl;
          }

          let target;
          try {
            target = this.boardService.instance.getGroup(c.targetId)?.el;
          } catch (error) {
            target = targetEl;
          }

          if (source && target) {
            this.boardService.instance.connect({
              source,
              target,
              anchor: c.anchor,
              connector: c.connector,
              paintStyle: c.paintStyle,
              hoverPaintStyle: c.hoverPaintStyle,
              endpointStyle: c.endpointStyle,
              overlays: c.overlays.map(overlay => ({
                type: 'Custom',
                options: {
                  create: () => {
                    const label: HTMLInputElement = renderer.createElement('input');
                    label.value = overlay.label.inputValue;
                    renderer.setAttribute(label, 'class', 'labelConnection');
                    renderer.setAttribute(label, 'type', 'text');
                    return label;
                  },
                  location: 0.5,
                }
              }))
            });
          }
        });
        this.boardService.instance.repaintEverything();
      }

      // Restore groups after nodes
      if(activeBoard.groups) {
        activeBoard.groups.forEach(e => {
          const group = this.boardService.instance.getGroup(e.groupId ?? '');
          if (group) {
            const children = e.children.map((child) => {
              return this.boardService.instance.getManagedElement(child.id ?? '');
            }).filter(Boolean);

            children.forEach((c: HTMLElement) => {
              if(group.el instanceof HTMLElement) {
                const top = Number(c.style.top.replace(/[a-z]/g, '')) + Number(group.el.style.top.replace(/[a-z]/g, ''));
                const left = Number(c.style.left.replace(/[a-z]/g, '')) + Number(group.el.style.left.replace(/[a-z]/g, ''));
                renderer.setStyle(c, 'top', `${top}px`);
                renderer.setStyle(c, 'left', `${left}px`);
              }
              this.boardService.instance.addToGroup(group, c);
            });
          }
        });
      }
    }
  }

  createBoard(board?: Board, clearNotes?: boolean, projectId?: string): string {
    const id = uuid();

    if(board) {
      const newBoard = {
        id,
        projectId: projectId ?? board.projectId,
        dateCreated: board.dateCreated,
        name: board.name,
        connetions: board.connetions,
        elements: board.elements,
        groups: board.groups,
        zoomScale: 1,
        favorite: board.favorite,
        tag: board.tag,
      };
      
      this.boards.push(newBoard);
      db.boards.add(newBoard);
    } else {
      const newBoard = {
        id,
        projectId,
        dateCreated: new Date(),
        name: `Untitled board`,
        connetions: [],
        elements: [],
        groups: [],
        zoomScale: 1,
      };
      
      this.boards.push(newBoard);
      db.boards.add(newBoard);
    }

    if(clearNotes && this.boardService && this.boardService.instance) {
      try {
        this.nodeService.clearAll();
      } catch (error) {
        console.error('Error clearing notes:', error);
      }
    }

    return id;
  }

  createBoardFromTemplate(
    template:
    "sprint-retro" |
    "kanban" |
    "useCase" |
    "sprint-retro2"
  ) {

    let templateBoard: TemplateBoard = kanban;

    switch (template) {
      case "sprint-retro":
        templateBoard = sprintRetro;
        break;

      case "sprint-retro2":
        templateBoard = sprintRetro2;
        break;

      case "useCase":
        templateBoard = useCase;
        break;

      case "kanban":
        templateBoard = kanban;
        break;
      default:

        break;
    }

    const id = uuid();
    this.boards.push({
      id,
      dateCreated: new Date(),
      name: templateBoard.name,
      connetions: templateBoard.connetions,
      elements: templateBoard.elements,
      groups: templateBoard.groups,
      zoomScale: templateBoard.zoomScale,
    })

    this.router.navigate(['/board'], {
      queryParams: {
        id,
      }
    })

  }

  isCookiesAccepted(): boolean {
    return this.cookiesService.accepted;
  }

  async checkAndAcceptCookies(): Promise<boolean> {
    if (!this.cookiesService.accepted) {
      try {
        this.cookiesService.accepted = true;
        // Wait a moment for the cookie to be set
        await new Promise(resolve => setTimeout(resolve, 100));
        return true;
      } catch (error) {
        console.error('Error accepting cookies:', error);
        return false;
      }
    }
    return true;
  }

  async saveData() {
    // Check if cookies are accepted
    if (!this.cookiesService.accepted) {
      const cookiesAccepted = await this.checkAndAcceptCookies();
      if (!cookiesAccepted) {
        return false;
      }
    }

    try {
      const id = this.activatedRoute.snapshot.queryParamMap.get('id');
      const projectId = history.state?.projectId;
      
      if (!id) {
        console.warn('No board ID found for saving');
        return false;
      }
      
      let board = projectId 
        ? this.getBoard(id, projectId)
        : this.getBoard(id);
        
      if (!board) {
        console.warn('No board found with ID:', id);
        return false;
      }

      // Create a new board object to prevent reference issues
      const boardToSave = {
        ...board,
        projectId: board.projectId, // Ensure projectId is preserved
        elements: [],
        groups: [],
        connetions: []
      };

      // Save current state
      this.saveConnections(boardToSave);
      this.saveNodes(boardToSave);
      boardToSave.zoomScale = this.boardService.panzoom.getScale();

      // Update or add to database
      try {
        const boardInDb = await db.boards.get(boardToSave.id);
        if (boardInDb) {
          await db.boards.update(boardToSave.id, {
            name: boardToSave.name,
            projectId: boardToSave.projectId,
            connetions: boardToSave.connetions,
            elements: boardToSave.elements,
            groups: boardToSave.groups,
            zoomScale: boardToSave.zoomScale,
            dateCreated: boardToSave.dateCreated
          });
        } else {
          await db.boards.add(boardToSave);
        }

        // Update local state
        const index = this.boards.findIndex(b => b.id === boardToSave.id);
        if (index !== -1) {
          this.boards[index] = boardToSave;
        }

        console.log('Board saved successfully:', boardToSave.id);
        return true;
      } catch (dbError) {
        console.error('Database error while saving board:', dbError);
        return false;
      }
    } catch (error) {
      console.error('Error saving board data:', error);
      return false;
    }
  }

  saveConnections(board: Board) {
    if (!this.boardService.instance) return;
    try {
      const connections = this.boardService.instance.getConnections({
        scope: '*',
      });

      if (connections instanceof Array) {
        connections.forEach((connection: Connection) => {
          type CustomOverlay2<T> = Partial<T> & {
            canvas?: HTMLInputElement
          };

          const paintStyle = connection.paintStyle;
          const hoverPaintStyle = connection.hoverPaintStyle;
          const endpointStyle = connection.endpointStyle;
          const sourceId = connection.sourceId;
          const targetId = connection.targetId;
          let overlays: {
            label: {
              inputValue: string,
            }
          }[] = [];

          for (const key in connection.overlays) {
            const overlay: CustomOverlay2<Overlay> = connection.overlays[key];
            const inputValue = overlay.canvas?.value ?? '';
            overlays.push({
              label: {
                inputValue,
              }
            });
          }

          board.connetions.push({
            anchor: "Continuous",
            connector: "Bezier",
            sourceId,
            targetId,
            paintStyle,
            hoverPaintStyle,
            endpointStyle,
            overlays
          });
        });
      }
    } catch (error) {
      throw error;
    }
  }

  saveNodes(board: Board) {
    if (!this.boardService.instance) return;
    try {
      const elements = this.boardService.instance.getManagedElements();
      for (const key in elements) {
        const element = elements[key].el;
        if (element instanceof HTMLElement) {
          try {
            const groupElement = elements[key].el._jsPlumbGroup;
            const groupId = groupElement.elId;
            const children: { id: string | null }[] = [];

            groupElement.children.forEach((subElement: UINode<Element>) => {
              const childId = subElement.el.getAttribute('data-jtk-managed');
              children.push({
                id: childId,
              });
            });

            board.groups.push({
              groupId,
              children
            });
          } catch (error) {
            // Ignore group errors as not all elements are groups
          }

          const x = Number(element.style.left.replace(/[a-z]/g, ''));
          const y = Number(element.style.top.replace(/[a-z]/g, ''));
          const width = Number(element.style.width.replace(/[a-z]/g, ''));
          const height = Number(element.style.height.replace(/[a-z]/g, ''));
          const color = element.style.backgroundColor;
          const innerText = element.querySelector('textarea')?.value ?? null;
          const type = element.classList.contains('nodeGroup') ? 'group' : 'node';
          const id = this.boardService.instance.getId(element);

          // Check for image node
          let imageSrc: string | null = null;
          if (element.classList.contains('imageNode')) {
            const img = element.querySelector('img');
            imageSrc = img ? img.getAttribute('src') : null;
          }

          board.elements.push({
            x,
            y,
            width,
            height,
            innerText,
            color,
            type,
            id,
            imageSrc,
            createdByUserId: (element.dataset['createdByUserId'] !== undefined && element.dataset['createdByUserId'] !== null) ? element.dataset['createdByUserId'] : undefined,
            createdByRole: (element.dataset['createdByRole'] !== undefined && element.dataset['createdByRole'] !== null) ? element.dataset['createdByRole'] : undefined
          });
        }
      }
    } catch (error) {
      throw error;
    }
  }

  getData(id: string) {
    return this.boards.find(element => element.id === id)
  }

  getActiveBoard() {
    return this.getData(this.activeId);
  }

  deleteBoard(id: string) {
    let newBoards: Board[] = this.boards.filter((board: Board)=>{
      if(board.id === id) {
        return false;
      }
      return true;
    })
    this.boards = newBoards;
    db.boards.delete(id);
  }

  toggleFavorite(id: string) {

    let newBoards: Board[] = this.boards.map(element=>{
      if(element.id === id) {
        if(element.favorite) {
          element.favorite = !element.favorite;

        } else {
          element.favorite = true;
        }

        db.boards.update(id, {
          favorite: element.favorite
        });
      }
      return element
    })

    this.boards = newBoards;
  }

  editBoardName(id: string, name: string) {
    let newBoards: Board[] = this.boards.map((board: Board)=>{
      if(board.id === id) {
        return {
          ...board,
          name,
        }
      }
      return board
    })
    db.boards.update(id, {
      name,
    });

    this.boards = newBoards;
  }

  toggleTag(tag: Tag,id: string) {
    let board = this.boards.find(e=>e.id===id)
    if(!board) return

    if(board.tag) {
      let selectedTag = board.tag.find(e=>e.id === tag.id)
    } else {
      board.tag = [tag]
    }
  }

  ngOnInit(): void {
    this.activeId = this.activatedRoute.snapshot.paramMap.get('id') ?? 'null';
  }
}
