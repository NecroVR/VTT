/**
 * LRU (Least Recently Used) Cache implementation
 *
 * Provides efficient caching with automatic eviction of least recently used items
 * when the cache reaches its maximum size.
 */

export interface CacheEntry<T> {
  value: T;
  timestamp: number;
}

export class LRUCache<K, V> {
  private cache: Map<K, CacheEntry<V>>;
  private accessOrder: K[];
  private maxSize: number;
  private ttl: number; // Time to live in milliseconds

  /**
   * Create a new LRU cache
   * @param maxSize Maximum number of entries to store
   * @param ttl Time to live for entries in milliseconds (default: 5 minutes)
   */
  constructor(maxSize: number = 100, ttl: number = 5 * 60 * 1000) {
    this.cache = new Map();
    this.accessOrder = [];
    this.maxSize = maxSize;
    this.ttl = ttl;
  }

  /**
   * Get a value from the cache
   * @param key The key to look up
   * @returns The cached value, or undefined if not found or expired
   */
  get(key: K): V | undefined {
    const entry = this.cache.get(key);

    if (!entry) {
      return undefined;
    }

    // Check if entry has expired
    const age = Date.now() - entry.timestamp;
    if (age > this.ttl) {
      this.delete(key);
      return undefined;
    }

    // Move to end of access order (most recently used)
    this.updateAccessOrder(key);

    return entry.value;
  }

  /**
   * Set a value in the cache
   * @param key The key to store
   * @param value The value to cache
   */
  set(key: K, value: V): void {
    // If key already exists, update it
    if (this.cache.has(key)) {
      this.cache.set(key, { value, timestamp: Date.now() });
      this.updateAccessOrder(key);
      return;
    }

    // If cache is full, remove least recently used
    if (this.cache.size >= this.maxSize) {
      this.evictLRU();
    }

    // Add new entry
    this.cache.set(key, { value, timestamp: Date.now() });
    this.accessOrder.push(key);
  }

  /**
   * Check if a key exists in the cache (and is not expired)
   * @param key The key to check
   * @returns True if the key exists and is valid
   */
  has(key: K): boolean {
    return this.get(key) !== undefined;
  }

  /**
   * Delete a key from the cache
   * @param key The key to delete
   * @returns True if the key was deleted, false if it didn't exist
   */
  delete(key: K): boolean {
    const existed = this.cache.delete(key);
    if (existed) {
      this.accessOrder = this.accessOrder.filter(k => k !== key);
    }
    return existed;
  }

  /**
   * Clear all entries from the cache
   */
  clear(): void {
    this.cache.clear();
    this.accessOrder = [];
  }

  /**
   * Get the current size of the cache
   * @returns Number of entries in the cache
   */
  get size(): number {
    return this.cache.size;
  }

  /**
   * Invalidate (remove) all expired entries
   * @returns Number of entries removed
   */
  invalidateExpired(): number {
    const now = Date.now();
    let removed = 0;

    const entries = Array.from(this.cache.entries());
    for (const [key, entry] of entries) {
      const age = now - entry.timestamp;
      if (age > this.ttl) {
        this.cache.delete(key);
        this.accessOrder = this.accessOrder.filter(k => k !== key);
        removed++;
      }
    }

    return removed;
  }

  /**
   * Update the access order for a key (mark as most recently used)
   * @param key The key to update
   */
  private updateAccessOrder(key: K): void {
    this.accessOrder = this.accessOrder.filter(k => k !== key);
    this.accessOrder.push(key);
  }

  /**
   * Evict the least recently used entry
   */
  private evictLRU(): void {
    if (this.accessOrder.length === 0) return;

    const lruKey = this.accessOrder.shift();
    if (lruKey !== undefined) {
      this.cache.delete(lruKey);
    }
  }

  /**
   * Get all keys in the cache (in access order, oldest first)
   * @returns Array of keys
   */
  keys(): K[] {
    return [...this.accessOrder];
  }

  /**
   * Get all values in the cache (in access order, oldest first)
   * @returns Array of values
   */
  values(): V[] {
    return this.accessOrder
      .map(key => this.cache.get(key))
      .filter((entry): entry is CacheEntry<V> => entry !== undefined)
      .map(entry => entry.value);
  }

  /**
   * Get cache statistics
   * @returns Object containing cache statistics
   */
  getStats(): { size: number; maxSize: number; oldestAge: number; newestAge: number } {
    const now = Date.now();
    let oldestAge = 0;
    let newestAge = 0;

    if (this.accessOrder.length > 0) {
      const oldestEntry = this.cache.get(this.accessOrder[0]);
      const newestEntry = this.cache.get(this.accessOrder[this.accessOrder.length - 1]);

      if (oldestEntry) {
        oldestAge = now - oldestEntry.timestamp;
      }
      if (newestEntry) {
        newestAge = now - newestEntry.timestamp;
      }
    }

    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      oldestAge,
      newestAge
    };
  }
}
