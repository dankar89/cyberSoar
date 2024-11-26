export type Poolable = {
  activate: () => void;
  deactivate: () => void;
  active: boolean
};

export type PoolableCallbacks<T> = {
  onActivate?: (poolable: T) => void;
  onRelease?: (poolable: T) => void;
};

export default class ObjectPool<T extends Poolable> {
  private pool: T[] = [];
  private availableObjects: T[] = [];
  private activeObjects: Set<T> = new Set();
  private growthFactor: number;

  constructor(
    private createFunc: () => T,
    private initialSize: number,
    growthFactor: number = 1.5
  ) {
    this.growthFactor = Math.max(1.1, growthFactor); // Ensure minimum growth of 10%
    this.grow(initialSize);
  }

  private grow(minAmount: number) {
    const newSize = Math.ceil(Math.max(
      this.pool.length * this.growthFactor,
      this.pool.length + minAmount
    ));
    const growAmount = newSize - this.pool.length;

    for (let i = 0; i < growAmount; i++) {
      const obj = this.createFunc();
      obj.deactivate(); // Ensure objects start inactive
      this.pool.push(obj);
      this.availableObjects.push(obj);
    }
  }

  get(): T {
    if (this.availableObjects.length === 0) {
      // Grow the pool when we run out of objects
      this.grow(Math.ceil(this.pool.length * 0.2)); // Grow by at least 20% of current size
    }

    const obj = this.availableObjects.pop()!;
    this.activeObjects.add(obj);
    obj.activate();
    return obj;
  }

  release(obj: T) {
    if (this.activeObjects.delete(obj)) {
      obj.deactivate();
      this.availableObjects.push(obj);
    }
  }

  updateObjects(updateFunc: (obj: T) => void) {
    for (const obj of this.activeObjects) {
      updateFunc(obj);
    }
  }

  get size(): number {
    return this.pool.length;
  }

  get activeCount(): number {
    return this.activeObjects.size;
  }

  get availableCount(): number {
    return this.availableObjects.length;
  }
}