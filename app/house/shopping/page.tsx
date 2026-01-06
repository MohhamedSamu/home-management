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
type ShoppingMode = 'house' | 'airbnb'

interface HouseProduct {
  id: string
  name: string
  weight: string | null
  brand: string | null
  supermarket: string | null
  last_price: number | null
  last_purchase_date: string | null
  inventory_level: InventoryLevel
}

interface AirbnbProduct {
  id: string
  name: string
  weight: string | null
  brand: string | null
  supplier: string | null
  last_price: number | null
  last_purchase_date: string | null
  inventory_level: InventoryLevel
}

interface HouseCartItem {
  id?: string
  product_id?: string | null
  product_name: string
  weight: string
  brand: string
  price: number
  supermarket: string
}

interface AirbnbCartItem {
  id?: string
  product_id?: string | null
  product_name: string
  weight: string
  brand: string
  price: number
  supplier: string
}

const SUPERMARKETS = ['Walmart', 'Pricesmart', 'Super Selectos', 'Agromercado'] as const

export default function ShoppingPage() {
  const [houseProducts, setHouseProducts] = useState<HouseProduct[]>([])
  const [airbnbProducts, setAirbnbProducts] = useState<AirbnbProduct[]>([])
  const [houseCartItems, setHouseCartItems] = useState<HouseCartItem[]>([])
  const [airbnbCartItems, setAirbnbCartItems] = useState<AirbnbCartItem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedSupermarket, setSelectedSupermarket] = useState<string>('')
  const [showNewProductForm, setShowNewProductForm] = useState(false)
  const [showEmptyCartModal, setShowEmptyCartModal] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<HouseProduct | AirbnbProduct | null>(null)
  const [selectedProductType, setSelectedProductType] = useState<'house' | 'airbnb' | null>(null)
  const [productNameSuggestions, setProductNameSuggestions] = useState<string[]>([])
  const [brandSuggestions, setBrandSuggestions] = useState<string[]>([])
  const [showNameSuggestions, setShowNameSuggestions] = useState(false)
  const [showBrandSuggestions, setShowBrandSuggestions] = useState(false)
  const [newProductData, setNewProductData] = useState({
    mode: 'house' as ShoppingMode,
    name: '',
    weight: '',
    brand: '',
    supermarket: '',
    supplier: '',
    price: '',
  })

  const userId = getUserId()

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedHouseCart = localStorage.getItem('houseCartItems')
    const savedAirbnbCart = localStorage.getItem('airbnbCartItems')
    const savedSupermarket = localStorage.getItem('selectedSupermarket')
    
    if (savedHouseCart) {
      try {
        setHouseCartItems(JSON.parse(savedHouseCart))
      } catch (error) {
        console.error('Error loading house cart from localStorage:', error)
      }
    }
    
    if (savedAirbnbCart) {
      try {
        setAirbnbCartItems(JSON.parse(savedAirbnbCart))
      } catch (error) {
        console.error('Error loading airbnb cart from localStorage:', error)
      }
    }

    if (savedSupermarket) {
      setSelectedSupermarket(savedSupermarket)
    }
    
    fetchProducts()
  }, [])

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('houseCartItems', JSON.stringify(houseCartItems))
  }, [houseCartItems])

  useEffect(() => {
    localStorage.setItem('airbnbCartItems', JSON.stringify(airbnbCartItems))
  }, [airbnbCartItems])

  useEffect(() => {
    if (selectedSupermarket) {
      localStorage.setItem('selectedSupermarket', selectedSupermarket)
    }
  }, [selectedSupermarket])

  const fetchProducts = async () => {
    try {
      const [houseResult, airbnbResult] = await Promise.all([
        supabase
          .from('products')
          .select('*')
          .eq('user_id', userId)
          .order('name', { ascending: true }),
        supabase
          .from('airbnb_products')
          .select('*')
          .eq('user_id', userId)
          .order('name', { ascending: true }),
      ])

      if (houseResult.error) throw houseResult.error
      if (airbnbResult.error) throw airbnbResult.error

      setHouseProducts(houseResult.data || [])
      setAirbnbProducts(airbnbResult.data || [])
    } catch (error) {
      console.error('Error fetching products:', error)
    } finally {
      setLoading(false)
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

  // Combine both product lists for display
  const allProducts = [
    ...houseProducts.map((p) => ({ ...p, productType: 'house' as const })),
    ...airbnbProducts.map((p) => ({ ...p, productType: 'airbnb' as const })),
  ]

  const filteredProducts = allProducts.filter((product) => {
    return product.name.toLowerCase().includes(searchQuery.toLowerCase())
  })

  // Get unique product names and brands for autocomplete
  const uniqueProductNames = Array.from(new Set(houseProducts.map(p => p.name).filter((name): name is string => Boolean(name))))
  const uniqueBrands = Array.from(new Set([
    ...houseProducts.map(p => p.brand).filter((brand): brand is string => Boolean(brand)),
    ...airbnbProducts.map(p => p.brand).filter((brand): brand is string => Boolean(brand))
  ]))

  // Filter suggestions based on input
  useEffect(() => {
    if (newProductData.name.length > 0) {
      const filtered = uniqueProductNames
        .filter(name => name.toLowerCase().includes(newProductData.name.toLowerCase()))
        .slice(0, 5)
      setProductNameSuggestions(filtered)
      setShowNameSuggestions(filtered.length > 0)
    } else {
      setProductNameSuggestions([])
      setShowNameSuggestions(false)
    }
  }, [newProductData.name, uniqueProductNames])

  useEffect(() => {
    if (newProductData.brand.length > 0) {
      const filtered = uniqueBrands
        .filter(brand => brand.toLowerCase().includes(newProductData.brand.toLowerCase()))
        .slice(0, 5)
      setBrandSuggestions(filtered)
      setShowBrandSuggestions(filtered.length > 0)
    } else {
      setBrandSuggestions([])
      setShowBrandSuggestions(false)
    }
  }, [newProductData.brand, uniqueBrands])

  const handleAddToCart = (product: HouseProduct | AirbnbProduct, productType: 'house' | 'airbnb') => {
    setSelectedProduct(product)
    setSelectedProductType(productType)
    if (productType === 'house') {
      const houseProduct = product as HouseProduct
      setNewProductData({
        mode: 'house',
        name: houseProduct.name,
        weight: houseProduct.weight || '',
        brand: houseProduct.brand || '',
        supermarket: selectedSupermarket || houseProduct.supermarket || SUPERMARKETS[0] || '',
        supplier: '',
        price: '',
      })
    } else {
      const airbnbProduct = product as AirbnbProduct
      setNewProductData({
        mode: 'airbnb',
        name: airbnbProduct.name,
        weight: airbnbProduct.weight || '',
        brand: airbnbProduct.brand || '',
        supermarket: '',
        supplier: airbnbProduct.supplier || '',
        price: '',
      })
    }
    setShowNewProductForm(true)
  }

  const handleAddNewProductToCart = () => {
    if (!newProductData.name || !newProductData.price) {
      alert('Please fill in name and price')
      return
    }

    if (newProductData.mode === 'house') {
      const supermarket = selectedSupermarket || newProductData.supermarket
      if (!supermarket) {
        alert('Please select a supermarket')
        return
      }
      const newItem: HouseCartItem = {
        product_name: newProductData.name,
        weight: newProductData.weight,
        brand: newProductData.brand,
        price: parseFloat(newProductData.price),
        supermarket: supermarket,
        product_id: (selectedProductType === 'house' && selectedProduct) ? (selectedProduct as HouseProduct).id : null,
      }
      setHouseCartItems([...houseCartItems, newItem])
    } else {
      if (!newProductData.supplier) {
        alert('Please fill in supplier name')
        return
      }
      const newItem: AirbnbCartItem = {
        product_name: newProductData.name,
        weight: newProductData.weight,
        brand: newProductData.brand,
        price: parseFloat(newProductData.price),
        supplier: newProductData.supplier,
        product_id: (selectedProductType === 'airbnb' && selectedProduct) ? (selectedProduct as AirbnbProduct).id : null,
      }
      setAirbnbCartItems([...airbnbCartItems, newItem])
    }

    setShowNewProductForm(false)
    setSelectedProduct(null)
    setSelectedProductType(null)
    setShowNameSuggestions(false)
    setShowBrandSuggestions(false)
    setNewProductData({
      mode: 'house',
      name: '',
      weight: '',
      brand: '',
      supermarket: selectedSupermarket,
      supplier: '',
      price: '',
    })
  }

  const handleRemoveFromCart = (index: number, mode: ShoppingMode) => {
    if (mode === 'house') {
      setHouseCartItems(houseCartItems.filter((_, i) => i !== index))
    } else {
      setAirbnbCartItems(airbnbCartItems.filter((_, i) => i !== index))
    }
  }

  const handleEmptyCart = () => {
    setShowEmptyCartModal(true)
  }

  const confirmEmptyCart = () => {
    setHouseCartItems([])
    setAirbnbCartItems([])
    setShowEmptyCartModal(false)
  }

  const handleSaveCarts = async () => {
    if (houseCartItems.length === 0 && airbnbCartItems.length === 0) {
      alert('Both carts are empty')
      return
    }

    try {
      // Save House Cart
      if (houseCartItems.length > 0) {
        const houseTotal = houseCartItems.reduce((sum, item) => sum + item.price, 0)
        const cartSupermarket = houseCartItems.length > 0 ? houseCartItems[0].supermarket : 'Unknown'

        // Create house cart
        const { data: houseCart, error: houseCartError } = await supabase
          .from('carts')
          .insert({
            user_id: userId,
            total_amount: houseTotal,
            supermarket: cartSupermarket,
            date: format(new Date(), 'yyyy-MM-dd'),
            is_completed: true,
          })
          .select()
          .single()

        if (houseCartError) throw houseCartError

        // Create house cart items and update products
        for (const item of houseCartItems) {
          await supabase.from('cart_items').insert({
            cart_id: houseCart.id,
            product_id: item.product_id,
            product_name: item.product_name,
            weight: item.weight,
            brand: item.brand,
            price: item.price,
            supermarket: item.supermarket,
          })

          // Update or create product
          if (item.product_id) {
            await supabase
              .from('products')
              .update({
                last_price: item.price,
                last_purchase_date: format(new Date(), 'yyyy-MM-dd'),
                supermarket: item.supermarket,
                brand: item.brand || null,
                weight: item.weight || null,
                inventory_level: 'full',
              })
              .eq('id', item.product_id)
          } else {
            await supabase.from('products').insert({
              user_id: userId,
              name: item.product_name,
              weight: item.weight || null,
              brand: item.brand || null,
              supermarket: item.supermarket,
              last_price: item.price,
              last_purchase_date: format(new Date(), 'yyyy-MM-dd'),
              inventory_level: 'full',
            })
          }
        }

        // Add house expense
        const uniqueSupermarkets = Array.from(new Set(houseCartItems.map(item => item.supermarket).filter((s): s is string => s !== null)))
        const expenseDescription = uniqueSupermarkets.length === 1 
          ? `Groceries - ${uniqueSupermarkets[0]}`
          : `Groceries - ${uniqueSupermarkets.join(', ')}`
        await supabase.from('expenses').insert({
          user_id: userId,
          amount: houseTotal,
          description: expenseDescription,
          category: 'groceries',
          date: format(new Date(), 'yyyy-MM-dd'),
        })
      }

      // Save Airbnb Cart
      if (airbnbCartItems.length > 0) {
        const airbnbTotal = airbnbCartItems.reduce((sum, item) => sum + item.price, 0)
        const cartSupplier = airbnbCartItems.length > 0 ? airbnbCartItems[0].supplier : 'Unknown'
        const uniqueSuppliers = Array.from(new Set(airbnbCartItems.map(item => item.supplier).filter((s): s is string => s !== null)))
        const expenseDescription = uniqueSuppliers.length === 1 
          ? `Supplies - ${uniqueSuppliers[0]}`
          : `Supplies - ${uniqueSuppliers.join(', ')}`

        // Create airbnb cart
        const { data: airbnbCart, error: airbnbCartError } = await supabase
          .from('airbnb_carts')
          .insert({
            user_id: userId,
            total_amount: airbnbTotal,
            supplier: cartSupplier,
            date: format(new Date(), 'yyyy-MM-dd'),
            is_completed: true,
          })
          .select()
          .single()

        if (airbnbCartError) throw airbnbCartError

        // Create airbnb cart items and update products
        for (const item of airbnbCartItems) {
          await supabase.from('airbnb_cart_items').insert({
            cart_id: airbnbCart.id,
            product_id: item.product_id,
            product_name: item.product_name,
            weight: item.weight,
            brand: item.brand,
            price: item.price,
            supplier: item.supplier,
          })

          // Update or create product
          if (item.product_id) {
            await supabase
              .from('airbnb_products')
              .update({
                last_price: item.price,
                last_purchase_date: format(new Date(), 'yyyy-MM-dd'),
                supplier: item.supplier,
                brand: item.brand || null,
                weight: item.weight || null,
                inventory_level: 'full',
              })
              .eq('id', item.product_id)
          } else {
            await supabase.from('airbnb_products').insert({
              user_id: userId,
              name: item.product_name,
              weight: item.weight || null,
              brand: item.brand || null,
              supplier: item.supplier,
              last_price: item.price,
              last_purchase_date: format(new Date(), 'yyyy-MM-dd'),
              inventory_level: 'full',
            })
          }
        }

        // Add airbnb expense
        await supabase.from('airbnb_expenses').insert({
          user_id: userId,
          amount: airbnbTotal,
          description: expenseDescription,
          category: 'supplies',
          date: format(new Date(), 'yyyy-MM-dd'),
        })
      }

      setHouseCartItems([])
      setAirbnbCartItems([])
      // Clear localStorage after saving
      localStorage.removeItem('houseCartItems')
      localStorage.removeItem('airbnbCartItems')
      fetchProducts()
      alert('Carts saved successfully!')
    } catch (error) {
      console.error('Error saving carts:', error)
      alert('Error saving carts. Please try again.')
    }
  }

  const houseCartTotal = houseCartItems.reduce((sum, item) => sum + item.price, 0)
  const airbnbCartTotal = airbnbCartItems.reduce((sum, item) => sum + item.price, 0)
  const combinedTotal = houseCartTotal + airbnbCartTotal

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
          <h1 className="text-4xl font-bold">Shopping Cart</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Manage shopping for both House and Airbnb
          </p>
        </div>

        {/* General Supermarket Selector */}
        <div className="mb-6 p-4 border rounded-lg bg-gray-50 dark:bg-gray-900">
          <label className="block text-sm font-medium mb-2">Select Supermarket (for all House products)</label>
          <select
            value={selectedSupermarket}
            onChange={(e) => {
              setSelectedSupermarket(e.target.value)
              // Update supermarket in form if it's open and mode is house
              if (showNewProductForm && newProductData.mode === 'house') {
                setNewProductData({ ...newProductData, supermarket: e.target.value })
              }
            }}
            className="w-full md:w-64 px-3 py-2 border rounded-lg"
          >
            <option value="">Select supermarket...</option>
            {SUPERMARKETS.map((supermarket) => (
              <option key={supermarket} value={supermarket}>
                {supermarket}
              </option>
            ))}
          </select>
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
                filteredProducts.map((product) => {
                  const productType = product.productType
                  const isHouse = productType === 'house'
                  const houseProduct = isHouse ? product as HouseProduct & { productType: 'house' } : null
                  const airbnbProduct = !isHouse ? product as AirbnbProduct & { productType: 'airbnb' } : null
                  
                  return (
                    <div
                      key={product.id}
                      className={`p-4 border rounded-lg ${getInventoryBackgroundColor(product.inventory_level)}`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold">{product.name}</h3>
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              productType === 'house'
                                ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200'
                                : 'bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200'
                            }`}>
                              {productType === 'house' ? 'House' : 'Airbnb'}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {product.brand && `Brand: ${product.brand}`}
                            {product.brand && product.weight && ' • '}
                            {product.weight && `Weight: ${product.weight}`}
                          </p>
                          {product.last_price && (
                            <p className="text-sm font-medium mt-1">
                              Last price: ${product.last_price.toFixed(2)}
                              {isHouse && houseProduct?.supermarket && ` at ${houseProduct.supermarket}`}
                              {!isHouse && airbnbProduct?.supplier && ` at ${airbnbProduct.supplier}`}
                            </p>
                          )}
                          {product.last_purchase_date && (
                            <p className="text-xs text-gray-500">
                              Last bought: {format(parseLocalDate(product.last_purchase_date), 'MMM dd, yyyy')}
                            </p>
                          )}
                        </div>
                        <button
                          onClick={() => handleAddToCart(product, productType)}
                          className="ml-4 px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                        >
                          Add
                        </button>
                      </div>
                    </div>
                  )
                })
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
                    Last price: ${selectedProduct.last_price.toFixed(2)}
                  </p>
                )}
                <div className="space-y-2">
                  <div>
                    <label className="block text-sm font-medium mb-1">Shopping Mode</label>
                    <select
                      value={newProductData.mode}
                      onChange={(e) => {
                        const newMode = e.target.value as ShoppingMode
                        setNewProductData({ 
                          ...newProductData, 
                          mode: newMode,
                          supermarket: newMode === 'house' ? (selectedSupermarket || newProductData.supermarket) : '',
                        })
                      }}
                      className="w-full px-3 py-2 border rounded"
                    >
                      <option value="house">House</option>
                      <option value="airbnb">Airbnb</option>
                    </select>
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Product name"
                      value={newProductData.name}
                      onChange={(e) => setNewProductData({ ...newProductData, name: e.target.value })}
                      onFocus={() => {
                        if (productNameSuggestions.length > 0) {
                          setShowNameSuggestions(true)
                        }
                      }}
                      onBlur={() => {
                        // Delay to allow click on suggestion
                        setTimeout(() => setShowNameSuggestions(false), 200)
                      }}
                      className="w-full px-3 py-2 border rounded"
                    />
                    {showNameSuggestions && productNameSuggestions.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                        {productNameSuggestions.map((suggestion, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => {
                              setNewProductData({ ...newProductData, name: suggestion })
                              setShowNameSuggestions(false)
                            }}
                            className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700"
                          >
                            {suggestion}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <input
                    type="text"
                    placeholder="Weight (optional)"
                    value={newProductData.weight}
                    onChange={(e) => setNewProductData({ ...newProductData, weight: e.target.value })}
                    className="w-full px-3 py-2 border rounded"
                  />
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Brand (optional)"
                      value={newProductData.brand}
                      onChange={(e) => setNewProductData({ ...newProductData, brand: e.target.value })}
                      onFocus={() => {
                        if (brandSuggestions.length > 0) {
                          setShowBrandSuggestions(true)
                        }
                      }}
                      onBlur={() => {
                        // Delay to allow click on suggestion
                        setTimeout(() => setShowBrandSuggestions(false), 200)
                      }}
                      className="w-full px-3 py-2 border rounded"
                    />
                    {showBrandSuggestions && brandSuggestions.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                        {brandSuggestions.map((suggestion, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => {
                              setNewProductData({ ...newProductData, brand: suggestion })
                              setShowBrandSuggestions(false)
                            }}
                            className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700"
                          >
                            {suggestion}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  {newProductData.mode === 'house' ? (
                    <select
                      value={newProductData.supermarket || selectedSupermarket}
                      onChange={(e) => setNewProductData({ ...newProductData, supermarket: e.target.value })}
                      className="w-full px-3 py-2 border rounded"
                    >
                      <option value="">Select supermarket...</option>
                      {SUPERMARKETS.map((supermarket) => (
                        <option key={supermarket} value={supermarket}>
                          {supermarket}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      placeholder="Supplier"
                      value={newProductData.supplier}
                      onChange={(e) => setNewProductData({ ...newProductData, supplier: e.target.value })}
                      className="w-full px-3 py-2 border rounded"
                    />
                  )}
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
                        setSelectedProductType(null)
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
                    mode: 'house',
                    name: searchQuery,
                    weight: '',
                    brand: '',
                    supermarket: selectedSupermarket,
                    supplier: '',
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
            <h2 className="text-2xl font-semibold mb-4">Shopping Carts</h2>
            
            {/* House Cart */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-2">House Cart</h3>
              {houseCartItems.length === 0 ? (
                <p className="text-gray-600 dark:text-gray-400 text-sm">House cart is empty</p>
              ) : (
                <>
                  <div className="space-y-2 mb-2 max-h-64 overflow-y-auto">
                    {houseCartItems.map((item, index) => {
                      const product = houseProducts.find((p) => p.id === item.product_id)
                      const priceComparison =
                        product && product.last_price
                          ? item.price - product.last_price
                          : null

                      return (
                        <div key={index} className="p-3 border rounded-lg bg-gray-50 dark:bg-gray-900">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <h4 className="font-semibold text-sm">{item.product_name}</h4>
                              <p className="text-xs text-gray-600 dark:text-gray-400">
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
                              onClick={() => handleRemoveFromCart(index, 'house')}
                              className="ml-2 text-red-600 hover:text-red-800 text-sm"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                  <div className="pt-2 border-t">
                    <p className="text-sm font-semibold">
                      House Subtotal: <span className="text-lg">${houseCartTotal.toFixed(2)}</span>
                    </p>
                  </div>
                </>
              )}
            </div>

            {/* Airbnb Cart */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-2">Airbnb Cart</h3>
              {airbnbCartItems.length === 0 ? (
                <p className="text-gray-600 dark:text-gray-400 text-sm">Airbnb cart is empty</p>
              ) : (
                <>
                  <div className="space-y-2 mb-2 max-h-64 overflow-y-auto">
                    {airbnbCartItems.map((item, index) => {
                      const product = airbnbProducts.find((p) => p.id === item.product_id)
                      const priceComparison =
                        product && product.last_price
                          ? item.price - product.last_price
                          : null

                      return (
                        <div key={index} className="p-3 border rounded-lg bg-gray-50 dark:bg-gray-900">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <h4 className="font-semibold text-sm">{item.product_name}</h4>
                              <p className="text-xs text-gray-600 dark:text-gray-400">
                                {item.brand && `Brand: ${item.brand}`}
                                {item.brand && item.weight && ' • '}
                                {item.weight && `Weight: ${item.weight}`}
                              </p>
                              <p className="text-sm font-medium mt-1">
                                ${item.price.toFixed(2)} at {item.supplier}
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
                              onClick={() => handleRemoveFromCart(index, 'airbnb')}
                              className="ml-2 text-red-600 hover:text-red-800 text-sm"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                  <div className="pt-2 border-t">
                    <p className="text-sm font-semibold">
                      Airbnb Subtotal: <span className="text-lg">${airbnbCartTotal.toFixed(2)}</span>
                    </p>
                  </div>
                </>
              )}
            </div>

            {/* Combined Total and Save Button */}
            <div className="border-t pt-4 mt-4">
              <div className="flex justify-between items-center mb-4">
                <span className="text-xl font-bold">Combined Total:</span>
                <span className="text-2xl font-bold">${combinedTotal.toFixed(2)}</span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleEmptyCart}
                  disabled={houseCartItems.length === 0 && airbnbCartItems.length === 0}
                  className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  Empty Cart
                </button>
                <button
                  onClick={handleSaveCarts}
                  className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold"
                >
                  Save All Carts & Update Inventory
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Empty Cart Confirmation Modal */}
        {showEmptyCartModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg max-w-md w-full mx-4">
              <h3 className="text-xl font-bold mb-4">Empty Cart?</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Are you sure you want to clear all items from your cart? This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={confirmEmptyCart}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold"
                >
                  Yes, Empty Cart
                </button>
                <button
                  onClick={() => setShowEmptyCartModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-700 font-semibold"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}

