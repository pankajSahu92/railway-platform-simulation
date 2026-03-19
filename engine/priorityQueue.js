// Min-Heap Priority Queue (sorted by timestamp, ascending)
export class PriorityQueue {
  constructor() {
    this.heap = [];
  }

  _parentIndex(i) { return Math.floor((i - 1) / 2); }
  _leftIndex(i)   { return 2 * i + 1; }
  _rightIndex(i)  { return 2 * i + 2; }

  _swap(i, j) {
    [this.heap[i], this.heap[j]] = [this.heap[j], this.heap[i]];
  }

  _heapifyUp() {
    let i = this.heap.length - 1;
    while (i > 0) {
      const p = this._parentIndex(i);
      if (this.heap[p].timestamp > this.heap[i].timestamp) {
        this._swap(p, i);
        i = p;
      } else break;
    }
  }

  _heapifyDown() {
    let i = 0;
    while (this._leftIndex(i) < this.heap.length) {
      let smallest = this._leftIndex(i);
      const right = this._rightIndex(i);
      if (right < this.heap.length && this.heap[right].timestamp < this.heap[smallest].timestamp) {
        smallest = right;
      }
      if (this.heap[i].timestamp > this.heap[smallest].timestamp) {
        this._swap(i, smallest);
        i = smallest;
      } else break;
    }
  }

  push(element) {
    this.heap.push(element);
    this._heapifyUp();
  }

  pop() {
    if (this.heap.length === 0) return undefined;
    if (this.heap.length === 1) return this.heap.pop();
    const root = this.heap[0];
    this.heap[0] = this.heap.pop();
    this._heapifyDown();
    return root;
  }

  peek() {
    return this.heap.length > 0 ? this.heap[0] : undefined;
  }

  isEmpty() {
    return this.heap.length === 0;
  }

  size() {
    return this.heap.length;
  }

  clone() {
    const q = new PriorityQueue();
    q.heap = [...this.heap];
    return q;
  }
}
