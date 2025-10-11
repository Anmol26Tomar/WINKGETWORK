export function fetchOrders() {
  return Promise.resolve([])
}

export function createOrder(order) {
  return Promise.resolve({ ...order })
}

export function updateOrderStatus(orderId, status) {
  return Promise.resolve({ id: orderId, status })
}


