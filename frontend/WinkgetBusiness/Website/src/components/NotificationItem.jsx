import React from 'react'

export default function NotificationItem({ notification, onToggleRead }) {
  return (
    <div className={`bg-white rounded-lg border p-4 flex items-start justify-between ${notification.read ? 'opacity-70' : ''}`}>
      <div>
        <h4 className="font-semibold">{notification.title}</h4>
        <p className="text-sm text-gray-700">{notification.message}</p>
        <p className="text-xs text-gray-500 mt-1">{new Date(notification.timestamp).toLocaleString()}</p>
      </div>
      <button onClick={() => onToggleRead?.(notification)} className="text-sm px-3 py-1.5 rounded-md border">
        {notification.read ? 'Mark Unread' : 'Mark Read'}
      </button>
    </div>
  )
}


