import { ElementRef, Injectable, Renderer2 } from '@angular/core';
import * as jsplumb from '@jsplumb/browser-ui'
import { Connection } from '@jsplumb/browser-ui';
import Panzoom, { PanzoomObject } from '@panzoom/panzoom';
import { NodeService } from '../../../features/board/services/node/node.service';
import { ActivatedRoute } from '@angular/router';
import { BoardDataService } from '../board-data/board-data.service';

@Injectable({
  providedIn: 'root'
})
export class BoardService {
  _instance!: jsplumb.JsPlumbInstance;
  activeResizeElement: HTMLElement | undefined;
  panzoom!: PanzoomObject;
  translation!: {
    x: number,
    y: number
  }
  zoomScale: number = 1;
  droppable: boolean = false;
  draggable: boolean = true;
  contextMenu!: {
    show: boolean;
    x: number,
    y: number,
  }
  appRenderer!: Renderer2;
  lockDrag: boolean = false;
  private _boardData?: BoardDataService;
  currentUserEmail: string = '';
  isViewer: boolean = false;
  private connectionMap: Map<string, Set<string>> = new Map();

  constructor(
    protected activeRoute: ActivatedRoute
  ) {
    this.contextMenu = {
      show: false,
      x: 0,
      y: 0,
    }
  }

  // Service locator pattern
  setBoardData(boardData: BoardDataService) {
    this._boardData = boardData;
  }

  get boardData(): BoardDataService {
    if (!this._boardData) {
      throw new Error('BoardDataService not initialized');
    }
    return this._boardData;
  }

  public get instance() : jsplumb.JsPlumbInstance {
    return this._instance;
  }

  public set instance(instance : jsplumb.JsPlumbInstance) {
    this._instance = instance;
  }

  findParentByClass(element: Element, className: string): Element | null {
    if (element.parentElement === null) return null;
    if (element.parentElement.id === 'main') return null;

    if (element.parentElement.classList.contains(className)) return element.parentElement;

    return this.findParentByClass(element.parentElement, className);
  }

  dragOverBoard(event: DragEvent) {
    event.preventDefault();
    if(event.dataTransfer?.dropEffect) {
      event.dataTransfer.dropEffect = 'move';
    }
  }

  zoomClick(type: 'in' | 'out') {
    if(type === 'in') this.panzoom.zoomIn()
    if(type === 'out') this.panzoom.zoomOut()
    const scale = this.panzoom.getScale()
    this.zoomScale = scale
    this.instance.setZoom(scale)
    this.translation = this.panzoom.getPan()
    // Force repaint after zoom
    this.instance.repaintEverything()
  }

  zoom = (event: WheelEvent) => {
    event.preventDefault()
    if(!event.ctrlKey) return

    this.panzoom.zoomWithWheel(event)

    const scale = this.panzoom.getScale()
    this.zoomScale = scale
    this.instance.setZoom(scale)
    this.translation = this.panzoom.getPan()
    // Force repaint after zoom
    this.instance.repaintEverything()
  }

  resetZoom = () => {
    this.zoomScale = 1
    this.panzoom.zoom(1)
    this.instance.setZoom(1)
    this.translation = this.panzoom.getPan()
  }

  resetPan = () => {
    this.panzoom.pan(0,0,{
      animate: true,
    })
    this.panzoom.zoom(1,{
      animate: true
    })
    const scale = this.panzoom.getScale()
    this.zoomScale = scale
    this.instance.setZoom(scale)
    this.translation = this.panzoom.getPan()
  }

  enablePanzoom = () => {
    this.panzoom.bind()
    this.panzoom.setOptions({
      cursor: '',

    })
  }

  disablePanzoom = () => {
    this.panzoom.destroy()
    this.panzoom.setOptions({
      cursor:'',
    })
  }

  keydown = (event: KeyboardEvent) => {
    console.log('KEY DOWN', event.code)
    if (event.key === " " || event.code === "Space"){
      this.lockDrag = true;
      console.log(this.lockDrag)
    }
  }

  keyup = (event: KeyboardEvent) => {
    console.log('KEY UP', event.code)
    if (event.key == " " || event.code == "Space"){
      this.lockDrag = false;
      console.log(this.lockDrag)
    }
  }

