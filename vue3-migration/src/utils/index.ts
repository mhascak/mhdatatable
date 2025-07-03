/**
 * @fileoverview Utility Functions for MH DataTable
 * 
 * Collection of helper functions for data manipulation, type checking,
 * performance optimization, and common operations.
 * 
 * @author MH DataTable Team
 * @version 4.0.0
 */

/**
 * JSON stringify utility
 */
export const stringify = JSON.stringify

/**
 * JSON parse utility
 */
export const parse = JSON.parse

/**
 * Debounce function with immediate execution option
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number,
  immediate = false
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null
  
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null
      if (!immediate) func(...args)
    }
    
    const callNow = immediate && !timeout
    
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(later, wait)
    
    if (callNow) func(...args)
  }
}

/**
 * Throttle function for performance optimization
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean
  
  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => (inThrottle = false), limit)
    }
  }
}

/**
 * Deep clone utility with performance optimizations
 */
export function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') return obj
  if (obj instanceof Date) return new Date(obj.getTime()) as T
  if (obj instanceof Array) return obj.map(item => deepClone(item)) as T
  if (obj instanceof Set) return new Set(Array.from(obj, item => deepClone(item))) as T
  if (obj instanceof Map) return new Map(Array.from(obj, ([key, value]) => [key, deepClone(value)])) as T
  
  const cloned = {} as T
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      cloned[key] = deepClone(obj[key])
    }
  }
  return cloned
}

/**
 * Get nested value from object using dot notation
 * @example getNestedValue({ user: { name: 'John' } }, 'user.name') // 'John'
 */
export function getNestedValue(obj: any, path: string, defaultValue: any = undefined): any {
  if (!obj || typeof path !== 'string') return defaultValue
  
  const keys = path.split('.')
  let result = obj
  
  for (const key of keys) {
    result = result?.[key]
    if (result === undefined) return defaultValue
  }
  
  return result
}

/**
 * Set nested value in object using dot notation
 * @example setNestedValue({}, 'user.name', 'John') // { user: { name: 'John' } }
 */
export function setNestedValue(obj: any, path: string, value: any): void {
  if (!obj || typeof path !== 'string') return
  
  const keys = path.split('.')
  const lastKey = keys.pop()!
  
  let current = obj
  for (const key of keys) {
    if (!(key in current) || typeof current[key] !== 'object') {
      current[key] = {}
    }
    current = current[key]
  }
  
  current[lastKey] = value
}

/**
 * Generate unique ID
 */
export function generateId(prefix = 'mh'): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Check if value is empty (null, undefined, empty string, empty array, empty object)
 */
export function isEmpty(value: any): boolean {
  if (value == null) return true
  if (typeof value === 'string') return value.trim() === ''
  if (Array.isArray(value)) return value.length === 0
  if (typeof value === 'object') return Object.keys(value).length === 0
  return false
}

/**
 * Format file size in human readable format
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

/**
 * Format number with locale-specific formatting
 */
export function formatNumber(value: number, locale = 'en-US', options: Intl.NumberFormatOptions = {}): string {
  return new Intl.NumberFormat(locale, options).format(value)
}

/**
 * Clamp number between min and max values
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

/**
 * Calculate text width using canvas measurement
 */
export function measureTextWidth(text: string, font = '14px system-ui'): number {
  const canvas = document.createElement('canvas')
  const context = canvas.getContext('2d')
  if (!context) return 0
  
  context.font = font
  return context.measureText(text).width
}

/**
 * Convert CSS size string to number (px)
 */
export function cssToNumber(value: string | number): number {
  if (typeof value === 'number') return value
  if (typeof value === 'string') {
    const num = parseFloat(value.replace(/[^\d.-]/g, ''))
    return isNaN(num) ? 0 : num
  }
  return 0
}

/**
 * Check if element is in viewport
 */
export function isInViewport(element: HTMLElement): boolean {
  const rect = element.getBoundingClientRect()
  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth)
  )
}

/**
 * Smooth scroll to element
 */
export function scrollToElement(element: HTMLElement, options: ScrollIntoViewOptions = { behavior: 'smooth' }): void {
  element.scrollIntoView(options)
}

/**
 * Copy text to clipboard
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(text)
      return true
    } else {
      // Fallback for older browsers
      const textArea = document.createElement('textarea')
      textArea.value = text
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      return true
    }
  } catch (error) {
    console.error('Failed to copy to clipboard:', error)
    return false
  }
}

/**
 * Download data as file
 */
