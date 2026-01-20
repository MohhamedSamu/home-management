'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'
import { getUserId } from '@/lib/user'
import { format } from 'date-fns'

const parseLocalDate = (dateString: string): Date => {
  const [year, month, day] = dateString.split('-').map(Number)
  return new Date(year, month - 1, day)
}

interface Category {
  id: string
  name: string
}

interface Quote {
  id: string
  person_name: string
  contact_info: string | null
  category_id: string | null
  category_name?: string
  concept: string
  price: number
  details: string | null
  created_at: string
}

export default function WeddingQuotesPage() {
  const [quotes, setQuotes] = useState<Quote[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [showCategoryForm, setShowCategoryForm] = useState(false)
  const [showComparison, setShowComparison] = useState(false)
  const [selectedCategoryForComparison, setSelectedCategoryForComparison] = useState<string>('')
  const [newCategoryName, setNewCategoryName] = useState('')
  const [formData, setFormData] = useState({
    person_name: '',
    contact_info: '',
    category_id: '',
    concept: '',
    price: '',
    details: '',
  })

  const userId = getUserId()

  useEffect(() => {
    fetchCategories()
    fetchQuotes()
  }, [])

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('wedding_categories')
        .select('*')
        .eq('user_id', userId)
        .order('name', { ascending: true })

      if (error) throw error
      setCategories(data || [])
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }

  const fetchQuotes = async () => {
    try {
      const { data, error } = await supabase
        .from('wedding_quotes')
        .select(`
          *,
          wedding_categories:category_id (
            id,
            name
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) throw error
      
      const quotesWithCategories = (data || []).map((quote: any) => ({
        ...quote,
        category_name: quote.wedding_categories?.name || 'Sin categoría',
      }))
      
      setQuotes(quotesWithCategories)
    } catch (error) {
      console.error('Error fetching quotes:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newCategoryName.trim()) {
      alert('Por favor ingresa un nombre de categoría')
      return
    }

    try {
      const { error } = await supabase.from('wedding_categories').insert({
        user_id: userId,
        name: newCategoryName.trim(),
      })

      if (error) throw error

      setNewCategoryName('')
      setShowCategoryForm(false)
      fetchCategories()
    } catch (error: any) {
      console.error('Error creating category:', error)
      if (error.code === '23505') {
        alert('Esta categoría ya existe')
      } else {
        alert('Error creando categoría. Por favor intenta de nuevo.')
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const { error } = await supabase.from('wedding_quotes').insert({
        user_id: userId,
        person_name: formData.person_name,
        contact_info: formData.contact_info || null,
        category_id: formData.category_id || null,
        concept: formData.concept,
        price: parseFloat(formData.price),
        details: formData.details || null,
      })

      if (error) throw error

      setFormData({
        person_name: '',
        contact_info: '',
        category_id: '',
        concept: '',
        price: '',
        details: '',
      })
      setShowForm(false)
      fetchQuotes()
    } catch (error) {
      console.error('Error adding quote:', error)
      alert('Error agregando cotización. Por favor intenta de nuevo.')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta cotización?')) return

    try {
      const { error } = await supabase.from('wedding_quotes').delete().eq('id', id)
      if (error) throw error
      fetchQuotes()
    } catch (error) {
      console.error('Error deleting quote:', error)
      alert('Error eliminando cotización. Por favor intenta de nuevo.')
    }
  }

  const quotesByCategory = quotes.reduce((acc, quote) => {
    const categoryId = quote.category_id || 'no-category'
    if (!acc[categoryId]) {
      acc[categoryId] = []
    }
    acc[categoryId].push(quote)
    return acc
  }, {} as Record<string, Quote[]>)

  const comparisonQuotes = selectedCategoryForComparison
    ? quotes.filter((q) => q.category_id === selectedCategoryForComparison)
    : []

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
          <Link href="/wedding" className="text-blue-600 hover:underline mb-4 inline-block">
            ← Back to Wedding
          </Link>
          <h1 className="text-4xl font-bold">Wedding Quotes</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Compare quotes from different vendors by category
          </p>
        </div>

        <div className="mb-4 flex gap-2 flex-wrap">
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            {showForm ? 'Cancel' : '+ Add Quote'}
          </button>
          <button
            onClick={() => setShowCategoryForm(!showCategoryForm)}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            {showCategoryForm ? 'Cancel' : '+ Add Category'}
          </button>
          <button
            onClick={() => setShowComparison(!showComparison)}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            {showComparison ? 'Hide Comparison' : 'Compare Quotes'}
          </button>
        </div>

        {showCategoryForm && (
          <form onSubmit={handleCreateCategory} className="mb-4 p-4 border rounded-lg">
            <div className="flex gap-2">
              <input
                type="text"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="Category name (e.g., Decoración, Regalos, etc.)"
                className="flex-1 px-3 py-2 border rounded-lg"
                required
              />
              <button
                type="submit"
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Add
              </button>
            </div>
          </form>
        )}

        {showComparison && (
          <div className="mb-8 p-4 border rounded-lg bg-purple-50 dark:bg-purple-900/20">
            <h2 className="text-2xl font-semibold mb-4">Compare Quotes by Category</h2>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Select Category</label>
              <select
                value={selectedCategoryForComparison}
                onChange={(e) => setSelectedCategoryForComparison(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="">Select a category</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {selectedCategoryForComparison && comparisonQuotes.length > 0 && (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {comparisonQuotes.map((quote) => (
                  <div key={quote.id} className="p-4 border rounded-lg bg-white dark:bg-gray-800">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold text-lg">{quote.person_name}</h3>
                      <span className="text-xl font-bold text-blue-600">
                        ${Number(quote.price).toFixed(2)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      <strong>Concept:</strong> {quote.concept}
                    </p>
                    {quote.contact_info && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        <strong>Contact:</strong> {quote.contact_info}
                      </p>
                    )}
                    {quote.details && (
                      <div className="mt-2">
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Details:</p>
                        <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                          {quote.details}
                        </p>
                      </div>
                    )}
                    <button
                      onClick={() => handleDelete(quote.id)}
                      className="mt-2 text-red-600 hover:text-red-800 text-sm"
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            )}

            {selectedCategoryForComparison && comparisonQuotes.length === 0 && (
              <p className="text-gray-600 dark:text-gray-400">
                No quotes found for this category.
              </p>
            )}
          </div>
        )}

        {showForm && (
          <form onSubmit={handleSubmit} className="mb-8 p-4 border rounded-lg">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium mb-1">Person/Vendor Name</label>
                <input
                  type="text"
                  required
                  value={formData.person_name}
                  onChange={(e) => setFormData({ ...formData, person_name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="e.g., John Doe, ABC Photography, etc."
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Contact Info</label>
                <input
                  type="text"
                  value={formData.contact_info}
                  onChange={(e) => setFormData({ ...formData, contact_info: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="Phone, email, etc."
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Category</label>
                <select
                  value={formData.category_id}
                  onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="">Sin categoría</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Price</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">Concept</label>
                <input
                  type="text"
                  required
                  value={formData.concept}
                  onChange={(e) => setFormData({ ...formData, concept: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="e.g., Photography package, Venue rental, etc."
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">Details</label>
                <textarea
                  value={formData.details}
                  onChange={(e) => setFormData({ ...formData, details: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  rows={4}
                  placeholder="Details about what they offer (to compare with other quotes)..."
                />
              </div>
            </div>
            <button
              type="submit"
              className="mt-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Add Quote
            </button>
          </form>
        )}

        <div className="space-y-6">
          <h2 className="text-2xl font-semibold mb-4">All Quotes</h2>
          
          {Object.keys(quotesByCategory).length === 0 ? (
            <p className="text-gray-600 dark:text-gray-400">No quotes yet.</p>
          ) : (
            Object.entries(quotesByCategory).map(([categoryId, categoryQuotes]) => {
              const categoryName = categoryQuotes[0]?.category_name || 'Sin categoría'
              return (
                <div key={categoryId} className="mb-6">
                  <h3 className="text-xl font-semibold mb-3">{categoryName}</h3>
                  <div className="space-y-4">
                    {categoryQuotes.map((quote) => (
                      <div key={quote.id} className="p-4 border rounded-lg">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h4 className="font-semibold text-lg">{quote.person_name}</h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {format(parseLocalDate(quote.created_at.split('T')[0]), 'MMM dd, yyyy')}
                            </p>
                          </div>
                          <span className="text-2xl font-bold text-blue-600">
                            ${Number(quote.price).toFixed(2)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                          <strong>Concept:</strong> {quote.concept}
                        </p>
                        {quote.contact_info && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                            <strong>Contact:</strong> {quote.contact_info}
                          </p>
                        )}
                        {quote.details && (
                          <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-800 rounded">
                            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Details:</p>
                            <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                              {quote.details}
                            </p>
                          </div>
                        )}
                        <button
                          onClick={() => handleDelete(quote.id)}
                          className="mt-2 text-red-600 hover:text-red-800"
                        >
                          Delete
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </main>
  )
}



