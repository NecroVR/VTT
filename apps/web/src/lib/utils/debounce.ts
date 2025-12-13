/**
 * Debounce Utility Functions
 *
 * Provides utilities for debouncing function calls to improve performance
 * by reducing the frequency of expensive operations.
 */

/**
 * Create a debounced version of a function
 *
 * @param fn The function to debounce
 * @param delay Delay in milliseconds
 * @returns Debounced function with cancel method
 */
export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): T & { cancel: () => void } {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  const debounced = function (this: any, ...args: Parameters<T>) {
    // Clear existing timeout
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }

    // Set new timeout
    timeoutId = setTimeout(() => {
      fn.apply(this, args);
      timeoutId = null;
    }, delay);
  } as T & { cancel: () => void };

  // Add cancel method
  debounced.cancel = () => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
  };

  return debounced;
}

/**
 * Create a debounced version of a function that returns a Promise
 *
 * Unlike regular debounce, this version will resolve all pending calls
 * with the same result when the debounced function finally executes.
 *
 * @param fn The async function to debounce
 * @param delay Delay in milliseconds
 * @returns Debounced function that returns a Promise
 */
export function debounceAsync<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  delay: number
): T & { cancel: () => void } {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let pendingResolvers: Array<{
    resolve: (value: any) => void;
    reject: (reason: any) => void;
  }> = [];

  const debounced = function (this: any, ...args: Parameters<T>): ReturnType<T> {
    // Clear existing timeout
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }

    // Create promise for this call
    const promise = new Promise((resolve, reject) => {
      pendingResolvers.push({ resolve, reject });
    });

    // Set new timeout
    timeoutId = setTimeout(async () => {
      const resolvers = pendingResolvers;
      pendingResolvers = [];
      timeoutId = null;

      try {
        const result = await fn.apply(this, args);
        // Resolve all pending promises with the same result
        resolvers.forEach(({ resolve }) => resolve(result));
      } catch (error) {
        // Reject all pending promises with the same error
        resolvers.forEach(({ reject }) => reject(error));
      }
    }, delay);

    return promise as ReturnType<T>;
  };

  // Add cancel method
  (debounced as any).cancel = () => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
    // Reject all pending promises
    pendingResolvers.forEach(({ reject }) => reject(new Error('Debounce cancelled')));
    pendingResolvers = [];
  };

  return debounced as unknown as T & { cancel: () => void };
}

/**
 * Throttle a function to execute at most once per specified interval
 *
 * Unlike debounce, throttle ensures the function is called at regular intervals
 * during continuous calls.
 *
 * @param fn The function to throttle
 * @param interval Minimum interval between calls in milliseconds
 * @returns Throttled function
 */
export function throttle<T extends (...args: any[]) => any>(
  fn: T,
  interval: number
): T & { cancel: () => void } {
  let lastCallTime = 0;
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  const throttled = function (this: any, ...args: Parameters<T>) {
    const now = Date.now();
    const timeSinceLastCall = now - lastCallTime;

    // Clear any pending timeout
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }

    if (timeSinceLastCall >= interval) {
      // Enough time has passed, call immediately
      lastCallTime = now;
      fn.apply(this, args);
    } else {
      // Schedule call for when interval has passed
      const remainingTime = interval - timeSinceLastCall;
      timeoutId = setTimeout(() => {
        lastCallTime = Date.now();
        fn.apply(this, args);
        timeoutId = null;
      }, remainingTime);
    }
  } as T & { cancel: () => void };

  // Add cancel method
  throttled.cancel = () => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
  };

  return throttled;
}

/**
 * Create a batched version of a function
 *
 * Collects all calls within the delay period and executes once with all arguments.
 *
 * @param fn The function to batch (receives array of all argument arrays)
 * @param delay Delay in milliseconds to collect calls
 * @returns Batched function
 */
export function batch<T extends any[]>(
  fn: (batched: T[]) => void,
  delay: number
): ((...args: T) => void) & { cancel: () => void; flush: () => void } {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let pendingCalls: T[] = [];

  const executeBatch = () => {
    if (pendingCalls.length > 0) {
      const calls = pendingCalls;
      pendingCalls = [];
      fn(calls);
    }
  };

  const batched = function (...args: T) {
    // Add to pending calls
    pendingCalls.push(args);

    // Clear existing timeout
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }

    // Set new timeout
    timeoutId = setTimeout(() => {
      executeBatch();
      timeoutId = null;
    }, delay);
  } as ((...args: T) => void) & { cancel: () => void; flush: () => void };

  // Add cancel method
  batched.cancel = () => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
    pendingCalls = [];
  };

  // Add flush method (execute immediately)
  batched.flush = () => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
    executeBatch();
  };

  return batched;
}
