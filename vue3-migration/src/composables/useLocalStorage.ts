import { ref } from 'vue'

export function useLocalStorage() {
  const isSupported = typeof window !== 'undefined' && 'localStorage' in window

  const saveToLS = (key: string, data: any) => {
    if (!isSupported) return false
    
    try {
      localStorage.setItem(key, JSON.stringify(data))
      return true
    } catch (error) {
      console.error('Error saving to localStorage:', error)
      return false
    }
  }

  const getFromLS = (key: string) => {
    if (!isSupported) return null
    
    try {
      const item = localStorage.getItem(key)
      return item ? JSON.parse(item) : null
    } catch (error) {
      console.error('Error reading from localStorage:', error)
      return null
    }
  }

  const removeFromLS = (key: string) => {
    if (!isSupported) return false
    
    try {
      localStorage.removeItem(key)
      return true
    } catch (error) {
      console.error('Error removing from localStorage:', error)
      return false
    }
  }

  const clearLS = () => {
    if (!isSupported) return false
    
    try {
      localStorage.clear()
      return true
    } catch (error) {
      console.error('Error clearing localStorage:', error)
      return false
    }
  }

  return {
    isSupported,
    saveToLS,
    getFromLS,
    removeFromLS,
    clearLS
  }
} 