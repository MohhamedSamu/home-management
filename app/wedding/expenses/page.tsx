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

interface Expense {
  id: string
  amount: number
  description: string
  category_id: string | null
  category_name?: string
  date: string
}

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

  const fetchExpenses = async () => {
    try {
      const { data, error } = await supabase
        .from('wedding_expenses')
        .select(`
          *,
          wedding_categories:category_id (
            id,
            name
          )
        `)
        .eq('user_id', userId)
        .order('date', { ascending: false })

      if (error) throw error
      
      const expensesWithCategories = (data || []).map((exp: any) => ({
        ...exp,
        category_name: exp.wedding_categories?.name || 'Sin categoría',
      }))
      
      setExpenses(expensesWithCategories)
    } catch (error) {
      console.error('Error fetching expenses:', error)
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
        category_id: '',
        date: format(new Date(), 'yyyy-MM-dd'),
      })
      setShowForm(false)
      fetchExpenses()
    } catch (error) {
      console.error('Error adding expense:', error)
      alert('Error agregando gasto. Por favor intenta de nuevo.')
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
      alert('Error eliminando gasto. Por favor intenta de nuevo.')
    }
  }

  const totalExpenses = expenses.reduce((sum, exp) => sum + Number(exp.amount), 0)

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
          <Link href="/wedding" className="text-blue-600 hover:underline mb-4 inline-block">
            ← Back to Wedding
          </Link>
          <h1 className="text-4xl font-bold">Wedding Expenses</h1>
        </div>

        <div className="mb-8">
          <div className="p-4 border rounded-lg">
            <h3 className="text-sm text-gray-600 dark:text-gray-400">Total Expenses</h3>
            <p className="text-2xl font-bold">${totalExpenses.toFixed(2)}</p>
          </div>
        </div>

        <div className="mb-4 flex gap-2">
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            {showForm ? 'Cancel' : '+ Add Expense'}
          </button>
          <button
            onClick={() => setShowCategoryForm(!showCategoryForm)}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            {showCategoryForm ? 'Cancel' : '+ Add Category'}
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

        {showForm && (
          <form onSubmit={handleSubmit} className="mb-8 p-4 border rounded-lg">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium mb-1">Amount</label>
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
                <label className="block text-sm font-medium mb-1">Date</label>
                <input
                  type="date"
                  required
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">Description</label>
                <input
                  type="text"
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="e.g., Venue deposit, Flowers, etc."
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
            </div>
            <button
              type="submit"
              className="mt-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Add Expense
            </button>
          </form>
        )}

        <div className="space-y-4">
          <h2 className="text-2xl font-semibold mb-4">Expense History</h2>
          {expenses.length === 0 ? (
            <p className="text-gray-600 dark:text-gray-400">No expenses yet.</p>
          ) : (
            expenses.map((expense) => (
              <div key={expense.id} className="p-4 border rounded-lg flex justify-between items-start">
                <div>
                  <h3 className="font-semibold">{expense.description}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {format(parseLocalDate(expense.date), 'MMM dd, yyyy')} • {expense.category_name}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-lg font-bold">${Number(expense.amount).toFixed(2)}</span>
                  <button
                    onClick={() => handleDelete(expense.id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    Delete
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



