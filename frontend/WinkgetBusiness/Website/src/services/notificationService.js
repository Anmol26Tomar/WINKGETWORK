export function fetchNotifications() {
  return Promise.resolve([])
}

export function markNotification(id, read) {
  return Promise.resolve({ id, read })
}


