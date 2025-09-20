import React, { useCallback } from 'react'
import { X, CheckCircle, XCircle, AlertTriangle, Info } from 'lucide-react'
import { useApp } from '../contexts/AppContext'
import type { NotificationType } from '../contexts/AppContext'
import Button from './ui/Button'

const ICONS: Record<NotificationType, React.ReactNode> = {
  success: <CheckCircle width={18} height={18} />,
  error: <XCircle width={18} height={18} />,
  warning: <AlertTriangle width={18} height={18} />,
  info: <Info width={18} height={18} />,
}

const NotificationContainer: React.FC = () => {
  const { state, removeNotification } = useApp()

  const resolveClassName = useCallback((type: NotificationType) => {
    switch (type) {
      case 'success':
        return 'toast toast--success'
      case 'error':
        return 'toast toast--error'
      case 'warning':
        return 'toast toast--warning'
      case 'info':
      default:
        return 'toast toast--info'
    }
  }, [])

  if (state.notifications.length === 0) {
    return null
  }

  return (
    <div className="toast-container">
      {state.notifications.map(notification => (
        <div key={notification.id} className={resolveClassName(notification.type)}>
          <span aria-hidden className="btn__icon">{ICONS[notification.type]}</span>
          <div className="toast__content">
            <p className="toast__message">{notification.message}</p>
            <p className="toast__meta">{new Date(notification.timestamp).toLocaleTimeString()}</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => removeNotification(notification.id)}
            aria-label="Dismiss notification"
          >
            <X width={16} height={16} />
          </Button>
        </div>
      ))}
    </div>
  )
}

export default React.memo(NotificationContainer)
