import { cameraScale, Color, drawLine, drawText, glContext, mainContext, screenToWorld, vec2, Vector2 } from "littlejsengine";
import Boid from "./Boid";

export class InfiniteSpatialGrid {
  cellSize: number;
  cells: Map<string, Boid[]>;

  constructor(cellSize: number) {
    this.cellSize = cellSize;
    this.cells = new Map();
  }

  // Helper to get a cell key based on position
  private getCellKey(position: Vector2): string {
    const x = Math.floor(position.x / this.cellSize);
    const y = Math.floor(position.y / this.cellSize);
    return `${x},${y}`;
  }

  // Add a boid to the grid
  addBoid(boid: Boid) {
    const cellKey = this.getCellKey(boid.position);
    if (!this.cells.has(cellKey)) {
      this.cells.set(cellKey, []);
    }
    this.cells.get(cellKey)!.push(boid);
  }

  // Get neighbors of a boid by checking its cell and adjacent cells
  getNeighbors(boid: Boid): Boid[] {
    const cellKey = this.getCellKey(boid.position);
    const [cellX, cellY] = cellKey.split(',').map(Number);
    const neighbors: Boid[] = [];

    // Check this cell and adjacent cells
    for (let x = -1; x <= 1; x++) {
      for (let y = -1; y <= 1; y++) {
        const neighborKey = `${cellX + x},${cellY + y}`;
        if (this.cells.has(neighborKey)) {
          neighbors.push(...this.cells.get(neighborKey)!);
        }
      }
    }

    return neighbors;
  }

  // Prune unused cells to avoid memory bloat
  pruneUnusedCells(activePositions: Vector2[]) {
    const activeKeys = new Set(activePositions.map(pos => this.getCellKey(pos)));
    this.cells.forEach((_, key) => {
      if (!activeKeys.has(key)) {
        this.cells.delete(key);
      }
    });
  }

  // Clear all cells (optional, for resetting between frames)
  clear() {
    this.cells.clear();
  }

  renderGrid() {
    const white = new Color(1, 1, 1, 1);
    this.cells.forEach((boids, key) => {
      const [x, y] = key.split(',').map(Number);
      const worldPos = vec2(x * this.cellSize + this.cellSize * 0.5, y * this.cellSize + this.cellSize * 0.5);
      drawText(`X: ${x}, Y: ${y}\nBoids: ${boids.length}`, worldPos, 1, white, 0, white, "center");
      drawLine(worldPos, worldPos.add(vec2(this.cellSize, 0)), 1, white);
      drawLine(worldPos, worldPos.add(vec2(0, this.cellSize)), 1, white);

    });
  }
}
