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

export default function InventoryPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterSupermarket, setFilterSupermarket] = useState('')
  const [filterInventoryLevel, setFilterInventoryLevel] = useState<InventoryLevel | ''>('')

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

  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesSupermarket = !filterSupermarket || 
      (product.supermarket && product.supermarket.toLowerCase().includes(filterSupermarket.toLowerCase()))
    const matchesInventoryLevel = !filterInventoryLevel || product.inventory_level === filterInventoryLevel
    return matchesSearch && matchesSupermarket && matchesInventoryLevel
  })

  const uniqueSupermarkets = [...new Set(products.map(p => p.supermarket).filter(Boolean))]

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
          <Link href="/economy" className="text-blue-600 hover:underline mb-4 inline-block">
            ← Back to Economy
          </Link>
          <h1 className="text-4xl font-bold">House Inventory</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            View all products in your household inventory
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3 mb-6">
          <div>
            <label className="block text-sm font-medium mb-1">Search Products</label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by product name..."
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Filter by Supermarket (Optional)</label>
            <input
              type="text"
              value={filterSupermarket}
              onChange={(e) => setFilterSupermarket(e.target.value)}
              placeholder="Filter by supermarket..."
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Filter by Inventory Level</label>
            <select
              value={filterInventoryLevel}
              onChange={(e) => setFilterInventoryLevel(e.target.value as InventoryLevel | '')}
              className="w-full px-3 py-2 border rounded-lg"
            >
              <option value="">All Levels</option>
              <option value="full">Full</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
              <option value="none">None</option>
            </select>
          </div>
        </div>

        <div className="mb-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Total products: {filteredProducts.length}
          </p>
        </div>

        <div className="space-y-2">
          {filteredProducts.length === 0 ? (
            <p className="text-gray-600 dark:text-gray-400">
              {searchQuery || filterSupermarket ? 'No products found' : 'No products in inventory yet.'}
            </p>
          ) : (
            filteredProducts.map((product) => (
              <div
                key={product.id}
                className={`p-4 border rounded-lg ${getInventoryBackgroundColor(product.inventory_level)}`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{product.name}</h3>
                    <div className="mt-2 space-y-1">
                      {product.brand && (
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Brand: {product.brand}
                        </p>
                      )}
                      {product.weight && (
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Weight: {product.weight}
                        </p>
                      )}
                      {product.supermarket && (
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Supermarket: {product.supermarket}
                        </p>
                      )}
                      {product.last_price && (
                        <p className="text-sm font-medium mt-1">
                          Last price: ${product.last_price.toFixed(2)}
                        </p>
                      )}
                      {product.last_purchase_date && (
                        <p className="text-xs text-gray-500">
                          Last bought: {format(parseLocalDate(product.last_purchase_date), 'MMM dd, yyyy')}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="ml-4 flex flex-col gap-2">
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
                        Full
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
                        Med
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
                        Low
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
                        None
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </main>
  )
}

