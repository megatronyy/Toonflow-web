/**
 * 图片预加载工具类
 * 用于预加载图片资源，提升用户体验
 */

interface PreloadOptions {
  priority?: 'high' | 'low' | 'auto';
  timeout?: number; // 超时时间（毫秒）
}

class ImagePreloader {
  private loadedImages: Map<string, boolean> = new Map();
  private loadingImages: Map<string, Promise<void>> = new Map();
  private failedImages: Set<string> = new Set();

  /**
   * 预加载单张图片
   */
  async preload(url: string, options: PreloadOptions = {}): Promise<void> {
    const { priority = 'auto', timeout = 10000 } = options;

    // 已加载或加载失败的图片不重复加载
    if (this.loadedImages.has(url) || this.failedImages.has(url)) {
      return;
    }

    // 正在加载中，返回现有的 Promise
    if (this.loadingImages.has(url)) {
      return this.loadingImages.get(url);
    }

    const loadPromise = new Promise<void>((resolve, reject) => {
      const img = new Image();
      
      // 设置优先级（仅支持部分浏览器）
      if ('fetchPriority' in img && priority !== 'auto') {
        (img as any).fetchPriority = priority;
      }

      let timeoutId: ReturnType<typeof setTimeout> | null = null;

      const cleanup = () => {
        if (timeoutId) {
          clearTimeout(timeoutId);
          timeoutId = null;
        }
        this.loadingImages.delete(url);
      };

      img.onload = () => {
        cleanup();
        this.loadedImages.set(url, true);
        resolve();
      };

      img.onerror = () => {
        cleanup();
        this.failedImages.add(url);
        reject(new Error(`Failed to load image: ${url}`));
      };

      // 超时处理
      if (timeout > 0) {
        timeoutId = setTimeout(() => {
          cleanup();
          this.failedImages.add(url);
          reject(new Error(`Image load timeout: ${url}`));
        }, timeout);
      }

      img.src = url;
    });

    this.loadingImages.set(url, loadPromise);
    
    try {
      await loadPromise;
    } catch (error) {
      console.warn('Image preload failed:', error);
    }
  }

  /**
   * 批量预加载图片
   */
  async preloadBatch(urls: string[], options: PreloadOptions = {}): Promise<void[]> {
    return Promise.all(urls.map(url => this.preload(url, options)));
  }

  /**
   * 预加载图片（不等待结果）
   */
  preloadAsync(url: string, options: PreloadOptions = {}): void {
    this.preload(url, options).catch(() => {
      // 忽略错误，静默失败
    });
  }

  /**
   * 批量异步预加载
   */
  preloadBatchAsync(urls: string[], options: PreloadOptions = {}): void {
    urls.forEach(url => this.preloadAsync(url, options));
  }

  /**
   * 检查图片是否已加载
   */
  isLoaded(url: string): boolean {
    return this.loadedImages.has(url);
  }

  /**
   * 检查图片是否加载失败
   */
  isFailed(url: string): boolean {
    return this.failedImages.has(url);
  }

  /**
   * 检查图片是否正在加载
   */
  isLoading(url: string): boolean {
    return this.loadingImages.has(url);
  }

  /**
   * 清除缓存
   */
  clear(): void {
    this.loadedImages.clear();
    this.loadingImages.clear();
    this.failedImages.clear();
  }

  /**
   * 获取统计信息
   */
  getStats() {
    return {
      loaded: this.loadedImages.size,
      loading: this.loadingImages.size,
      failed: this.failedImages.size,
    };
  }
}

// 导出单例
export const imagePreloader = new ImagePreloader();

// 导出类型
export type { PreloadOptions };
