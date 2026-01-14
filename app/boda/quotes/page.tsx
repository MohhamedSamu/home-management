'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'
import { getUserId } from '@/lib/user'
import { format } from 'date-fns'

interface Category {
  id: string
  name: string
}

interface Quote {
  id: string
  person_name: string
  contact_info: string | null
  category_id: string | null
  category?: Category | null
  concept: string
  price: number
  details: string | null
  created_at: string
  updated_at: string
}

export default function WeddingQuotesPage() {
  const [quotes, setQuotes] = useState<Quote[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [selectedCategoryForComparison, setSelectedCategoryForComparison] = useState<string>('')
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

  useEffect(() => {
    if (categories.length > 0 && !formData.category_id) {
      setFormData({ ...formData, category_id: categories[0].id })
    }
  }, [categories])

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('wedding_categories')
        .select('*')
        .eq('user_id', userId)
        .order('name')

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
          category:wedding_categories(*)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) throw error
      setQuotes(data || [])
    } catch (error) {
      console.error('Error fetching quotes:', error)
    } finally {
      setLoading(false)
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
        category_id: categories[0]?.id || '',
        concept: '',
        price: '',
        details: '',
      })
      setShowForm(false)
      fetchQuotes()
    } catch (error) {
      console.error('Error adding quote:', error)
      alert('Error adding quote. Please try again.')
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
      alert('Error deleting quote. Please try again.')
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
    ? quotesByCategory[selectedCategoryForComparison] || []
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
          <Link href="/boda" className="text-blue-600 hover:underline mb-4 inline-block">
            ← Back to Boda
          </Link>
          <h1 className="text-4xl font-bold">Cotizaciones de Boda</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Compara cotizaciones de diferentes proveedores
          </p>
        </div>

        <div className="mb-4">
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            {showForm ? 'Cancelar' : '+ Agregar Cotización'}
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleSubmit} className="mb-8 p-4 border rounded-lg">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium mb-1">Persona/Proveedor</label>
                <input
                  type="text"
                  required
                  value={formData.person_name}
                  onChange={(e) => setFormData({ ...formData, person_name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="Nombre del proveedor"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Información de Contacto</label>
                <input
                  type="text"
                  value={formData.contact_info}
                  onChange={(e) => setFormData({ ...formData, contact_info: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="Teléfono, email, etc."
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Categoría</label>
                <select
                  value={formData.category_id}
                  onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Concepto</label>
                <input
                  type="text"
                  required
                  value={formData.concept}
                  onChange={(e) => setFormData({ ...formData, concept: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="Qué están cotizando"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Precio</label>
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
                <label className="block text-sm font-medium mb-1">Detalles</label>
                <textarea
                  value={formData.details}
                  onChange={(e) => setFormData({ ...formData, details: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  rows={4}
                  placeholder="Detalles de lo que ofrecen..."
                />
              </div>
            </div>
            <button
              type="submit"
              className="mt-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Agregar Cotización
            </button>
          </form>
        )}

        {/* Comparison Section */}
        <div className="mb-8 p-4 border rounded-lg bg-gray-50 dark:bg-gray-900">
          <h2 className="text-2xl font-semibold mb-4">Comparar Cotizaciones</h2>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Selecciona una categoría para comparar</label>
            <select
              value={selectedCategoryForComparison}
              onChange={(e) => setSelectedCategoryForComparison(e.target.value)}
              className="w-full md:w-64 px-3 py-2 border rounded-lg"
            >
              <option value="">Todas las categorías</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {selectedCategoryForComparison && comparisonQuotes.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Proveedor</th>
                    <th className="text-left p-2">Contacto</th>
                    <th className="text-left p-2">Concepto</th>
                    <th className="text-left p-2">Precio</th>
                    <th className="text-left p-2">Detalles</th>
                  </tr>
                </thead>
                <tbody>
                  {comparisonQuotes
                    .sort((a, b) => parseFloat(a.price.toString()) - parseFloat(b.price.toString()))
                    .map((quote) => (
                      <tr key={quote.id} className="border-b">
                        <td className="p-2 font-semibold">{quote.person_name}</td>
                        <td className="p-2 text-sm text-gray-600 dark:text-gray-400">
                          {quote.contact_info || '-'}
                        </td>
                        <td className="p-2">{quote.concept}</td>
                        <td className="p-2 font-bold">${parseFloat(quote.price.toString()).toFixed(2)}</td>
                        <td className="p-2 text-sm text-gray-600 dark:text-gray-400">
                          {quote.details || '-'}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
          {selectedCategoryForComparison && comparisonQuotes.length === 0 && (
            <p className="text-gray-600 dark:text-gray-400">No hay cotizaciones en esta categoría.</p>
          )}
        </div>

        {/* All Quotes List */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold mb-4">Todas las Cotizaciones</h2>
          {quotes.length === 0 ? (
            <p className="text-gray-600 dark:text-gray-400">No hay cotizaciones aún.</p>
          ) : (
            quotes.map((quote) => (
              <div key={quote.id} className="p-4 border rounded-lg">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{quote.person_name}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {quote.contact_info || 'Sin información de contacto'}
                    </p>
                    <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">
                      {quote.category?.name || 'Sin categoría'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold">${parseFloat(quote.price.toString()).toFixed(2)}</p>
                    <button
                      onClick={() => handleDelete(quote.id)}
                      className="mt-2 text-red-600 hover:text-red-800 text-sm"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
                <div className="mt-2">
                  <p className="font-medium">Concepto: {quote.concept}</p>
                  {quote.details && (
                    <p className="mt-2 text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                      {quote.details}
                    </p>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </main>
  )
}

