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

interface Expense {
  id: string
  amount: number
  description: string
  category: string
  is_recurring: boolean
  recurring_day: number | null
  date: string
}

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    amount: '',
    description: '',
    category: 'general',
    is_recurring: false,
    recurring_day: '',
    date: format(new Date(), 'yyyy-MM-dd'),
  })

  const userId = getUserId()

  const categories = ['general', 'bills', 'groceries', 'entertainment', 'transport', 'other']

  useEffect(() => {
    fetchExpenses()
  }, [])

  const fetchExpenses = async () => {
    try {
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
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
      const { error } = await supabase.from('expenses').insert({
        user_id: userId,
        amount: parseFloat(formData.amount),
        description: formData.description,
        category: formData.category,
        is_recurring: formData.is_recurring,
        recurring_day: formData.is_recurring && formData.recurring_day
          ? parseInt(formData.recurring_day)
          : null,
        date: formData.date,
      })

      if (error) throw error

      setFormData({
        amount: '',
        description: '',
        category: 'general',
        is_recurring: false,
        recurring_day: '',
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
    if (!confirm('Are you sure you want to delete this expense?')) return

    try {
      const { error } = await supabase.from('expenses').delete().eq('id', id)
      if (error) throw error
      fetchExpenses()
    } catch (error) {
      console.error('Error deleting expense:', error)
      alert('Error deleting expense. Please try again.')
    }
  }

  const totalMonthlyRecurring = expenses
    .filter((exp) => exp.is_recurring)
    .reduce((sum, exp) => sum + exp.amount, 0)

  const totalThisMonth = expenses
    .filter((exp) => {
      const expenseDate = new Date(exp.date)
      const now = new Date()
      return (
        expenseDate.getMonth() === now.getMonth() &&
        expenseDate.getFullYear() === now.getFullYear()
      )
    })
    .reduce((sum, exp) => sum + exp.amount, 0)

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
          <Link href="/economy" className="text-blue-600 hover:underline mb-4 inline-block">
            ← Back to Economy
          </Link>
          <h1 className="text-4xl font-bold">Expenses</h1>
        </div>

        <div className="grid gap-4 md:grid-cols-2 mb-8">
          <div className="p-4 border rounded-lg">
            <h3 className="text-sm text-gray-600 dark:text-gray-400">Monthly Recurring</h3>
            <p className="text-2xl font-bold">${totalMonthlyRecurring.toFixed(2)}</p>
          </div>
          <div className="p-4 border rounded-lg">
            <h3 className="text-sm text-gray-600 dark:text-gray-400">This Month Total</h3>
            <p className="text-2xl font-bold">${totalThisMonth.toFixed(2)}</p>
          </div>
        </div>

        <div className="mb-4">
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            {showForm ? 'Cancel' : '+ Add Expense'}
          </button>
        </div>

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
                  placeholder="e.g., Rent, Electricity bill, etc."
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.is_recurring}
                    onChange={(e) =>
                      setFormData({ ...formData, is_recurring: e.target.checked })
                    }
                  />
                  <span>Recurring expense (e.g., monthly bills)</span>
                </label>
              </div>
              {formData.is_recurring && (
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Day of month (1-31)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    value={formData.recurring_day}
                    onChange={(e) =>
                      setFormData({ ...formData, recurring_day: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
              )}
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
                    {format(parseLocalDate(expense.date), 'MMM dd, yyyy')} • {expense.category}
                    {expense.is_recurring && (
                      <span className="ml-2 px-2 py-1 bg-blue-100 dark:bg-blue-900 rounded text-xs">
                        Recurring (day {expense.recurring_day})
                      </span>
                    )}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-lg font-bold">${expense.amount.toFixed(2)}</span>
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

