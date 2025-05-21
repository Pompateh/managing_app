import { ApplicationRef, EnvironmentInjector, Injectable, Renderer2, createComponent, inject } from '@angular/core';
import { BoardService } from '../../../../shared/services/board/board.service';
import { NgElement, WithProperties } from '@angular/elements';
import { NodeComponent } from '../../components/node/node.component';
import { NodeGroupComponent } from '../../components/node-group/node-group.component';
import { Connection, UIGroup } from '@jsplumb/browser-ui';


@Injectable({
  providedIn: 'root'
})
export class NodeService {
  nodes!: ArrayLike<any>
  activeResizeElement: HTMLElement | undefined;
  activeNode: Element | undefined;
  _activeConnection: Connection | undefined;
  container: HTMLElement | undefined;

  public get activeConnection() : Connection | undefined {
    return this._activeConnection
  }

  public set activeConnection(connection: Connection | undefined) {
    if(!connection) {
      this._activeConnection = undefined;
      return
    }

    if(this._activeConnection) this.clearActiveConnection();
    connection.endpointStyle.stroke = '#dd0000';
    connection.endpointStyle.strokeWidth = 2;
    this.boardService.instance.repaintEverything();
    this._activeConnection = connection;
  }

  clearActiveConnection() {
    if(this.activeConnection) {
      this.activeConnection.endpointStyle.strokeWidth = 0;
      this.activeConnection.endpointStyle.stroke = this.activeConnection.endpointStyle.fill;
      this.activeConnection = undefined
      this.boardService.instance.repaintEverything();
    }
  }

  constructor(
    private boardService: BoardService,
    private injector: EnvironmentInjector,
    private applicationRef: ApplicationRef,
  ) {}

  setNodes(newNodes: ArrayLike<any>) {
    this.nodes = newNodes;
  }

  getNodes(): ArrayLike<any> {
    return this.nodes
  }

  resizeMouseDown(event: MouseEvent) {
    this.boardService.draggable = false;
  }

  resizeMouseUp(event: MouseEvent) {
    this.boardService.draggable = true;
  }

  resizeElement(event: MouseEvent, renderer: Renderer2) {

    let mouseX = event.clientX
    let mouseY = event.clientY
    const abstractElement: HTMLElement = renderer.selectRootElement(this.boardService.activeResizeElement, true)

    this.setActiveNote(abstractElement, renderer);

    mouseX = mouseX/this.boardService.zoomScale
    mouseY = mouseY/this.boardService.zoomScale

    const groupId = this.boardService.instance.getId(abstractElement.parentElement)
    const group = this.boardService.instance.getManagedElement(groupId)
    if(group) {
      const groupidtop = group ? Number(getComputedStyle(group).top.replace(/([a-z])/g, '')): 0;
      const groupidleft = group ? Number(getComputedStyle(group).left.replace(/([a-z])/g, '')): 0;
      mouseX= mouseX - groupidleft
      mouseY= mouseY - groupidtop
    }

    let position = {
      top: Number(abstractElement.style.top.replace(/([a-z])/g, '')),
      left: Number(abstractElement.style.left.replace(/([a-z])/g, ''))
    }

    let calcSize = {
      width:((mouseX) - position.left + 10)-this.boardService.translation.x,
      height:((mouseY) - position.top + 10)-this.boardService.translation.y
    }

    renderer.setStyle(abstractElement,'width',`${calcSize.width}px`)
    renderer.setStyle(abstractElement,'height',`${calcSize.height}px`)
  }

