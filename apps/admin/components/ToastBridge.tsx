"use client"
import { useEffect } from 'react'
import { toast } from '@mini/ui'

export function ToastBridge() {
  useEffect(() => {
    const originalAlert = window.alert
    // Replace window.alert with toast; keep console output for debugging
    window.alert = (message?: any) => {
      try {
        const text = typeof message === 'string' ? message : JSON.stringify(message)
        toast.error({ title: 'Уведомление', description: text })
      } catch {
        originalAlert(message)
      }
    }
    return () => { window.alert = originalAlert }
  }, [])
  return null
}

