/**
 * @fileoverview Performance Monitoring Composable
 * 
 * Provides comprehensive performance monitoring for the DataTable component.
 * Tracks render times, memory usage, scroll performance, and more.
 * 
 * @author MH DataTable Team
 * @version 4.0.0
 */

import { ref, computed, watch, onMounted, onUnmounted } from 'vue'

export interface PerformanceMetrics {
  renderTime: number
  totalRows: number
  visibleRows: number
  scrollFPS: number
  memoryUsage: number
  lastUpdate: number
  warnings: string[]
}

export interface PerformanceThresholds {
  renderTime: number // ms
  scrollFPS: number  // fps
  memoryUsage: number // MB
}

const DEFAULT_THRESHOLDS: PerformanceThresholds = {
  renderTime: 16, // 60fps target
  scrollFPS: 50,
  memoryUsage: 50
}

/**
 * Performance monitoring composable
 */
export function usePerformanceMonitor(
  enabled = true,
  thresholds: Partial<PerformanceThresholds> = {}
) {
  const performanceMetrics = ref<PerformanceMetrics>({
    renderTime: 0,
    totalRows: 0,
    visibleRows: 0,
    scrollFPS: 0,
    memoryUsage: 0,
    lastUpdate: Date.now(),
    warnings: []
  })

  const actualThresholds = { ...DEFAULT_THRESHOLDS, ...thresholds }
  
  // FPS tracking
  let frameCount = 0
  let lastFrameTime = 0
  let fpsInterval: NodeJS.Timeout | null = null
  
  // Memory usage tracking
  let memoryInterval: NodeJS.Timeout | null = null
  
  // Render time tracking
  const renderStartTimes = new Map<string, number>()
  
  /**
   * Start measuring render time
   */
  const startRenderMeasure = (operation: string) => {
    if (!enabled) return
    renderStartTimes.set(operation, performance.now())
  }

  /**
   * End measuring render time
   */
  const endRenderMeasure = (operation: string) => {
    if (!enabled) return
    
    const startTime = renderStartTimes.get(operation)
    if (startTime) {
      const renderTime = performance.now() - startTime
      performanceMetrics.value.renderTime = renderTime
      renderStartTimes.delete(operation)
      
      // Check threshold
      if (renderTime > actualThresholds.renderTime) {
        addWarning(`Slow render: ${operation} took ${renderTime.toFixed(2)}ms`)
      }
    }
  }

  /**
   * Track scroll performance
   */
  const trackScrollFrame = () => {
    if (!enabled) return
    
    const now = performance.now()
    frameCount++
    
    if (now - lastFrameTime >= 1000) {
      const fps = Math.round((frameCount * 1000) / (now - lastFrameTime))
      performanceMetrics.value.scrollFPS = fps
      frameCount = 0
      lastFrameTime = now
      
      // Check threshold
      if (fps < actualThresholds.scrollFPS) {
        addWarning(`Low scroll FPS: ${fps}fps`)
      }
    }
  }

  /**
   * Update row counts
   */
  const updateRowCounts = (total: number, visible: number) => {
    if (!enabled) return
    
    performanceMetrics.value.totalRows = total
    performanceMetrics.value.visibleRows = visible
    performanceMetrics.value.lastUpdate = Date.now()
  }

  /**
   * Get memory usage (if available)
   */
  const updateMemoryUsage = () => {
    if (!enabled || !('memory' in performance)) return
    
    const memory = (performance as any).memory
    if (memory) {
      const usedMB = Math.round(memory.usedJSHeapSize / 1024 / 1024)
      performanceMetrics.value.memoryUsage = usedMB
      
      // Check threshold
      if (usedMB > actualThresholds.memoryUsage) {
        addWarning(`High memory usage: ${usedMB}MB`)
      }
    }
  }

  /**
   * Add performance warning
   */
  const addWarning = (warning: string) => {
    const warnings = performanceMetrics.value.warnings
    if (!warnings.includes(warning)) {
      warnings.push(warning)
      
      // Keep only last 10 warnings
      if (warnings.length > 10) {
        warnings.shift()
      }
    }
  }

  /**
   * Clear warnings
   */
  const clearWarnings = () => {
    performanceMetrics.value.warnings = []
  }

  /**
   * Get performance summary
   */
  const getPerformanceSummary = () => {
    const metrics = performanceMetrics.value
    const score = calculatePerformanceScore()
    
    return {
      score,
      grade: getPerformanceGrade(score),
      metrics: { ...metrics },
      recommendations: getRecommendations()
    }
  }

  /**
   * Calculate overall performance score (0-100)
   */
  const calculatePerformanceScore = (): number => {
    let score = 100
    const metrics = performanceMetrics.value
    
    // Render time penalty
    if (metrics.renderTime > actualThresholds.renderTime) {
      const penalty = Math.min(30, (metrics.renderTime / actualThresholds.renderTime - 1) * 20)
      score -= penalty
    }
    
    // FPS penalty
    if (metrics.scrollFPS < actualThresholds.scrollFPS) {
      const penalty = Math.min(25, (1 - metrics.scrollFPS / actualThresholds.scrollFPS) * 25)
      score -= penalty
    }
    
    // Memory penalty
    if (metrics.memoryUsage > actualThresholds.memoryUsage) {
      const penalty = Math.min(20, (metrics.memoryUsage / actualThresholds.memoryUsage - 1) * 15)
      score -= penalty
    }
    
    return Math.max(0, Math.round(score))
  }

  /**
   * Get performance grade
   */
  const getPerformanceGrade = (score: number): string => {
    if (score >= 90) return 'A'
    if (score >= 80) return 'B'
    if (score >= 70) return 'C'
    if (score >= 60) return 'D'
    return 'F'
  }

  /**
   * Get performance recommendations
   */
  const getRecommendations = (): string[] => {
    const recommendations: string[] = []
    const metrics = performanceMetrics.value
    
    if (metrics.renderTime > actualThresholds.renderTime) {
      recommendations.push('Consider enabling virtualization for large datasets')
      recommendations.push('Reduce the number of visible columns')
    }
    
    if (metrics.scrollFPS < actualThresholds.scrollFPS) {
      recommendations.push('Enable virtual scrolling')
      recommendations.push('Reduce CSS animations during scroll')
    }
    
    if (metrics.memoryUsage > actualThresholds.memoryUsage) {
      recommendations.push('Enable data pagination')
      recommendations.push('Consider lazy loading of cell content')
    }
    
    if (metrics.visibleRows > 100) {
      recommendations.push('Enable virtualization to improve performance')
    }
    
    return recommendations
  }

  /**
   * Setup monitoring intervals
   */
  const setupMonitoring = () => {
    if (!enabled) return
    
    // FPS monitoring during scroll
    fpsInterval = setInterval(trackScrollFrame, 100)
    
    // Memory monitoring
    memoryInterval = setInterval(updateMemoryUsage, 5000)
  }

  /**
   * Cleanup monitoring
   */
  const cleanup = () => {
    if (fpsInterval) {
      clearInterval(fpsInterval)
      fpsInterval = null
    }
    
    if (memoryInterval) {
      clearInterval(memoryInterval)
      memoryInterval = null
    }
    
    renderStartTimes.clear()
  }

  // Computed properties
  const isPerformant = computed(() => calculatePerformanceScore() >= 80)
  const hasWarnings = computed(() => performanceMetrics.value.warnings.length > 0)

  // Lifecycle
  onMounted(setupMonitoring)
  onUnmounted(cleanup)

  return {
    // State
    performanceMetrics,
    isPerformant,
    hasWarnings,
    
    // Methods
    startRenderMeasure,
    endRenderMeasure,
    trackScrollFrame,
    updateRowCounts,
    updateMemoryUsage,
    addWarning,
    clearWarnings,
    getPerformanceSummary,
    
    // Config
    enabled: ref(enabled),
    thresholds: actualThresholds
  }
} 