  createNode(x: number, y: number, type: string, renderer: Renderer2, insideGroup: boolean, createdByUserId?: string, createdByRole?: string) {
    let node;
    let nodeComponent;
    switch (type) {
      case 'group':
        node = renderer.createElement('node-group-component') as NgElement & WithProperties<{
          innerTextarea: string | null
        }>;
        nodeComponent = NodeGroupComponent
        break;

      default:
        node = renderer.createElement('node-component')  as NgElement & WithProperties<{
          innerTextarea: string | null
        }>;;
        nodeComponent = NodeComponent
        break;
    }
    const nodeComponentRef = createComponent(nodeComponent, {
      environmentInjector: this.injector,
      hostElement: node
    })

    let top = (y/this.boardService.zoomScale)-this.boardService.translation.y
    let left = (x/this.boardService.zoomScale)-this.boardService.translation.x

    renderer.addClass(node,'nodeContainer')
    renderer.addClass(node,'node')
    if(type == 'group') renderer.addClass(node,'nodeGroup')
    renderer.setStyle(node,'position','absolute')
    renderer.setStyle(node,'top',`${top}px`)
    renderer.setStyle(node,'left',`${left}px`)
    renderer.setStyle(node, 'width','200px')
    renderer.setStyle(node, 'height','100px')

    // Store creator info
    if (createdByUserId) {
      node.dataset['createdByUserId'] = createdByUserId;
      console.log('[DEBUG] Creating node with creator:', createdByUserId);
    }
    if (createdByRole) node.dataset['createdByRole'] = createdByRole;

    // Pass creator info to NodeComponent
    if (nodeComponentRef.instance.constructor.name === 'NodeComponent') {
      (nodeComponentRef.instance as any).createdByUserId = createdByUserId || '';
      // Always pass currentUserEmail
      (nodeComponentRef.instance as any).currentUserEmail = this.boardService.currentUserEmail;
      // Pass isViewer
      (nodeComponentRef.instance as any).isViewer = this.boardService.isViewer;
      console.log('[DEBUG] Creating node with currentUserEmail:', this.boardService.currentUserEmail);
    }

    this.applicationRef.attachView(nodeComponentRef.hostView)

    this.clearActiveNote(renderer)
    this.clearActiveConnection();
    this.setActiveNote(node, renderer)

    const container = renderer.selectRootElement('#main',true)
    renderer.appendChild(container, node)
    this.boardService.enablePanzoom()

    // Prevent selection/interactivity for nodes not created by viewers
    if (this.boardService.isViewer && createdByRole !== 'VIEWER') {
      node.classList.add('no-select');
    }

    if(type == 'group') {//? Check if node type is group node
      this.boardService.instance.addGroup({
        el: node,
        droppable: true,
        orphan: true,
      })
    }

    this.boardService.instance.manage(node)

    // Ensure node has a unique id
    if (!node.id) {
      node.id = 'node-' + Math.random().toString(36).substr(2, 9);
    }
    console.log('[DEBUG] Adding endpoint for node:', node.id);
    // Remove all endpoints for this node before adding new ones
    this.boardService.instance.removeAllEndpoints(node);
    // Configure a single endpoint per node (both source and target)
    this.boardService.instance.addEndpoint(node, {
      anchor: 'Continuous',
      source: true,
      target: true,
      maxConnections: 1,
      uuid: node.id + '-endpoint',
      endpoint: 'Dot',
      paintStyle: { 
        fill: 'transparent',
        stroke: 'transparent',
        strokeWidth: 0
      },
      connector: 'Bezier'
    });

    return node
  }

