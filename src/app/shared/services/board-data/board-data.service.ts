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
import { SavedConnection } from '@custom-interfaces/saved-connection';
import { SavedNode } from '@custom-interfaces/saved-node';
import { Tag } from '@custom-interfaces/tag';
import { SupabaseAuthService } from '@core-services/supabase/supabase-auth.service';
import { SupabaseDbService } from '@core-services/supabase/supabase-db.service';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class BoardDataService implements OnInit {
  private boardsSubject = new BehaviorSubject<Board[]>([]);
  private currentBoardSubject = new BehaviorSubject<Board | null>(null);
  private activeIdSubject = new BehaviorSubject<string | null>(null);

  boards$ = this.boardsSubject.asObservable();
  currentBoard$ = this.currentBoardSubject.asObservable();
  activeId$ = this.activeIdSubject.asObservable();

  get boards(): Board[] {
    return this.boardsSubject.value;
  }

  get currentBoard(): Board | null {
    return this.currentBoardSubject.value;
  }

  get activeId(): string | null {
    return this.activeIdSubject.value;
  }

  get activeBoard(): Board | null {
    return this.currentBoard;
  }

  public tags: Tag[] = [];
  public favoriteBoards: Board[] = [];
  public acceptedBoards: Board[] = [];
  public recentBoards: Board[] = [];
  public templates: TemplateBoard[] = [
    kanban,
    sprintRetrospective,
    sprintRetro2,
    useCase
  ];
  public renderer!: Renderer2;

  constructor(
    private boardService: BoardService,
    private nodeService: NodeService,
    private router: Router,
    private route: ActivatedRoute,
    private cookieService: CookieService,
    private cookiesService: CookiesService,
    private authService: SupabaseAuthService,
    private supabaseDb: SupabaseDbService
  ) {
    this.initializeBoards();
  }

  async initializeBoards() {
    try {
      const boards = await this.supabaseDb.getClient()
        .from('boards')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (boards.data) {
        this.boardsSubject.next(boards.data);
      }
    } catch (error) {
      console.error('Error loading boards:', error);
    }
  }

  setCurrentBoard(board: Board | null) {
    this.currentBoardSubject.next(board);
    if (board) {
      this.activeIdSubject.next(board.id);
    } else {
      this.activeIdSubject.next(null);
    }
  }

  getActiveBoard(): Board | null {
    return this.currentBoard;
  }

  updateBoard(board: Board) {
    const currentBoards = this.boards;
    const index = currentBoards.findIndex(b => b.id === board.id);
    if (index !== -1) {
      currentBoards[index] = board;
      this.boardsSubject.next([...currentBoards]);
      if (this.currentBoard?.id === board.id) {
        this.setCurrentBoard(board);
      }
    }
  }

  async deleteAll() {
    // Implementation needed
  }

  async loadBoards() {
    // Implementation needed
  }

  async getBoards():Promise<Board[]> {
    // Implementation needed
    return [];
  }

  getBoard(id: string, projectId?: string) {
    // Implementation needed
    return undefined;
  }

  getBoardsByProject(projectId: string): Board[] {
    // Implementation needed
    return [];
  }

  async checkData(renderer: Renderer2) {
    // Implementation needed
  }

  createBoard(board?: Board, clearNotes?: boolean, projectId?: string): string {
    // Implementation needed
    return '';
  }

  createBoardFromTemplate(
    template:
    "sprint-retro" |
    "kanban" |
    "useCase" |
    "sprint-retro2"
  ) {
    // Implementation needed
  }

  isCookiesAccepted(): boolean {
    // Implementation needed
    return false;
  }

  async checkAndAcceptCookies(): Promise<boolean> {
    // Implementation needed
    return false;
  }

  async saveData() {
    // Implementation needed
    return false;
  }

  saveConnections(board: Board) {
    // Implementation needed
  }

  saveNodes(board: Board) {
    // Implementation needed
  }

  getData(id: string) {
    // Implementation needed
    return undefined;
  }

  deleteBoard(id: string) {
    // Implementation needed
  }

  toggleFavorite(id: string) {
    // Implementation needed
  }

  editBoardName(id: string, name: string) {
    // Implementation needed
  }

  toggleTag(tag: Tag,id: string) {
    // Implementation needed
  }

  ngOnInit(): void {
    this.route.queryParamMap.subscribe((p) => {
      const newId = p.get("id") ?? '';
      if (newId !== this.route.snapshot.queryParamMap.get('id')) {
        // Update the current board if the ID changes
        const selectedBoard = this.boards.find(e => e.id === newId);
        if (selectedBoard) {
          this.setCurrentBoard(selectedBoard);
        }
      }
    });
  }
}
