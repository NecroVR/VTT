import { writable, derived } from 'svelte/store';

/**
 * PathPoint representing a single point in a path
 * Paths are assembled by grouping points with the same pathName, ordered by pathIndex
 */
export interface PathPoint {
  id: string;
  sceneId: string;
  pathName: string;
  pathIndex: number;
  x: number;
  y: number;
  color: string;
  visible: boolean;
  data: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Assembled path - derived from PathPoints with the same pathName
 */
export interface AssembledPath {
  pathName: string;
  sceneId: string;
  points: Array<{ id: string; x: number; y: number; pathIndex: number }>;
  color: string;
  visible: boolean;
}

interface PathPointsState {
  pathPoints: Map<string, PathPoint>;
  selectedPointId: string | null;
  isDrawingPath: boolean;
  currentPathName: string;
  currentPathNodes: Array<{ x: number; y: number }>;
  loading: boolean;
  error: string | null;
}

function createPathPointsStore() {
  const { subscribe, set, update } = writable<PathPointsState>({
    pathPoints: new Map(),
    selectedPointId: null,
    isDrawingPath: false,
    currentPathName: '',
    currentPathNodes: [],
    loading: false,
    error: null,
  });

  return {
    subscribe,

    /**
     * Load all path points for a scene from the API
     */
    async loadPathPoints(sceneId: string, token: string): Promise<void> {
      update(state => ({ ...state, loading: true, error: null }));

      try {
        const response = await fetch(`/api/v1/scenes/${sceneId}/path-points`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch path points: ${response.statusText}`);
        }

        const data = await response.json();
        const pathPoints = new Map<string, PathPoint>();

        if (data.pathPoints && Array.isArray(data.pathPoints)) {
          data.pathPoints.forEach((point: PathPoint) => {
            // Convert date strings to Date objects
            pathPoints.set(point.id, {
              ...point,
              createdAt: new Date(point.createdAt),
              updatedAt: new Date(point.updatedAt),
            });
          });
        }

        update(state => ({
          ...state,
          pathPoints,
          loading: false,
        }));
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        update(state => ({
          ...state,
          loading: false,
          error: message,
        }));
        console.error('Failed to load path points:', error);
      }
    },

    /**
     * Add a single path point to the store
     */
    addPathPoint(point: PathPoint): void {
      update(state => {
        const newPathPoints = new Map(state.pathPoints);
        newPathPoints.set(point.id, point);
        return {
          ...state,
          pathPoints: newPathPoints,
        };
      });
    },

    /**
     * Update a path point with partial data
     */
    updatePathPoint(pointId: string, updates: Partial<PathPoint>): void {
      update(state => {
        const point = state.pathPoints.get(pointId);
        if (!point) return state;

        const updatedPoint = { ...point, ...updates };
        const newPathPoints = new Map(state.pathPoints);
        newPathPoints.set(pointId, updatedPoint);

        return {
          ...state,
          pathPoints: newPathPoints,
        };
      });
    },

    /**
     * Remove a path point from the store
     */
    removePathPoint(pointId: string): void {
      update(state => {
        const newPathPoints = new Map(state.pathPoints);
        newPathPoints.delete(pointId);

        return {
          ...state,
          pathPoints: newPathPoints,
          selectedPointId: state.selectedPointId === pointId ? null : state.selectedPointId,
        };
      });
    },

    /**
     * Select a path point
     */
    selectPathPoint(pointId: string | null): void {
      update(state => ({
        ...state,
        selectedPointId: pointId,
      }));
    },

    /**
     * Get assembled paths (paths grouped by pathName) for a specific scene
     */
    getAssembledPaths(sceneId: string, currentState: PathPointsState): AssembledPath[] {
      // Group points by pathName
      const pathMap = new Map<string, PathPoint[]>();

      for (const point of currentState.pathPoints.values()) {
        if (point.sceneId !== sceneId) continue;

        if (!pathMap.has(point.pathName)) {
          pathMap.set(point.pathName, []);
        }
        pathMap.get(point.pathName)!.push(point);
      }

      // Assemble paths from grouped points
      const paths: AssembledPath[] = [];
      for (const [pathName, points] of pathMap) {
        const sorted = points.sort((a, b) => a.pathIndex - b.pathIndex);
        if (sorted.length > 0) {
          paths.push({
            pathName,
            sceneId: sorted[0].sceneId,
            points: sorted.map(p => ({ id: p.id, x: p.x, y: p.y, pathIndex: p.pathIndex })),
            color: sorted[0].color,
            visible: sorted[0].visible,
          });
        }
      }

      return paths;
    },

    /**
     * Start drawing a new path
     */
    startDrawingPath(pathName: string): void {
      update(state => ({
        ...state,
        isDrawingPath: true,
        currentPathName: pathName,
        currentPathNodes: [],
        selectedPointId: null,
      }));
    },

    /**
     * Add a node to the current path being drawn
     */
    addNodeToCurrentPath(x: number, y: number): void {
      update(state => {
        if (!state.isDrawingPath) return state;

        return {
          ...state,
          currentPathNodes: [...state.currentPathNodes, { x, y }],
        };
      });
    },

    /**
     * Finish drawing the current path
     * Returns the nodes and path name for the completed path
     */
    finishDrawingPath(): { pathName: string; nodes: Array<{ x: number; y: number }> } {
      let pathName = '';
      let nodes: Array<{ x: number; y: number }> = [];

      update(state => {
        pathName = state.currentPathName;
        nodes = [...state.currentPathNodes];
        return {
          ...state,
          isDrawingPath: false,
          currentPathName: '',
          currentPathNodes: [],
        };
      });

      return { pathName, nodes };
    },

    /**
     * Cancel the current path drawing
     */
    cancelDrawingPath(): void {
      update(state => ({
        ...state,
        isDrawingPath: false,
        currentPathName: '',
        currentPathNodes: [],
      }));
    },

    /**
     * Remove all points for a specific path (by pathName)
     */
    removePath(pathName: string): void {
      update(state => {
        const newPathPoints = new Map(state.pathPoints);
        const pointsToRemove: string[] = [];

        // Find all points with this pathName
        for (const [id, point] of newPathPoints) {
          if (point.pathName === pathName) {
            pointsToRemove.push(id);
          }
        }

        // Remove them
        pointsToRemove.forEach(id => newPathPoints.delete(id));

        return {
          ...state,
          pathPoints: newPathPoints,
        };
      });
    },

    /**
     * Clear all path points (useful when switching scenes or leaving a game)
     */
    clearPathPoints(): void {
      set({
        pathPoints: new Map(),
        selectedPointId: null,
        isDrawingPath: false,
        currentPathName: '',
        currentPathNodes: [],
        loading: false,
        error: null,
      });
    },

    /**
     * Setup WebSocket handlers for path point updates
     * Expected message types:
     * - pathPoint:add / pathPoint:added
     * - pathPoint:update / pathPoint:updated
     * - pathPoint:remove / pathPoint:removed
     */
    setupWebSocketHandlers(ws: any): () => void {
      // Placeholder for future WebSocket integration
      // When implemented, this will subscribe to:
      // - ws.onPathPointAdded((payload) => this.addPathPoint(payload.pathPoint))
      // - ws.onPathPointUpdated((payload) => this.updatePathPoint(payload.pathPoint.id, payload.pathPoint))
      // - ws.onPathPointRemoved((payload) => this.removePathPoint(payload.pointId))

      // Return unsubscribe function
      return () => {
        // Cleanup subscriptions
      };
    },

    /**
     * Send path point add message via WebSocket
     */
    sendPathPointAdd(
      ws: any,
      pointData: Omit<PathPoint, 'id' | 'createdAt' | 'updatedAt'>
    ): void {
      // Placeholder for future WebSocket integration
      console.warn('WebSocket pathPoint:add not yet implemented');
    },

    /**
     * Send path point update message via WebSocket
     */
    sendPathPointUpdate(ws: any, pointId: string, updates: Partial<PathPoint>): void {
      // Placeholder for future WebSocket integration
      console.warn('WebSocket pathPoint:update not yet implemented');
    },

    /**
     * Send path point remove message via WebSocket
     */
    sendPathPointRemove(ws: any, pointId: string): void {
      // Placeholder for future WebSocket integration
      console.warn('WebSocket pathPoint:remove not yet implemented');
    },
  };
}

export const pathPointsStore = createPathPointsStore();

/**
 * Derived store for assembled paths
 * Automatically groups and sorts PathPoints by pathName
 */
export const assembledPaths = derived(pathPointsStore, $store => {
  // Group points by pathName
  const pathMap = new Map<string, PathPoint[]>();

  for (const point of $store.pathPoints.values()) {
    if (!pathMap.has(point.pathName)) {
      pathMap.set(point.pathName, []);
    }
    pathMap.get(point.pathName)!.push(point);
  }

  // Assemble paths from grouped points
  const paths: AssembledPath[] = [];
  for (const [pathName, points] of pathMap) {
    const sorted = points.sort((a, b) => a.pathIndex - b.pathIndex);
    if (sorted.length > 0) {
      paths.push({
        pathName,
        sceneId: sorted[0].sceneId,
        points: sorted.map(p => ({ id: p.id, x: p.x, y: p.y, pathIndex: p.pathIndex })),
        color: sorted[0].color,
        visible: sorted[0].visible,
      });
    }
  }

  return paths;
});

/**
 * DEPRECATED: Legacy path interface (for backward compatibility)
 * Use pathPointsStore and assembledPaths instead
 */
export interface Path {
  id: string;
  sceneId: string;
  name: string;
  nodes: Array<{ x: number; y: number }>;
  speed: number;
  loop: boolean;
  assignedObjectId?: string | null;
  assignedObjectType?: 'token' | 'light' | null;
  visible: boolean;
  color: string;
  data: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * DEPRECATED: Backward compatibility store
 * This provides the old pathsStore API for components that haven't been migrated yet
 * TODO: Migrate all components to use pathPointsStore instead
 */
export const pathsStore = derived(assembledPaths, $assembledPaths => {
  // Convert assembled paths to legacy Path format
  const paths = new Map<string, Path>();

  $assembledPaths.forEach(assembledPath => {
    // Use pathName as the ID for backward compatibility
    paths.set(assembledPath.pathName, {
      id: assembledPath.pathName,
      sceneId: assembledPath.sceneId,
      name: assembledPath.pathName,
      nodes: assembledPath.points.map(p => ({ x: p.x, y: p.y })),
      speed: 1, // Default speed
      loop: false, // Default loop
      visible: assembledPath.visible,
      color: assembledPath.color,
      data: {},
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  });

  return {
    paths,
    selectedPathId: null,
    isDrawingPath: false,
    currentPathNodes: [],
    loading: false,
    error: null,
  };
});