  loadNode(x: number, y: number, width: number | null, height: number | null, color: string | null, innerText: string | null, type: string, renderer: Renderer2, nodeId: string | null, createdByUserId?: string, createdByRole?: string) {
    let node;
    let nodeComponent;
    switch (type) {
      case 'group':
        node = renderer.createElement('node-group-component') as NgElement & WithProperties<NodeGroupComponent>;
        nodeComponent = NodeGroupComponent
        break;

      default:
        node = renderer.createElement('node-component')  as NgElement & WithProperties<NodeComponent>;;
        nodeComponent = NodeComponent
        break;
    }
    const nodeComponentRef = createComponent(nodeComponent, {
      environmentInjector: this.injector,
      hostElement: node
    })

    // Set position and size directly from saved values (no scaling)
    renderer.addClass(node,'nodeContainer')
    renderer.addClass(node,'node')
    if(type == 'group') renderer.addClass(node,'nodeGroup')
    renderer.setStyle(node,'position','absolute')
    renderer.setStyle(node,'top',`${y}px`)
    renderer.setStyle(node,'left',`${x}px`)
    if(width) renderer.setStyle(node,'width',`${width}px`);
    if(height) renderer.setStyle(node,'height',`${height}px`);
    if(color) renderer.setStyle(node,'backgroundColor',`${color}`);
    if(innerText) nodeComponentRef.instance.innerTextarea = innerText

    // Restore creator info
    if (createdByUserId) {
      node.dataset['createdByUserId'] = createdByUserId;
      console.log('[DEBUG] Loading node with creator:', createdByUserId);
    }
    if (createdByRole) node.dataset['createdByRole'] = createdByRole;

    // Pass creator info to NodeComponent
    if (nodeComponentRef.instance.constructor.name === 'NodeComponent') {
      (nodeComponentRef.instance as any).createdByUserId = createdByUserId || '';
      // Always pass currentUserEmail
      (nodeComponentRef.instance as any).currentUserEmail = this.boardService.currentUserEmail;
      // Pass isViewer
      (nodeComponentRef.instance as any).isViewer = this.boardService.isViewer;
      console.log('[DEBUG] Loading node with currentUserEmail:', this.boardService.currentUserEmail);
    }

    this.applicationRef.attachView(nodeComponentRef.hostView)

    this.clearActiveNote(renderer)
    this.clearActiveConnection();
    this.setActiveNote(node, renderer)

    const container = renderer.selectRootElement('#main',true)
    renderer.appendChild(container, node)
    this.boardService.enablePanzoom()

    // Prevent selection/interactivity for nodes not created by viewers
    if (this.boardService.isViewer && createdByRole !== 'VIEWER') {
      node.classList.add('no-select');
    }

    const id = nodeId ?? undefined
    if(type == 'group') {
      this.boardService.instance.addGroup({
        id,
        el: node,
        droppable: true,
        orphan: true,
      })
    }

    this.boardService.instance.manage(node,id)

    // Ensure node has a unique id
    if (!node.id) {
      node.id = 'node-' + Math.random().toString(36).substr(2, 9);
    }
    console.log('[DEBUG] Adding endpoint for node:', node.id);
    // Remove all endpoints for this node before adding new ones
    this.boardService.instance.removeAllEndpoints(node);
    // Configure a single endpoint per node (both source and target)
    this.boardService.instance.addEndpoint(node, {
      anchor: 'Continuous',
      source: true,
      target: true,
      maxConnections: 1,
      uuid: node.id + '-endpoint',
      endpoint: 'Dot',
      paintStyle: { 
        fill: 'transparent',
        stroke: 'transparent',
        strokeWidth: 0
      },
      connector: 'Bezier'
    });

    return node
  }

  editNode(attribute: string, node: Element, renderer: Renderer2, value: string) {
    renderer.setStyle(node,attribute,value)
  }

  editConnection(value: string) {
    if(!this.activeConnection) return;
    this.activeConnection.setPaintStyle({
      stroke: value,
      strokeWidth: 3
    })

    this.activeConnection.setHoverPaintStyle({
      stroke: value,
      strokeWidth: 3
    })

    this.activeConnection.endpointStyle.fill = value;

    this.boardService.instance.repaintEverything()
  }

  toggleLabelConnection(renderer: Renderer2) {
    if(!this.activeConnection) return;
    console.log(this.activeConnection.getOverlays());
    if(Object.keys(this.activeConnection.getOverlays()).length !== 0 ){ //? Check if there are some overlay in the connection
      this.activeConnection.removeAllOverlays();

      return;
    }
    this.activeConnection.addOverlay({
      type:'Custom',
      options: {
        create: ()=>{
          const label: HTMLInputElement = renderer.createElement('input');
          renderer.setAttribute(label, 'class', 'labelConnection');
          renderer.setAttribute(label,'type','text');
          return label;
        },
        location: 0.5,
      }
    })
    this.boardService.instance.repaintEverything();
  }

  deleteNode(node: Element, renderer: Renderer2, nodeService: NodeService) { //!
    const container = renderer.selectRootElement('#main',true)

    const checkGroup = (element: Element | null): UIGroup | undefined=>{
      const id = this.boardService.instance.getId(element)
      const group = this.boardService.instance.groupManager.getGroups().find(g => g.elId === id);
      return group
    }

    if(checkGroup(node)) { //? If it is a group
      this.boardService.instance.removeGroup(checkGroup(node) ?? '');
    }

    if(checkGroup(node.parentElement)) { //? If inside a group
      this.boardService.instance.removeFromGroup(checkGroup(node.parentElement) ?? '',node);
    }

    this.boardService.instance.unmanage(node);
    this.boardService.instance.deleteConnectionsForElement(node)
    nodeService.clearActiveConnection();
    nodeService.clearActiveNote(renderer);
    renderer.removeChild(node.parentElement,node);
  }

