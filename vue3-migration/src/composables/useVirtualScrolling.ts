/**
 * @fileoverview Enhanced Virtual Scrolling Composable
 * 
 * High-performance virtual scrolling implementation for large datasets.
 * Features:
 * - Optimized rendering with requestAnimationFrame
 * - Memory-efficient item calculations
 * - Smooth scrolling with momentum
 * - Dynamic item height support
 * - Performance monitoring
 * 
 * @author MH DataTable Team
 * @version 4.0.0
 */

import { ref, computed, watch, nextTick, onUnmounted, shallowRef } from 'vue'

export interface VirtualScrollOptions {
  itemHeight: number | ((index: number) => number)
  containerHeight: number
  buffer?: number
  overscan?: number
  throttleMs?: number
  enableMomentum?: boolean
}

export interface VirtualScrollItem<T> {
  item: T
  index: number
  offsetY: number
  height: number
}

/**
 * Performance-optimized virtual scrolling composable
 */
export function useVirtualScrolling<T>(
  items: readonly T[],
  options: VirtualScrollOptions
) {
  const { 
    itemHeight, 
    containerHeight, 
    buffer = 3,
    overscan = 2,
    throttleMs = 16,
    enableMomentum = true
  } = options

  // Use shallowRef for better performance
  const scrollTop = shallowRef(0)
  const containerRef = ref<HTMLElement>()
  const isScrolling = ref(false)
  const momentum = ref(0)
  
  // Performance monitoring
  const renderCount = ref(0)
  const lastRenderTime = ref(0)
  
  // Cache for dynamic heights
  const heightCache = new Map<number, number>()
  
  // Throttled scroll handler
  let scrollTimer: NodeJS.Timeout | null = null
  let animationFrame: number | null = null
  
  /**
   * Get item height (supports both fixed and dynamic heights)
   */
  const getItemHeight = (index: number): number => {
    if (typeof itemHeight === 'number') {
      return itemHeight
    }
    
    // Check cache first
    if (heightCache.has(index)) {
      return heightCache.get(index)!
    }
    
    // Calculate and cache
    const height = itemHeight(index)
    heightCache.set(index, height)
    return height
  }

  /**
   * Calculate cumulative offsets for dynamic heights
   */
  const getOffsetTop = (index: number): number => {
    if (typeof itemHeight === 'number') {
      return index * itemHeight
    }
    
    let offset = 0
    for (let i = 0; i < index; i++) {
      offset += getItemHeight(i)
    }
    return offset
  }

  /**
   * Find index from scroll position (binary search for dynamic heights)
   */
  const findStartIndex = (scrollTop: number): number => {
    if (typeof itemHeight === 'number') {
      return Math.floor(scrollTop / itemHeight)
    }
    
    // Binary search for dynamic heights
    let low = 0
    let high = items.length - 1
    
    while (low <= high) {
      const mid = Math.floor((low + high) / 2)
      const offset = getOffsetTop(mid)
      
      if (offset <= scrollTop) {
        low = mid + 1
      } else {
        high = mid - 1
      }
    }
    
    return Math.max(0, high)
  }

  /**
   * Calculate visible range with optimizations
   */
  const visibleRange = computed(() => {
    const start = performance.now()
    
    if (!items.length) {
      return { startIndex: 0, endIndex: 0, visibleCount: 0 }
    }

    const scrollPosition = scrollTop.value
    const viewportHeight = containerHeight
    
    // Find start index
    const startIndex = Math.max(0, findStartIndex(scrollPosition) - buffer)
    
    // Calculate end index
    let endIndex = startIndex
    let currentHeight = 0
    const targetHeight = viewportHeight + (overscan * 2 * (typeof itemHeight === 'number' ? itemHeight : 50))
    
    while (endIndex < items.length && currentHeight < targetHeight) {
      currentHeight += getItemHeight(endIndex)
      endIndex++
    }
    
    // Add buffer to end
    endIndex = Math.min(items.length, endIndex + buffer)
    
    const result = {
      startIndex,
      endIndex,
      visibleCount: endIndex - startIndex
    }
    
    // Performance tracking
    renderCount.value++
    lastRenderTime.value = performance.now() - start
    
    return result
  })

  /**
   * Get visible items with memoization
   */
  const visibleItems = computed((): VirtualScrollItem<T>[] => {
    const { startIndex, endIndex } = visibleRange.value
    const result: VirtualScrollItem<T>[] = []
    
    for (let i = startIndex; i < endIndex; i++) {
      if (i >= items.length) break
      
      result.push({
        item: items[i],
        index: i,
        offsetY: getOffsetTop(i),
        height: getItemHeight(i)
      })
    }
    
    return result
  })

  /**
   * Calculate total height
   */
  const totalHeight = computed(() => {
    if (typeof itemHeight === 'number') {
      return items.length * itemHeight
    }
    
    return getOffsetTop(items.length)
  })

  /**
   * Get offset for visible container
   */
  const offsetY = computed(() => {
    const { startIndex } = visibleRange.value
    return getOffsetTop(startIndex)
  })

  /**
   * Optimized scroll handler with momentum
   */
  const handleScroll = (event: Event) => {
    const target = event.target as HTMLElement
    const newScrollTop = target.scrollTop
    
    // Calculate momentum for smooth scrolling
    if (enableMomentum) {
      momentum.value = newScrollTop - scrollTop.value
    }
    
    isScrolling.value = true
    
    // Use RAF for smooth updates
    if (animationFrame) {
      cancelAnimationFrame(animationFrame)
    }
    
    animationFrame = requestAnimationFrame(() => {
      scrollTop.value = newScrollTop
      
      // Clear scrolling state after delay
      if (scrollTimer) {
        clearTimeout(scrollTimer)
      }
      
      scrollTimer = setTimeout(() => {
        isScrolling.value = false
        momentum.value = 0
      }, 150)
    })
  }

  /**
   * Scroll to specific index with animation
   */
  const scrollToIndex = (index: number, behavior: ScrollBehavior = 'smooth') => {
    if (!containerRef.value || index < 0 || index >= items.length) return
    
    const targetOffset = getOffsetTop(index)
    containerRef.value.scrollTo({
      top: targetOffset,
      behavior
    })
  }

  /**
   * Scroll to specific offset
   */
  const scrollToOffset = (offset: number, behavior: ScrollBehavior = 'smooth') => {
    if (!containerRef.value) return
    
    containerRef.value.scrollTo({
      top: offset,
      behavior
    })
  }

  /**
   * Get estimated row index from scroll position
   */
  const getIndexFromScrollTop = (scrollPosition: number): number => {
    return findStartIndex(scrollPosition)
  }

  /**
   * Clear height cache when items change
   */
  watch(() => items.length, () => {
    heightCache.clear()
  })

  /**
   * Performance metrics
   */
  const getPerformanceMetrics = () => ({
    renderCount: renderCount.value,
    lastRenderTime: lastRenderTime.value,
    cacheSize: heightCache.size,
    visibleItemCount: visibleRange.value.visibleCount,
    isScrolling: isScrolling.value,
    momentum: momentum.value
  })

  /**
   * Update item height in cache (for dynamic content)
   */
  const updateItemHeight = (index: number, height: number) => {
    heightCache.set(index, height)
  }

  /**
   * Cleanup
   */
  onUnmounted(() => {
    if (scrollTimer) clearTimeout(scrollTimer)
    if (animationFrame) cancelAnimationFrame(animationFrame)
    heightCache.clear()
  })

  return {
    // Refs
    containerRef,
    scrollTop: scrollTop as any, // Cast to avoid readonly issues
    isScrolling,
    momentum,
    
    // Computed
    visibleItems,
    visibleRange,
    totalHeight,
    offsetY,
    
    // Methods
    handleScroll,
    scrollToIndex,
    scrollToOffset,
    getIndexFromScrollTop,
    updateItemHeight,
    getPerformanceMetrics,
    
    // Performance
    renderCount,
    lastRenderTime
  }
} 