  dropNode = (event: DragEvent, nodeService: NodeService, container: ElementRef, renderer: Renderer2) => {
    if(event.dataTransfer?.dropEffect) {
      event.dataTransfer.dropEffect = 'move';
      if(event.target instanceof Element) {
        console.log(event.target)
        nodeService.createNode(event.x, event.y, event.dataTransfer.getData('text'), this.appRenderer,false)
      }
    }
  }

  pointerDownNode = (event: PointerEvent, element: Element, nodeService: NodeService,renderer: Renderer2) => { //? Handling click event in node
    if(!(event.target instanceof Element)) return
    // Restrict viewers: only allow dragging their own nodes
    if (this.isViewer) {
      const node = element as HTMLElement;
      console.log('[DEBUG] pointerDownNode check:', {
        nodeCreator: node.dataset['createdByUserId'],
        currentUser: this.currentUserEmail,
        isViewer: this.isViewer
      });
      if (node.dataset['createdByUserId'] !== this.currentUserEmail) {
        console.log('[DEBUG] Drag prevented - not owner');
        return;
      }
    }
    this.disablePanzoom()
  }

  pointerDownConnection = (event: PointerEvent, nodeService: NodeService, renderer: Renderer2) => { //? Handling click event in connectionoar
    if(!(event.target instanceof Element)) return
    this.disablePanzoom()
  }

  pointerDown = (event: PointerEvent, nodeService: NodeService, renderer:Renderer2, boardContainer?: HTMLElement) => {
    if(event.button == 1 || this.lockDrag) {
      if(boardContainer) boardContainer.style.cursor = 'grabbing'
      return
    };

    const abstractDocument:Document = renderer.selectRootElement(document, true)
    if(abstractDocument.activeElement && abstractDocument.activeElement instanceof HTMLElement) abstractDocument.activeElement.blur()



    if(!(event.target instanceof Element)) return;

    if(event.target.classList.contains('contextMenu')) return;

    const abstractElement: Element = renderer.selectRootElement(event.target,true)
    const nodeContainer: Element | null = this.findParentByClass(abstractElement,'nodeContainer');
    const linkActionContainer: Element | null = this.findParentByClass(abstractElement,'linkAction');

    console.log(abstractElement.tagName)

    if(abstractElement.tagName === 'INPUT') {
      this.disablePanzoom()
      return
    }

    if(abstractElement.tagName==='circle' || linkActionContainer || abstractElement.classList.contains('jtk-connector')){
      this.pointerDownConnection(event, nodeService, renderer)
      return
    }

    if(nodeContainer) {
      this.pointerDownNode(event,nodeContainer,nodeService,renderer);
      return
    }



    nodeService.clearActiveNote(renderer);
    nodeService.clearActiveConnection();
  }

  pointerUp = (event: Event) => {
    this.enablePanzoom()
    this.translation = this.panzoom.getPan()
  }

  pointerUpBoard = (event: PointerEvent, nodeService: NodeService, renderer: Renderer2) => {
    const abstractElement: Element = renderer.selectRootElement(event.target,true)
    const nodeContainer: Element | null = this.findParentByClass(abstractElement,'nodeContainer');
    const linkActionContainer: Element | null = this.findParentByClass(abstractElement,'linkAction');

    if(abstractElement.tagName=='circle' || linkActionContainer || abstractElement.classList.contains('jtk-connector')){
      this.pointerDownConnection(event, nodeService, renderer)
      nodeService.clearActiveNote(renderer);
      return
    }

    if(nodeContainer) {
      nodeService.setActiveNote(nodeContainer, renderer);
      nodeService.clearActiveConnection();
      return
    }

    nodeService.clearActiveNote(renderer);
    nodeService.clearActiveConnection();
  }

