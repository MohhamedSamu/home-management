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

interface Expense {
  id: string
  amount: number
  description: string
  category_id: string | null
  category?: Category | null
  date: string
}

const DEFAULT_CATEGORIES = [
  'Decoración',
  'Regalos',
  'Luna de Miel',
  'Fiesta',
  'Boda Civil'
]

export default function WeddingExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [showCategoryForm, setShowCategoryForm] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [formData, setFormData] = useState({
    amount: '',
    description: '',
    category_id: '',
    date: format(new Date(), 'yyyy-MM-dd'),
  })

  const userId = getUserId()

  useEffect(() => {
    fetchCategories()
    fetchExpenses()
  }, [])

  useEffect(() => {
    if (categories.length > 0 && !formData.category_id) {
      setFormData((prev) => ({ ...prev, category_id: categories[0].id }))
    }
  }, [categories, formData.category_id])

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('wedding_categories')
        .select('*')
        .eq('user_id', userId)
        .order('name')

      if (error) throw error

      if (!data || data.length === 0) {
        // Create default categories if none exist
        const defaultCats = DEFAULT_CATEGORIES.map(name => ({
          user_id: userId,
          name
        }))
        
        const { data: inserted, error: insertError } = await supabase
          .from('wedding_categories')
          .insert(defaultCats)
          .select()

        if (insertError) throw insertError
        setCategories(inserted || [])
      } else {
        setCategories(data)
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }

  const fetchExpenses = async () => {
    try {
      const { data, error } = await supabase
        .from('wedding_expenses')
        .select(`
          *,
          category:wedding_categories(*)
        `)
        .eq('user_id', userId)
        .order('date', { ascending: false })

      if (error) throw error
      setExpenses(data || [])
    } catch (error) {
      console.error('Error fetching expenses:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const { error } = await supabase.from('wedding_expenses').insert({
        user_id: userId,
        amount: parseFloat(formData.amount),
        description: formData.description,
        category_id: formData.category_id || null,
        date: formData.date,
      })

      if (error) throw error

      setFormData({
        amount: '',
        description: '',
        category_id: categories[0]?.id || '',
        date: format(new Date(), 'yyyy-MM-dd'),
      })
      setShowForm(false)
      fetchExpenses()
    } catch (error) {
      console.error('Error adding expense:', error)
      alert('Error adding expense. Please try again.')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este gasto?')) return

    try {
      const { error } = await supabase.from('wedding_expenses').delete().eq('id', id)
      if (error) throw error
      fetchExpenses()
    } catch (error) {
      console.error('Error deleting expense:', error)
      alert('Error deleting expense. Please try again.')
    }
  }

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newCategoryName.trim()) return

    try {
      const { error } = await supabase.from('wedding_categories').insert({
        user_id: userId,
        name: newCategoryName.trim()
      })

      if (error) throw error

      setNewCategoryName('')
      setShowCategoryForm(false)
      fetchCategories()
    } catch (error) {
      console.error('Error adding category:', error)
      alert('Error adding category. Please try again.')
    }
  }

  const totalExpenses = expenses.reduce((sum, exp) => sum + parseFloat(exp.amount.toString()), 0)

  if (loading) {
    return (
      <main className="min-h-screen p-8">
        <div className="max-w-4xl mx-auto">Loading...</div>
      </main>
    )
  }

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <Link href="/boda" className="text-blue-600 hover:underline mb-4 inline-block">
            ← Back to Boda
          </Link>
          <h1 className="text-4xl font-bold">Gastos de Boda</h1>
        </div>

        <div className="mb-8">
          <div className="p-4 border rounded-lg">
            <h3 className="text-sm text-gray-600 dark:text-gray-400">Total Gastos</h3>
            <p className="text-2xl font-bold">${totalExpenses.toFixed(2)}</p>
          </div>
        </div>

        <div className="mb-4 flex gap-2">
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            {showForm ? 'Cancelar' : '+ Agregar Gasto'}
          </button>
          <button
            onClick={() => setShowCategoryForm(!showCategoryForm)}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            {showCategoryForm ? 'Cancelar' : '+ Agregar Categoría'}
          </button>
        </div>

        {showCategoryForm && (
          <form onSubmit={handleAddCategory} className="mb-8 p-4 border rounded-lg">
            <div className="flex gap-2">
              <input
                type="text"
                required
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                className="flex-1 px-3 py-2 border rounded-lg"
                placeholder="Nombre de la categoría"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Agregar
              </button>
            </div>
          </form>
        )}

        {showForm && (
          <form onSubmit={handleSubmit} className="mb-8 p-4 border rounded-lg">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium mb-1">Monto</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Fecha</label>
                <input
                  type="date"
                  required
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">Descripción</label>
                <input
                  type="text"
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="e.g., Anillos, Vestido, etc."
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
            </div>
            <button
              type="submit"
              className="mt-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Agregar Gasto
            </button>
          </form>
        )}

        <div className="space-y-4">
          <h2 className="text-2xl font-semibold mb-4">Historial de Gastos</h2>
          {expenses.length === 0 ? (
            <p className="text-gray-600 dark:text-gray-400">No hay gastos aún.</p>
          ) : (
            expenses.map((expense) => (
              <div key={expense.id} className="p-4 border rounded-lg flex justify-between items-start">
                <div>
                  <h3 className="font-semibold">{expense.description}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {format(new Date(expense.date), 'MMM dd, yyyy')} • {expense.category?.name || 'Sin categoría'}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-lg font-bold">${parseFloat(expense.amount.toString()).toFixed(2)}</span>
                  <button
                    onClick={() => handleDelete(expense.id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </main>
  )
}

