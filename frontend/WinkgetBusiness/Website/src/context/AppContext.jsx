import React, { createContext, useContext, useMemo, useReducer } from 'react'
import { getCurrentUser } from '../services/authService.js'

const AppContext = createContext(null)

const initialState = {
  auth: {
    isAuthenticated: false,
    vendor: null, // { id, name, email, avatarUrl }
  },
  initialized: false,
  products: [
    {
      id: 'p1',
      name: 'Sample Product A',
      category: 'General',
      price: 199.99,
      stock: 12,
      description: 'A high quality example product',
      image: 'https://via.placeholder.com/300x200',
    },
    {
      id: 'p2',
      name: 'Sample Product B',
      category: 'General',
      price: 79.0,
      stock: 3,
      description: 'Low stock sample item',
      image: 'https://via.placeholder.com/300x200',
    },
  ],
  notifications: [
    {
      id: 'n1',
      title: 'Welcome!',
      message: 'Thanks for joining Vendor Management.',
      timestamp: new Date().toISOString(),
      read: false,
    },
  ],
  orders: [
    {
      id: 'o1',
      customerName: 'John Doe',
      items: [
        { productId: 'p1', name: 'Sample Product A', quantity: 1, price: 199.99 },
      ],
      total: 199.99,
      status: 'Pending',
      createdAt: new Date().toISOString(),
    },
  ],
}

function reducer(state, action) {
  switch (action.type) {
    // Auth
    case 'LOGIN_SUCCESS': {
      return {
        ...state,
        auth: { isAuthenticated: true, vendor: action.payload },
      }
    }
    case 'LOGOUT': {
      return { ...state, auth: { isAuthenticated: false, vendor: null } }
    }
    case 'UPDATE_VENDOR': {
      return { ...state, auth: { ...state.auth, vendor: action.payload } }
    }
    case 'INITIALIZED': {
      return { ...state, initialized: true }
    }

    // Products
    case 'ADD_PRODUCT': {
      return { ...state, products: [action.payload, ...state.products] }
    }
    case 'UPDATE_PRODUCT': {
      return {
        ...state,
        products: state.products.map(p => (p.id === action.payload.id ? action.payload : p)),
      }
    }
    case 'DELETE_PRODUCT': {
      return { ...state, products: state.products.filter(p => p.id !== action.payload) }
    }
    case 'UPDATE_STOCK': {
      const { productId, stock } = action.payload
      return {
        ...state,
        products: state.products.map(p => (p.id === productId ? { ...p, stock } : p)),
      }
    }

    // Notifications
    case 'ADD_NOTIFICATION': {
      return { ...state, notifications: [action.payload, ...state.notifications] }
    }
    case 'TOGGLE_NOTIFICATION_READ': {
      const { id } = action.payload
      return {
        ...state,
        notifications: state.notifications.map(n => (n.id === id ? { ...n, read: !n.read } : n)),
      }
    }

    // Orders
    case 'ADD_ORDER': {
      return { ...state, orders: [action.payload, ...state.orders] }
    }
    case 'UPDATE_ORDER_STATUS': {
      const { id, status } = action.payload
      return {
        ...state,
        orders: state.orders.map(o => (o.id === id ? { ...o, status } : o)),
      }
    }

    default:
      return state
  }
}

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState)

  React.useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const user = await getCurrentUser() // relies on HttpOnly cookie via credentials: 'include'
        if (!cancelled && user) {
          dispatch({ type: 'LOGIN_SUCCESS', payload: user })
        }
      } catch (error) {
        if (!cancelled) {
          dispatch({ type: 'LOGOUT' })
        }
      } finally {
        if (!cancelled) dispatch({ type: 'INITIALIZED' })
      }
    })()
    return () => { cancelled = true }
  }, [])

  const value = useMemo(() => ({ state, dispatch }), [state])

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}