  connectorsConfiguration = () => {
    // Configure default connection type
    this.instance.registerConnectionType('default', {
      connector: 'Bezier',
      paintStyle: {
        stroke: '#000000',
        strokeWidth: 2
      },
      anchor: 'Continuous',
      endpoints: [{
        type: 'Dot',
        options: {
          fill: '#030303',
          stroke: '#030303',
          strokeWidth: 1
        }
      }, {
        type: 'Dot',
        options: {
          fill: '#030303',
          stroke: '#030303',
          strokeWidth: 1
        }
      }]
    });

    // Set default connection type
    this.instance.importDefaults({
      connectionOverlays: [],
      connector: 'Bezier',
      paintStyle: {
        stroke: '#000000',
        strokeWidth: 2
      },
      anchor: 'Continuous',
      endpoints: [{
        type: 'Dot',
        options: {
          fill: '#030303',
          stroke: '#030303',
          strokeWidth: 1
        }
      }, {
        type: 'Dot',
        options: {
          fill: '#030303',
          stroke: '#030303',
          strokeWidth: 1
        }
      }]
    });

    // Configure source endpoints for link actions
    this.instance.addSourceSelector('.linkAction', {
      anchor: 'Continuous',
      endpoint: "Dot",
      paintStyle: {
        stroke: '#030303',
        fill: '#030303',
        strokeWidth: 1,
      },
      connectorStyle: {
        stroke: "#030303",
        strokeWidth: 2
      },
      maxConnections: -1
    });

    // Configure target endpoints for nodes
    this.instance.addTargetSelector('.node', {
      anchor: 'Continuous',
      endpoint: "Dot",
      paintStyle: {
        stroke: '#030303',
        fill: '#030303',
        strokeWidth: 1,
      },
      connectorStyle: {
        stroke: "#030303",
        strokeWidth: 2
      },
      maxConnections: -1
    });
  }

  private getConnectionKey(sourceId: string, targetId: string): string {
    // Sort IDs to ensure consistent key regardless of connection direction
    return [sourceId, targetId].sort().join('|');
  }

  private hasConnection(sourceId: string, targetId: string): boolean {
    const key = this.getConnectionKey(sourceId, targetId);
    return this.connectionMap.has(key);
  }

  private addConnection(sourceId: string, targetId: string) {
    const key = this.getConnectionKey(sourceId, targetId);
    if (!this.connectionMap.has(key)) {
      this.connectionMap.set(key, new Set([sourceId, targetId]));
    }
  }

  private removeConnection(sourceId: string, targetId: string) {
    const key = this.getConnectionKey(sourceId, targetId);
    this.connectionMap.delete(key);
  }