  clearAll() {
    this.boardService.instance.reset()
  }

  setActiveNote(element: Element, renderer: Renderer2) {
    if(element) {
      if(element != this.activeNode) this.clearActiveNote(renderer)
      if(!element.classList.contains('activeNode')) element.className += ' activeNode'
      this.activeNode = element;
    }
  }

  clearActiveNote(renderer: Renderer2) {
    if(this.activeNode) {
      let element: Element = renderer.selectRootElement(this.activeNode,true);
      if(this.activeNode.className.includes('nodeContainer')) {
        element = this.activeNode
      }
      if(this.activeNode.className.includes('nodeElement')) {
        if(this.activeNode.parentElement) element = this.activeNode.parentElement
      }

        element.className = element.className.replace(' activeNode','');
        let descDiv = element.querySelector('.desc')
        let dragDiv = element.querySelector('.dragDiv')
        if(dragDiv) dragDiv.className = dragDiv.className.replace(' hidden','')
        try {
          renderer.setAttribute(descDiv,'readonly','')
          renderer.setAttribute(descDiv,'disabled','true')
        } catch (error) {}

        this.activeNode = undefined;
    }
  }

  createNodeWithImage(x: number, y: number, imageUrl: string, renderer: Renderer2, insideGroup: boolean, width?: number, height?: number, nodeId?: string, createdByUserId?: string, createdByRole?: string) {
    const nodeComponentRef = createComponent(NodeComponent, {
      environmentInjector: this.injector
    });
    nodeComponentRef.instance.imageSrc = imageUrl;

    const node = nodeComponentRef.location.nativeElement;
    node.classList.add('nodeContainer', 'node', 'imageNode');
    
    // Set position and size directly from saved values (no scaling)
    renderer.setStyle(node, 'position', 'absolute');
    renderer.setStyle(node, 'left', `${x}px`);
    renderer.setStyle(node, 'top', `${y}px`);
    renderer.setStyle(node, 'min-width', '0');
    renderer.setStyle(node, 'max-width', 'none');
    renderer.setStyle(node, 'min-height', '0');
    renderer.setStyle(node, 'max-height', 'none');

    // Restore creator info
    if (createdByUserId) node.dataset['createdByUserId'] = createdByUserId;
    if (createdByRole) node.dataset['createdByRole'] = createdByRole;

    // Load image and set dimensions
    const img = new window.Image();
    img.onload = () => {
      const finalWidth = width || img.width;
      const finalHeight = height || img.height;
      renderer.setStyle(node, 'width', `${finalWidth}px`);
      renderer.setStyle(node, 'height', `${finalHeight}px`);
      node.setAttribute('data-original-width', finalWidth.toString());
      node.setAttribute('data-original-height', finalHeight.toString());
    };
    img.src = imageUrl;

    this.applicationRef.attachView(nodeComponentRef.hostView);

    const container = renderer.selectRootElement('#main', true);
    renderer.appendChild(container, node);
    this.boardService.enablePanzoom();
    this.setActiveNote(node, renderer);
    this.clearActiveConnection();
    // Use nodeId if provided, otherwise let jsPlumb assign one
    this.boardService.instance.manage(node, nodeId);

    // Ensure node has a unique id
    if (!node.id) {
      node.id = 'node-' + Math.random().toString(36).substr(2, 9);
    }
    console.log('[DEBUG] Adding endpoint for node:', node.id);
    // Remove all endpoints for this node before adding new ones
    this.boardService.instance.removeAllEndpoints(node);
    // Configure a single endpoint per node (both source and target)
    this.boardService.instance.addEndpoint(node, {
      anchor: 'Continuous',
      source: true,
      target: true,
      maxConnections: 1,
      uuid: node.id + '-endpoint',
      endpoint: 'Dot',
      paintStyle: { 
        fill: 'transparent',
        stroke: 'transparent',
        strokeWidth: 0
      },
      connector: 'Bezier'
    });

    return node;
  }

  isImageNode(): boolean {
    if (!this.activeNode) return false;
    return this.activeNode.classList.contains('imageNode');
  }

  setContainer(container: HTMLElement) {
    this.container = container;
  }
}