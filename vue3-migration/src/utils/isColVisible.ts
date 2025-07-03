import type { TableColumn } from '../types'

export const isColVisible = (col: TableColumn): boolean => {
  if (col.hasOwnProperty('visible')) {
    return col.visible !== false
  }
  return true
} 