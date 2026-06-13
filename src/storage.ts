/**
 * Utility to write to localStorage safely, preventing QuotaExceededError crashes
 * by automatically pruning large base64 image strings from history and logs when full.
 */
export function safeLocalStorageSetItem(key: string, value: string): boolean {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (error: any) {
    console.warn("localStorage.setItem failed, attempting to clear space:", error);
    
    // Check if it's a QuotaExceededError
    const isQuotaError = 
      error.name === 'QuotaExceededError' || 
      error.code === 22 || 
      error.name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
      error.message?.toLowerCase().includes('quota') ||
      error.message?.toLowerCase().includes('exceeded');

    if (isQuotaError) {
      try {
        console.log("Quota exceeded detected. Pruning base64 images to free up space...");
        
        // 1. Prune scanned history images
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (k && k.startsWith('nutrisaas_scanned_history')) {
            try {
              const history = JSON.parse(localStorage.getItem(k) || '[]');
              if (Array.isArray(history)) {
                let changed = false;
                history.forEach((item: any) => {
                  if (item.photoBase64) {
                    delete item.photoBase64;
                    changed = true;
                  }
                });
                if (changed) {
                  localStorage.setItem(k, JSON.stringify(history));
                }
              }
            } catch (_) {}
          }
        }

        // 2. Prune daily logs images
        const localLogsKey = 'nutrisaas_local_logs';
        try {
          const localLogs = JSON.parse(localStorage.getItem(localLogsKey) || '[]');
          if (Array.isArray(localLogs)) {
            let changed = false;
            localLogs.forEach((log: any) => {
              if (log.photoBase64) {
                delete log.photoBase64;
                changed = true;
              }
            });
            if (changed) {
              localStorage.setItem(localLogsKey, JSON.stringify(localLogs));
            }
          }
        } catch (_) {}

        // 3. Retry original setItem
        localStorage.setItem(key, value);
        console.log("Successfully wrote to localStorage after pruning base64 images.");
        return true;
      } catch (retryError) {
        console.error("Failed to write to localStorage even after pruning images:", retryError);
      }
    }
    return false;
  }
}
