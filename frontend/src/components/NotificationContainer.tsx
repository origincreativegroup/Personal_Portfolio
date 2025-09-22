import { useNotifications, type Notification } from '../contexts/NotificationContext'
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react'

const notificationIcons = {
  success: CheckCircle2,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info
}

const notificationClasses = {
  success: 'toast--success',
  error: 'toast--error',
  warning: 'toast--warning',
  info: 'toast--info'
}

interface ToastProps {
  notification: Notification
  onClose: (id: string) => void
}

function Toast({ notification, onClose }: ToastProps) {
  const Icon = notificationIcons[notification.type]

  return (
    <div className={`toast ${notificationClasses[notification.type]}`}>
      <Icon className="w-5 h-5 flex-shrink-0" />
      <div className="toast__content">
        <p className="toast__message">{notification.title}</p>
        {notification.message && (
          <p className="toast__meta">{notification.message}</p>
        )}
      </div>
      <button
        onClick={() => onClose(notification.id)}
        className="p-1 hover:bg-black hover:bg-opacity-10 rounded transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}

export default function NotificationContainer() {
  const { notifications, removeNotification } = useNotifications()

  if (notifications.length === 0) return null

  return (
    <div className="toast-container">
      {notifications.map((notification) => (
        <Toast
          key={notification.id}
          notification={notification}
          onClose={removeNotification}
        />
      ))}
    </div>
  )
}