export function downloadFile(data: string, filename: string, type = 'text/plain'): void {
  const blob = new Blob([data], { type })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * Escape HTML characters
 */
export function escapeHtml(text: string): string {
  const div = document.createElement('div')
  div.textContent = text
  return div.innerHTML
}

/**
 * Parse CSV string to array of objects
 */
export function parseCSV(csv: string, delimiter = ','): any[] {
  const lines = csv.trim().split('\n')
  const headers = lines[0].split(delimiter).map(h => h.trim())
  
  return lines.slice(1).map(line => {
    const values = line.split(delimiter).map(v => v.trim())
    const obj: any = {}
    
    headers.forEach((header, index) => {
      obj[header] = values[index] || ''
    })
    
    return obj
  })
}

/**
 * Convert array of objects to CSV string
 */
export function arrayToCSV(data: any[], delimiter = ','): string {
  if (!data.length) return ''
  
  const headers = Object.keys(data[0])
  const csvHeaders = headers.join(delimiter)
  
  const csvRows = data.map(row => 
    headers.map(header => {
      const value = row[header]
      // Escape values containing delimiter or quotes
      if (typeof value === 'string' && (value.includes(delimiter) || value.includes('"'))) {
        return `"${value.replace(/"/g, '""')}"`
      }
      return value
    }).join(delimiter)
  )
  
  return [csvHeaders, ...csvRows].join('\n')
}

/**
 * Check if device supports touch
 */
export function isTouchDevice(): boolean {
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0
}

/**
 * Check if user prefers reduced motion
 */
export function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/**
 * Get system color scheme preference
 */
export function getColorScheme(): 'light' | 'dark' {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

/**
 * Simple event emitter for component communication
 */
export class EventEmitter<T = any> {
  private events: { [key: string]: Array<(data: T) => void> } = {}

  on(event: string, listener: (data: T) => void): void {
    if (!this.events[event]) {
      this.events[event] = []
    }
    this.events[event].push(listener)
  }

  off(event: string, listener: (data: T) => void): void {
    if (!this.events[event]) return
    this.events[event] = this.events[event].filter(l => l !== listener)
  }

  emit(event: string, data: T): void {
    if (!this.events[event]) return
    this.events[event].forEach(listener => listener(data))
  }

  once(event: string, listener: (data: T) => void): void {
    const onceListener = (data: T) => {
      listener(data)
      this.off(event, onceListener)
    }
    this.on(event, onceListener)
  }

  clear(): void {
    this.events = {}
  }
}

/**
 * Type guards
 */
export const is = {
  string: (value: any): value is string => typeof value === 'string',
  number: (value: any): value is number => typeof value === 'number' && !isNaN(value),
  boolean: (value: any): value is boolean => typeof value === 'boolean',
  array: (value: any): value is any[] => Array.isArray(value),
  object: (value: any): value is object => value !== null && typeof value === 'object' && !Array.isArray(value),
  function: (value: any): value is Function => typeof value === 'function',
  date: (value: any): value is Date => value instanceof Date && !isNaN(value.getTime()),
  promise: (value: any): value is Promise<any> => value instanceof Promise,
  element: (value: any): value is HTMLElement => value instanceof HTMLElement,
  nullish: (value: any): value is null | undefined => value == null
}

/**
 * Performance utilities
 */
export const perf = {
  /**
   * Measure function execution time
   */
  measure<T extends (...args: any[]) => any>(name: string, fn: T): T {
    return ((...args: Parameters<T>) => {
      const start = performance.now()
      const result = fn(...args)
      const end = performance.now()
      console.log(`${name}: ${(end - start).toFixed(2)}ms`)
      return result
    }) as T
  },

  /**
   * Measure async function execution time
   */
  async measureAsync<T extends (...args: any[]) => Promise<any>>(name: string, fn: T): Promise<Awaited<ReturnType<T>>> {
    const start = performance.now()
    const result = await fn()
    const end = performance.now()
    console.log(`${name}: ${(end - start).toFixed(2)}ms`)
    return result
  },

  /**
   * Get memory usage (Chrome only)
   */
  getMemoryUsage(): { used: number; total: number } | null {
    if ('memory' in performance) {
      const memory = (performance as any).memory
      return {
        used: Math.round(memory.usedJSHeapSize / 1024 / 1024),
        total: Math.round(memory.totalJSHeapSize / 1024 / 1024)
      }
    }
    return null
  }
} 