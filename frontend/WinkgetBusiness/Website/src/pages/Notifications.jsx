import React from 'react'
import { useApp } from '../context/AppContext.jsx'
import NotificationItem from '../components/NotificationItem.jsx'

export default function Notifications() {
  const { state, dispatch } = useApp()

  const toggleRead = n => {
    dispatch({ type: 'TOGGLE_NOTIFICATION_READ', payload: { id: n.id } })
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Notifications</h1>
      <div className="space-y-3">
        {state.notifications.map(n => (
          <NotificationItem key={n.id} notification={n} onToggleRead={toggleRead} />
        ))}
      </div>
    </div>
  )
}