  bindJsPlumbEvents = (nodeService: NodeService, renderer:Renderer2, boardData: BoardDataService) => {
    this.instance.bind(jsplumb.EVENT_ENDPOINT_CLICK, (endpoint: jsplumb.Endpoint) => {
      const connection = endpoint.connections[0]
      nodeService.activeConnection = connection;
    })

    this.instance.bind(jsplumb.EVENT_DRAG_START, (drag: jsplumb.DragMovePayload) => {
      nodeService.setActiveNote(drag.el,renderer)
      nodeService.clearActiveConnection()
    })

    this.instance.bind(jsplumb.EVENT_ELEMENT_MOUSE_DOWN, (element:Element) =>{
      const abstractElement = renderer.selectRootElement(element,true)
      let targetElement = this.findParentByClass(abstractElement,'resizeButton');
      if(targetElement) {
        this.draggable = false;
        const def:jsplumb.BrowserJsPlumbDefaults = this.instance.defaults
        def.elementsDraggable = false
        this.instance.importDefaults(def)
        if(targetElement.parentElement) {
          this.activeResizeElement = targetElement.parentElement
        }
      }
    })

    this.instance.bind(jsplumb.EVENT_ELEMENT_DBL_CLICK, (element:Element) => {
      if(nodeService.activeNode != element) nodeService.clearActiveNote(renderer);

      const abstractElement:Element = renderer.selectRootElement(element, true)

      let desc:Element | null = abstractElement.querySelector('.desc')
      // Only allow removing readonly/disabled if not a viewer, or if viewer is the owner, and board is not accepted
      const nodeCreator = (abstractElement as HTMLElement).dataset['createdByUserId'];
      const isViewer = this.isViewer;
      const currentUser = this.currentUserEmail;
      const isAccepted = boardData.activeBoard?.accepted;

      if (
        desc &&
        (desc?.getAttribute('readonly') != '' || desc?.getAttribute('disabled') != '') &&
        (!isViewer || nodeCreator === currentUser) &&
        !isAccepted
      ) {
        try {
          let dragDiv:Element | null = abstractElement.querySelector('.dragDiv')
          if(dragDiv && !dragDiv.classList.contains('hidden')) {
            renderer.addClass(dragDiv,'hidden')
          }
          renderer.removeAttribute(desc, 'readonly')
          renderer.removeAttribute(desc, 'disabled')
        } catch (error) {}
      }

      if(desc && desc instanceof HTMLElement) {
        desc.focus()
      }
    })

    this.instance.bind(jsplumb.INTERCEPT_BEFORE_DROP, (params: jsplumb.BeforeDropParams) => {
      if (this.boardData.activeBoard?.accepted) return false;
      
      // Restrict viewers: only allow connecting their own nodes
      if (this.isViewer) {
        const sourceNode = this.instance.getManagedElement(params.sourceId) as HTMLElement;
        const targetNode = this.instance.getManagedElement(params.targetId) as HTMLElement;
        if (
          sourceNode.dataset['createdByUserId'] !== this.currentUserEmail ||
          targetNode.dataset['createdByUserId'] !== this.currentUserEmail
        ) {
          return false;
        }
      }

      const sourceNode = this.instance.getManagedElement(params.sourceId);
      const targetNode = this.instance.getManagedElement(params.targetId);

      if (sourceNode === targetNode) return false;

      // Get all existing connections
      const allConnections = this.instance.getConnections({ scope: '*' }) as Connection[];
      
      // Check for existing connections in both directions
      const existingConnections = allConnections.filter((conn: Connection) => {
        const sourceId = conn.sourceId;
        const targetId = conn.targetId;
        const newSourceId = params.sourceId;
        const newTargetId = params.targetId;
        
        return (
          (sourceId === newSourceId && targetId === newTargetId) ||
          (sourceId === newTargetId && targetId === newSourceId)
        );
      });

      // If there are any existing connections, don't create a new one
      if (existingConnections.length > 0) {
        console.log('[DEBUG] Connection already exists, preventing duplicate:', {
          sourceId: params.sourceId,
          targetId: params.targetId,
          existingConnections: existingConnections.map(c => ({
            sourceId: c.sourceId,
            targetId: c.targetId
          }))
        });
        return false;
      }

      // Create new connection using the default connection type
      console.log('[DEBUG] Creating new connection:', {
        sourceId: params.sourceId,
        targetId: params.targetId
      });

      this.instance.connect({
        source: sourceNode,
        target: targetNode,
        type: 'default'
      });

      return true;
    });

    // Bind connection events to save connections
    this.instance.bind('connection', (info) => {
      const sourceId = info.connection.sourceId;
      const targetId = info.connection.targetId;

      // Check if this connection already exists
      if (this.hasConnection(sourceId, targetId)) {
        console.log('[DEBUG] Preventing duplicate connection:', {
          sourceId,
          targetId
        });
        // Remove the duplicate connection
        this.instance.deleteConnection(info.connection);
        return;
      }

      console.log('[DEBUG] Creating new connection:', {
        sourceId,
        targetId
      });

      // Add to our connection tracking
      this.addConnection(sourceId, targetId);
      boardData.saveData();
    });

    this.instance.bind('connectionDetached', (info) => {
      const sourceId = info.connection.sourceId;
      const targetId = info.connection.targetId;
      
      console.log('[DEBUG] Connection detached:', {
        sourceId,
        targetId
      });

      // Remove from our connection tracking
      this.removeConnection(sourceId, targetId);
      boardData.saveData();
    });

    // Add drag start handler for viewer restrictions
    this.instance.bind(jsplumb.EVENT_DRAG_START, (info: jsplumb.DragStartEventParams) => {
      if (this.isViewer) {
        const node = info.el as HTMLElement;
        console.log('[DEBUG] EVENT_DRAG_START check:', {
          nodeCreator: node.dataset['createdByUserId'],
          currentUser: this.currentUserEmail,
          isViewer: this.isViewer
        });
        if (node.dataset['createdByUserId'] !== this.currentUserEmail) {
          console.log('[DEBUG] Drag prevented - not owner');
          return false; // Prevent drag if not owner
        }
      }
      return true;
    });
  }

  init = (container: ElementRef, nodeService: NodeService, boardData: BoardDataService, renderer: Renderer2) => {
    console.log('[DEBUG] BoardService.init called');
    // Clear connection map on init
    this.connectionMap.clear();
    
    const abstractElement = renderer.selectRootElement(container)
    this.panzoom = Panzoom(abstractElement.nativeElement, {
      canvas: true,
      cursor: '',
      minScale: 0.4,  // Default minimum zoom out
      maxScale: 1.5,  // Default maximum zoom in
      step: 0.1,      // Default zoom step
      smoothZoom: true
    })
    this.translation = this.panzoom.getPan()

    const jsInstance = jsplumb.newInstance({
      container: abstractElement.nativeElement,
      elementsDraggable: true,
      allowNestedGroups: false
    });
    this.instance = jsInstance;

    this.connectorsConfiguration()
    this.bindJsPlumbEvents(nodeService, renderer, boardData)
  }
}