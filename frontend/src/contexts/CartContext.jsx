import { createContext, useContext, useState, useEffect } from 'react'
import { API_BASE_URL } from '../config/api'
import { useAuth } from './AuthContext'

const CartContext = createContext()
const CART_STORAGE_PREFIX = 'cart_user_'
const LEGACY_CART_KEY = 'cart'

const normalizeProductId = (item) => item?.id || item?._id || item?.product || null

const normalizeStock = (value, fallback = 0) => {
  const stock = Number(value)

  if (!Number.isFinite(stock)) {
    return fallback
  }

  return Math.max(0, Math.floor(stock))
}

const normalizeQuantity = (value) => {
  const quantity = Number(value)

  if (!Number.isInteger(quantity) || quantity < 1) {
    return null
  }

  return quantity
}

const hasKnownStock = (item) => item?.stock !== undefined && item?.stock !== null && Number.isFinite(Number(item.stock))

export const useCart = () => {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}

export const CartProvider = ({ children }) => {
  const [items, setItems] = useState([])
  const [isLoaded, setIsLoaded] = useState(false)
  const { user, loading: authLoading } = useAuth()

  const getUserId = () => user?._id || user?.id || null
  const getUserCartKey = () => {
    const userId = getUserId()
    return userId ? `${CART_STORAGE_PREFIX}${userId}` : null
  }


  useEffect(() => {
    if (authLoading) {
      return
    }

    const token = localStorage.getItem('token')


    localStorage.removeItem(LEGACY_CART_KEY)

    if (!token || !user || user.role === 'admin') {
      setItems([])
      setIsLoaded(true)
      return
    }

    const cartKey = getUserCartKey()

    if (!cartKey) {
      setItems([])
      setIsLoaded(true)
      return
    }

    const savedCart = localStorage.getItem(cartKey)
    if (savedCart && savedCart !== 'undefined' && savedCart !== 'null') {
      try {
        const parsedCart = JSON.parse(savedCart)
        if (Array.isArray(parsedCart)) {
          setItems(parsedCart)
        } else {
          setItems([])
        }
      } catch (error) {
        console.error('Error parsing cart data:', error)
        localStorage.removeItem(cartKey)
        setItems([])
      }
    } else {
      setItems([])
    }

    setIsLoaded(true)
  }, [authLoading, user?._id, user?.id, user?.role])


  useEffect(() => {
    if (!isLoaded || authLoading || !user || user.role === 'admin') {
      return
    }

    const token = localStorage.getItem('token')
    if (!token) {
      return
    }

    const cartKey = getUserCartKey()
    if (!cartKey) {
      return
    }

    try {
      localStorage.setItem(cartKey, JSON.stringify(items))
    } catch (error) {
      console.error('Error saving cart to localStorage:', error)
    }
  }, [items, isLoaded, authLoading, user?._id, user?.id, user?.role])

  const addToCart = (product, quantity = 1) => {
    const token = localStorage.getItem('token')

    if (authLoading || !user || !token) {
      return { success: false, reason: 'AUTH_REQUIRED' }
    }

    if (user.role === 'admin') {
      return { success: false, reason: 'ADMIN_FORBIDDEN' }
    }

    if (!product || !product._id) {
      return { success: false, reason: 'INVALID_PRODUCT' }
    }

    if (!Number.isInteger(quantity) || quantity < 1) {
      return { success: false, reason: 'INVALID_QUANTITY' }
    }

    const normalizedQuantity = quantity
    const availableStock = normalizeStock(product.stock)

    if (availableStock < 1) {
      return { success: false, reason: 'OUT_OF_STOCK', availableStock }
    }

    if (normalizedQuantity > availableStock) {
      return { success: false, reason: 'INSUFFICIENT_STOCK', availableStock }
    }

    const existingItem = items.find(item => normalizeProductId(item) === product._id)
    const currentQuantity = existingItem ? normalizeQuantity(existingItem.quantity) || 0 : 0
    const nextQuantity = currentQuantity + normalizedQuantity

    if (nextQuantity > availableStock) {
      return { success: false, reason: 'INSUFFICIENT_STOCK', availableStock }
    }

    if (existingItem) {
      setItems(prevItems =>
        prevItems.map(item =>
          normalizeProductId(item) === product._id
            ? {
                ...item,
                id: product._id,
                name: product.name,
                price: product.price,
                image: product.images && product.images.length > 0 ? product.images[0] : item.image,
                stock: availableStock,
                quantity: nextQuantity
              }
            : item
        )
      )
    } else {
      setItems(prevItems => [...prevItems, { 
        id: product._id,
        name: product.name,
        price: product.price,
        image: product.images && product.images.length > 0 ? product.images[0] : '/uploads/default-product.jpg',
        stock: availableStock,
        quantity: normalizedQuantity
      }])
    }

    return { success: true }
  }

  const removeFromCart = (productId) => {
    setItems(prevItems => prevItems.filter(item => normalizeProductId(item) !== productId))
  }

  const updateQuantity = (productId, quantity) => {
    if (!Number.isInteger(quantity) || quantity < 1) {
      return { success: false, reason: 'INVALID_QUANTITY' }
    }

    const currentItem = items.find(item => normalizeProductId(item) === productId)

    if (!currentItem) {
      return { success: false, reason: 'NOT_FOUND' }
    }

    if (hasKnownStock(currentItem)) {
      const availableStock = normalizeStock(currentItem.stock)

      if (availableStock < 1) {
        return { success: false, reason: 'OUT_OF_STOCK', availableStock }
      }

      if (quantity > availableStock) {
        return { success: false, reason: 'INSUFFICIENT_STOCK', availableStock }
      }
    }

    setItems(prevItems =>
      prevItems.map(item =>
        normalizeProductId(item) === productId
          ? { ...item, quantity }
          : item
      )
    )

    return { success: true }
  }

  const clearCart = () => {
    setItems([])
  }

  const getTotalPrice = () => {
    return items.reduce((total, item) => total + (item.price * item.quantity), 0)
  }

  const getTotalItems = () => {
    return items.reduce((total, item) => total + item.quantity, 0)
  }


  const validateCartItems = async () => {
    if (items.length === 0) return { valid: [], invalid: [], adjusted: [] }
    if (!user || user.role === 'admin') return { valid: [], invalid: [], adjusted: [] }
    
    try {
      const productIds = items.map(item => normalizeProductId(item)).filter(Boolean)
      const response = await fetch(`${API_BASE_URL}/api/products/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ productIds })
      })
      
      const data = await response.json()
      
      if (data.success) {
        const validProducts = data.data.valid || []
        const invalidProducts = data.data.invalid || []
        const invalidProductIds = new Set(invalidProducts.map(id => String(id)))
        const productMap = new Map(validProducts.map(product => [String(product._id), product]))
        const invalidItems = []
        const adjustedItems = []
        
        const syncedItems = items.map(item => {
          const itemId = normalizeProductId(item)
          const product = productMap.get(String(itemId))

          if (!itemId || invalidProductIds.has(String(itemId)) || !product) {
            invalidItems.push({ ...item, id: itemId, reason: 'NOT_AVAILABLE' })
            return item
          }

          const availableStock = normalizeStock(product.stock)
          const syncedItem = {
            ...item,
            id: itemId,
            name: product.name || item.name,
            price: product.price ?? item.price,
            stock: availableStock
          }

          if (availableStock < 1) {
            invalidItems.push({ ...syncedItem, reason: 'OUT_OF_STOCK', availableStock })
            return syncedItem
          }

          const currentQuantity = normalizeQuantity(item.quantity) || 1

          if (currentQuantity > availableStock) {
            const adjustedItem = {
              ...syncedItem,
              quantity: availableStock
            }

            adjustedItems.push({
              ...adjustedItem,
              previousQuantity: currentQuantity,
              availableStock
            })

            return adjustedItem
          }

          if (currentQuantity !== item.quantity) {
            return { ...syncedItem, quantity: currentQuantity }
          }

          return syncedItem
        })

        setItems(syncedItems)
        const validItems = syncedItems.filter(item => {
          const itemId = normalizeProductId(item)
          const product = productMap.get(String(itemId))

          return Boolean(product && normalizeStock(product.stock) > 0)
        })
        
        return { valid: validItems, invalid: invalidItems, adjusted: adjustedItems }
      }
      
      return { valid: items, invalid: [], adjusted: [] }
    } catch (error) {
      console.error('Error validating cart items:', error)
      return { valid: items, invalid: [], adjusted: [] }
    }
  }


  const removeInvalidItems = (invalidIds) => {
    setItems(prevItems => 
      prevItems.filter(item => !invalidIds.includes(normalizeProductId(item)))
    )
  }

  const value = {
    items,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getTotalPrice,
    getTotalItems,
    validateCartItems,
    removeInvalidItems,
  }

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}
