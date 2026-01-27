import { BATCH_CONFIG } from '../constants/config';

/**
 * Result of a batch operation
 */
export interface BatchResult<T> {
  successful: T[];
  failed: Array<{ item: T; error: string }>;
  totalProcessed: number;
  successCount: number;
  failureCount: number;
}

/**
 * Progress callback type
 */
export type ProgressCallback = (processed: number, total: number, currentItem?: string) => void;

/**
 * Execute operations in batches with concurrency control
 *
 * @param items - Array of items to process
 * @param operation - Async function to execute for each item
 * @param options - Batch configuration options
 * @returns BatchResult with successful and failed items
 */
export async function executeBatch<T, R>(
  items: T[],
  operation: (item: T) => Promise<R>,
  options?: {
    concurrentRequests?: number;
    batchDelayMs?: number;
    maxRetries?: number;
    onProgress?: ProgressCallback;
    getItemName?: (item: T) => string;
  }
): Promise<BatchResult<T>> {
  const {
    concurrentRequests = BATCH_CONFIG.concurrentRequests,
    batchDelayMs = BATCH_CONFIG.batchDelayMs,
    maxRetries = BATCH_CONFIG.maxRetries,
    onProgress,
    getItemName = () => 'item',
  } = options || {};

  const successful: T[] = [];
  const failed: Array<{ item: T; error: string }> = [];
  let processed = 0;

  // Process in chunks
  for (let i = 0; i < items.length; i += concurrentRequests) {
    const chunk = items.slice(i, i + concurrentRequests);

    const chunkPromises = chunk.map(async (item) => {
      let lastError = '';

      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
          await operation(item);
          successful.push(item);
          return;
        } catch (error) {
          lastError = error instanceof Error ? error.message : String(error);

          // Don't retry on 4xx errors (client errors)
          if (lastError.includes('400') || lastError.includes('401') || lastError.includes('403') || lastError.includes('404')) {
            break;
          }

          // Wait before retry
          if (attempt < maxRetries) {
            await sleep(Math.pow(2, attempt) * 500); // Exponential backoff
          }
        }
      }

      // All retries failed
      failed.push({ item, error: lastError });
    });

    await Promise.all(chunkPromises);

    processed += chunk.length;
    if (onProgress) {
      const lastItem = chunk[chunk.length - 1];
      onProgress(processed, items.length, getItemName(lastItem));
    }

    // Delay between batches to avoid rate limiting
    if (i + concurrentRequests < items.length && batchDelayMs > 0) {
      await sleep(batchDelayMs);
    }
  }

  return {
    successful,
    failed,
    totalProcessed: items.length,
    successCount: successful.length,
    failureCount: failed.length,
  };
}

/**
 * Retry only failed items from a previous batch operation
 */
export async function retryFailed<T, R>(
  previousResult: BatchResult<T>,
  operation: (item: T) => Promise<R>,
  options?: {
    onProgress?: ProgressCallback;
    getItemName?: (item: T) => string;
  }
): Promise<BatchResult<T>> {
  const failedItems = previousResult.failed.map((f) => f.item);

  if (failedItems.length === 0) {
    return {
      successful: [],
      failed: [],
      totalProcessed: 0,
      successCount: 0,
      failureCount: 0,
    };
  }

  return executeBatch(failedItems, operation, {
    ...options,
    maxRetries: 1, // Only one retry for already-failed items
  });
}

/**
 * Sleep utility
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Format batch result for user display
 */
export function formatBatchResult<T>(result: BatchResult<T>): string {
  if (result.failureCount === 0) {
    return `Successfully processed ${result.successCount} items.`;
  }

  if (result.successCount === 0) {
    return `Failed to process all ${result.failureCount} items.`;
  }

  return `Processed ${result.successCount} successfully, ${result.failureCount} failed.`;
}
