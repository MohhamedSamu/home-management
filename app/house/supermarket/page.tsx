'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'
import { getUserId } from '@/lib/user'
import { format } from 'date-fns'

// Helper function to parse date string as local date (avoids timezone issues)
const parseLocalDate = (dateString: string): Date => {
  const [year, month, day] = dateString.split('-').map(Number)
  return new Date(year, month - 1, day)
}

type InventoryLevel = 'full' | 'medium' | 'low' | 'none' | null

interface Product {
  id: string
  name: string
  weight: string | null
  brand: string | null
  supermarket: string | null
  last_price: number | null
  last_purchase_date: string | null
  inventory_level: InventoryLevel
}

interface CartItem {
  id?: string
  product_id?: string | null
  product_name: string
  weight: string
  brand: string
  price: number
  supermarket: string
}

interface Cart {
  id: string
  total_amount: number
  supermarket: string
  date: string
  is_completed: boolean
}

export default function SupermarketPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [currentSupermarket, setCurrentSupermarket] = useState('')
  const [showNewProductForm, setShowNewProductForm] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [newProductData, setNewProductData] = useState({
    name: '',
    weight: '',
    brand: '',
    supermarket: '',
    price: '',
  })

  const userId = getUserId()

  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('user_id', userId)
        .order('name', { ascending: true })

      if (error) throw error
      setProducts(data || [])
    } catch (error) {
      console.error('Error fetching products:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateInventoryLevel = async (productId: string, level: InventoryLevel) => {
    try {
      const { error } = await supabase
        .from('products')
        .update({ inventory_level: level })
        .eq('id', productId)

      if (error) throw error
      fetchProducts()
    } catch (error) {
      console.error('Error updating inventory level:', error)
      alert('Error updating inventory level. Please try again.')
    }
  }

  const getInventoryBackgroundColor = (level: InventoryLevel): string => {
    switch (level) {
      case 'full':
        return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
      case 'medium':
        return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
      case 'low':
        return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
      default:
        return 'border-gray-200 dark:border-gray-800'
    }
  }

  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleAddToCart = (product: Product) => {
    setSelectedProduct(product)
    setNewProductData({
      name: product.name,
      weight: product.weight || '',
      brand: product.brand || '',
      supermarket: currentSupermarket || product.supermarket || '',
      price: '', // Let user enter current price
    })
    setShowNewProductForm(true)
  }

  const handleAddNewProductToCart = () => {
    if (!newProductData.name || !newProductData.price || !newProductData.supermarket) {
      alert('Please fill in name, price, and supermarket')
      return
    }

    const newItem: CartItem = {
      product_name: newProductData.name,
      weight: newProductData.weight,
      brand: newProductData.brand,
      price: parseFloat(newProductData.price),
      supermarket: newProductData.supermarket,
      product_id: selectedProduct?.id || null,
    }

    setCartItems([...cartItems, newItem])
    setShowNewProductForm(false)
    setSelectedProduct(null)
    setNewProductData({
      name: '',
      weight: '',
      brand: '',
      supermarket: currentSupermarket || '',
      price: '',
    })
  }

  const handleRemoveFromCart = (index: number) => {
    setCartItems(cartItems.filter((_, i) => i !== index))
  }

  const handleSaveCart = async () => {
    if (cartItems.length === 0) {
      alert('Cart is empty')
      return
    }

    if (!currentSupermarket) {
      alert('Please enter supermarket name')
      return
    }

    const totalAmount = cartItems.reduce((sum, item) => sum + item.price, 0)

    try {
      // Create cart
      const { data: cart, error: cartError } = await supabase
        .from('carts')
        .insert({
          user_id: userId,
          total_amount: totalAmount,
          supermarket: currentSupermarket,
          date: format(new Date(), 'yyyy-MM-dd'),
          is_completed: true,
        })
        .select()
        .single()

      if (cartError) throw cartError

      // Create cart items and update products
      for (const item of cartItems) {
        // Insert cart item
        await supabase.from('cart_items').insert({
          cart_id: cart.id,
          product_id: item.product_id,
          product_name: item.product_name,
          weight: item.weight,
          brand: item.brand,
          price: item.price,
          supermarket: item.supermarket,
        })

        // Update or create product
        if (item.product_id) {
          // Update existing product
          await supabase
            .from('products')
            .update({
              last_price: item.price,
              last_purchase_date: format(new Date(), 'yyyy-MM-dd'),
              supermarket: item.supermarket,
              brand: item.brand || null,
              weight: item.weight || null,
              inventory_level: 'full', // Set to full when purchased
            })
            .eq('id', item.product_id)
        } else {
          // Create new product
          await supabase.from('products').insert({
            user_id: userId,
            name: item.product_name,
            weight: item.weight || null,
            brand: item.brand || null,
            supermarket: item.supermarket,
            last_price: item.price,
            last_purchase_date: format(new Date(), 'yyyy-MM-dd'),
            inventory_level: 'full', // Set to full when purchased
          })
        }
      }

      // Add grocery expense
      await supabase.from('expenses').insert({
        user_id: userId,
        amount: totalAmount,
        description: `Groceries - ${currentSupermarket}`,
        category: 'groceries',
        date: format(new Date(), 'yyyy-MM-dd'),
      })

      setCartItems([])
      setCurrentSupermarket('')
      fetchProducts()
      alert('Cart saved successfully!')
    } catch (error) {
      console.error('Error saving cart:', error)
      alert('Error saving cart. Please try again.')
    }
  }

  const cartTotal = cartItems.reduce((sum, item) => sum + item.price, 0)

  if (loading) {
    return (
      <main className="min-h-screen p-8">
        <div className="max-w-6xl mx-auto">Loading...</div>
      </main>
    )
  }

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <Link href="/house" className="text-blue-600 hover:underline mb-4 inline-block">
            ← Back to House
          </Link>
          <h1 className="text-4xl font-bold">Supermarket Shopping</h1>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Supermarket Name</label>
          <input
            type="text"
            value={currentSupermarket}
            onChange={(e) => setCurrentSupermarket(e.target.value)}
            placeholder="e.g., Walmart, Target, etc."
            className="w-full md:w-64 px-3 py-2 border rounded-lg"
          />
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Product Search Section */}
          <div>
            <h2 className="text-2xl font-semibold mb-4">Search Products</h2>
            <div className="mb-4">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products..."
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>

            <div className="space-y-2 max-h-96 overflow-y-auto">
              {filteredProducts.length === 0 ? (
                <p className="text-gray-600 dark:text-gray-400">
                  {searchQuery ? 'No products found' : 'No products yet. Add items to cart to create products.'}
                </p>
              ) : (
                filteredProducts.map((product) => (
                  <div
                    key={product.id}
                    className={`p-4 border rounded-lg ${getInventoryBackgroundColor(product.inventory_level)}`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-semibold">{product.name}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {product.brand && `Brand: ${product.brand}`}
                          {product.brand && product.weight && ' • '}
                          {product.weight && `Weight: ${product.weight}`}
                        </p>
                        {product.last_price && (
                          <p className="text-sm font-medium mt-1">
                            Last price: ${product.last_price.toFixed(2)}
                            {product.supermarket && ` at ${product.supermarket}`}
                          </p>
                        )}
                        {product.last_purchase_date && (
                          <p className="text-xs text-gray-500">
                            Last bought: {format(parseLocalDate(product.last_purchase_date), 'MMM dd, yyyy')}
                          </p>
                        )}
                      </div>
                      <div className="ml-4 flex flex-col gap-2 items-end">
                        <button
                          onClick={() => handleAddToCart(product)}
                          className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                        >
                          Add
                        </button>
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleUpdateInventoryLevel(product.id, 'full')}
                            className={`px-2 py-1 text-xs rounded ${
                              product.inventory_level === 'full'
                                ? 'bg-green-600 text-white'
                                : 'bg-gray-200 dark:bg-gray-700 hover:bg-green-100 dark:hover:bg-green-900/30'
                            }`}
                            title="Full"
                          >
                            F
                          </button>
                          <button
                            onClick={() => handleUpdateInventoryLevel(product.id, 'medium')}
                            className={`px-2 py-1 text-xs rounded ${
                              product.inventory_level === 'medium'
                                ? 'bg-yellow-600 text-white'
                                : 'bg-gray-200 dark:bg-gray-700 hover:bg-yellow-100 dark:hover:bg-yellow-900/30'
                            }`}
                            title="Medium"
                          >
                            M
                          </button>
                          <button
                            onClick={() => handleUpdateInventoryLevel(product.id, 'low')}
                            className={`px-2 py-1 text-xs rounded ${
                              product.inventory_level === 'low'
                                ? 'bg-red-600 text-white'
                                : 'bg-gray-200 dark:bg-gray-700 hover:bg-red-100 dark:hover:bg-red-900/30'
                            }`}
                            title="Low"
                          >
                            L
                          </button>
                          <button
                            onClick={() => handleUpdateInventoryLevel(product.id, 'none')}
                            className={`px-2 py-1 text-xs rounded ${
                              product.inventory_level === 'none'
                                ? 'bg-gray-600 text-white'
                                : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600'
                            }`}
                            title="None"
                          >
                            N
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* New Product Form */}
            {showNewProductForm && (
              <div className="mt-4 p-4 border rounded-lg">
                <h3 className="font-semibold mb-2">
                  {selectedProduct ? `Add ${selectedProduct.name} to Cart` : 'New Product'}
                </h3>
                {selectedProduct && selectedProduct.last_price && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    Last price: ${selectedProduct.last_price.toFixed(2)} at {selectedProduct.supermarket || 'unknown'}
                  </p>
                )}
                <div className="space-y-2">
                  <input
                    type="text"
                    placeholder="Product name"
                    value={newProductData.name}
                    onChange={(e) => setNewProductData({ ...newProductData, name: e.target.value })}
                    className="w-full px-3 py-2 border rounded"
                  />
                  <input
                    type="text"
                    placeholder="Weight (optional)"
                    value={newProductData.weight}
                    onChange={(e) => setNewProductData({ ...newProductData, weight: e.target.value })}
                    className="w-full px-3 py-2 border rounded"
                  />
                  <input
                    type="text"
                    placeholder="Brand (optional)"
                    value={newProductData.brand}
                    onChange={(e) => setNewProductData({ ...newProductData, brand: e.target.value })}
                    className="w-full px-3 py-2 border rounded"
                  />
                  <input
                    type="text"
                    placeholder="Supermarket"
                    value={newProductData.supermarket}
                    onChange={(e) => setNewProductData({ ...newProductData, supermarket: e.target.value })}
                    className="w-full px-3 py-2 border rounded"
                  />
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Price"
                    value={newProductData.price}
                    onChange={(e) => setNewProductData({ ...newProductData, price: e.target.value })}
                    className="w-full px-3 py-2 border rounded"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleAddNewProductToCart}
                      className="flex-1 px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                    >
                      Add to Cart
                    </button>
                    <button
                      onClick={() => {
                        setShowNewProductForm(false)
                        setSelectedProduct(null)
                      }}
                      className="px-3 py-2 border rounded"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}

            {!showNewProductForm && (
              <button
                onClick={() => {
                  setShowNewProductForm(true)
                  setSelectedProduct(null)
                  setNewProductData({
                    name: searchQuery,
                    weight: '',
                    brand: '',
                    supermarket: currentSupermarket,
                    price: '',
                  })
                }}
                className="mt-4 px-4 py-2 border rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                + Add New Product to Cart
              </button>
            )}
          </div>

          {/* Cart Section */}
          <div>
            <h2 className="text-2xl font-semibold mb-4">Shopping Cart</h2>
            {cartItems.length === 0 ? (
              <p className="text-gray-600 dark:text-gray-400">Cart is empty</p>
            ) : (
              <>
                <div className="space-y-2 mb-4">
                  {cartItems.map((item, index) => {
                    const product = products.find((p) => p.id === item.product_id)
                    const priceComparison =
                      product && product.last_price
                        ? item.price - product.last_price
                        : null

                    return (
                      <div key={index} className="p-4 border rounded-lg">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h3 className="font-semibold">{item.product_name}</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {item.brand && `Brand: ${item.brand}`}
                              {item.brand && item.weight && ' • '}
                              {item.weight && `Weight: ${item.weight}`}
                            </p>
                            <p className="text-sm font-medium mt-1">
                              ${item.price.toFixed(2)} at {item.supermarket}
                            </p>
                            {priceComparison !== null && product && product.last_price !== null && (
                              <p
                                className={`text-xs mt-1 ${
                                  priceComparison > 0 ? 'text-red-600' : 'text-green-600'
                                }`}
                              >
                                {priceComparison > 0 ? '+' : ''}
                                {priceComparison.toFixed(2)} vs last price ({product.last_price.toFixed(2)})
                              </p>
                            )}
                          </div>
                          <button
                            onClick={() => handleRemoveFromCart(index)}
                            className="ml-4 text-red-600 hover:text-red-800"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
                <div className="border-t pt-4">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-xl font-bold">Total:</span>
                    <span className="text-2xl font-bold">${cartTotal.toFixed(2)}</span>
                  </div>
                  <button
                    onClick={handleSaveCart}
                    className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold"
                  >
                    Save Cart & Update Inventory
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}

