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

interface Budget {
  id: string
  name: string
  created_at: string
  updated_at: string
}

interface BudgetItem {
  id: string
  budget_id: string
  type: 'income' | 'expense'
  amount: number
  description: string
  date: string
}

export default function BudgetPage() {
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [selectedBudget, setSelectedBudget] = useState<Budget | null>(null)
  const [budgetItems, setBudgetItems] = useState<BudgetItem[]>([])
  const [currentBalance, setCurrentBalance] = useState<number>(0)
  const [loading, setLoading] = useState(true)
  const [showNewBudgetForm, setShowNewBudgetForm] = useState(false)
  const [showItemForm, setShowItemForm] = useState(false)
  const [newBudgetName, setNewBudgetName] = useState('')
  const [itemFormData, setItemFormData] = useState({
    type: 'expense' as 'income' | 'expense',
    amount: '',
    description: '',
    date: format(new Date(), 'yyyy-MM-dd'),
  })

  const userId = getUserId()

  useEffect(() => {
    fetchBudgets()
    fetchCurrentBalance()
  }, [])

  useEffect(() => {
    if (selectedBudget) {
      fetchBudgetItems(selectedBudget.id)
    } else {
      setBudgetItems([])
    }
  }, [selectedBudget])

  const fetchCurrentBalance = async () => {
    try {
      const [incomeResult, expensesResult] = await Promise.all([
        supabase
          .from('income')
          .select('amount')
          .eq('user_id', userId),
        supabase
          .from('expenses')
          .select('amount')
          .eq('user_id', userId),
      ])

      if (incomeResult.error) throw incomeResult.error
      if (expensesResult.error) throw expensesResult.error

      const totalIncome = (incomeResult.data || []).reduce((sum, item) => sum + item.amount, 0)
      const totalExpenses = (expensesResult.data || []).reduce((sum, item) => sum + item.amount, 0)
      setCurrentBalance(totalIncome - totalExpenses)
    } catch (error) {
      console.error('Error fetching balance:', error)
    }
  }

  const fetchBudgets = async () => {
    try {
      const { data, error } = await supabase
        .from('budgets')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) throw error
      setBudgets(data || [])
    } catch (error) {
      console.error('Error fetching budgets:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchBudgetItems = async (budgetId: string) => {
    try {
      const { data, error } = await supabase
        .from('budget_items')
        .select('*')
        .eq('budget_id', budgetId)
        .order('date', { ascending: true })

      if (error) throw error
      setBudgetItems(data || [])
    } catch (error) {
      console.error('Error fetching budget items:', error)
    }
  }

  const handleCreateBudget = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newBudgetName.trim()) {
      alert('Please enter a budget name')
      return
    }

    try {
      const { data, error } = await supabase
        .from('budgets')
        .insert({
          user_id: userId,
          name: newBudgetName.trim(),
        })
        .select()
        .single()

      if (error) throw error
      setBudgets([data, ...budgets])
      setSelectedBudget(data)
      setNewBudgetName('')
      setShowNewBudgetForm(false)
    } catch (error) {
      console.error('Error creating budget:', error)
      alert('Error creating budget. Please try again.')
    }
  }

  const handleDeleteBudget = async (id: string) => {
    if (!confirm('Are you sure you want to delete this budget?')) return

    try {
      const { error } = await supabase.from('budgets').delete().eq('id', id)
      if (error) throw error
      setBudgets(budgets.filter((b) => b.id !== id))
      if (selectedBudget?.id === id) {
        setSelectedBudget(null)
        setBudgetItems([])
      }
    } catch (error) {
      console.error('Error deleting budget:', error)
      alert('Error deleting budget. Please try again.')
    }
  }

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedBudget) return
    if (!itemFormData.amount || !itemFormData.description) {
      alert('Please fill in all fields')
      return
    }

    try {
      const { error } = await supabase.from('budget_items').insert({
        budget_id: selectedBudget.id,
        type: itemFormData.type,
        amount: parseFloat(itemFormData.amount),
        description: itemFormData.description,
        date: itemFormData.date,
      })

      if (error) throw error
      fetchBudgetItems(selectedBudget.id)
      setItemFormData({
        type: 'expense',
        amount: '',
        description: '',
        date: format(new Date(), 'yyyy-MM-dd'),
      })
      setShowItemForm(false)
    } catch (error) {
      console.error('Error adding budget item:', error)
      alert('Error adding budget item. Please try again.')
    }
  }

  const handleDeleteItem = async (id: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return
    if (!selectedBudget) return

    try {
      const { error } = await supabase.from('budget_items').delete().eq('id', id)
      if (error) throw error
      fetchBudgetItems(selectedBudget.id)
    } catch (error) {
      console.error('Error deleting budget item:', error)
      alert('Error deleting budget item. Please try again.')
    }
  }

  const budgetIncome = budgetItems
    .filter((item) => item.type === 'income')
    .reduce((sum, item) => sum + item.amount, 0)
  const budgetExpenses = budgetItems
    .filter((item) => item.type === 'expense')
    .reduce((sum, item) => sum + item.amount, 0)
  const projectedBalance = currentBalance + budgetIncome - budgetExpenses

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
          <h1 className="text-4xl font-bold">Budget Planning</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Create budgets and plan future expenses
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Budgets List */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-semibold">Budgets</h2>
              <button
                onClick={() => setShowNewBudgetForm(!showNewBudgetForm)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                {showNewBudgetForm ? 'Cancel' : '+ New Budget'}
              </button>
            </div>

            {showNewBudgetForm && (
              <form onSubmit={handleCreateBudget} className="mb-4 p-4 border rounded-lg">
                <input
                  type="text"
                  value={newBudgetName}
                  onChange={(e) => setNewBudgetName(e.target.value)}
                  placeholder="Budget name (e.g., Q1 2024, Vacation Plan, etc.)"
                  className="w-full px-3 py-2 border rounded-lg mb-2"
                />
                <button
                  type="submit"
                  className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Create Budget
                </button>
              </form>
            )}

            <div className="space-y-2">
              {budgets.length === 0 ? (
                <p className="text-gray-600 dark:text-gray-400">No budgets yet. Create one to get started.</p>
              ) : (
                budgets.map((budget) => (
                  <div
                    key={budget.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      selectedBudget?.id === budget.id
                        ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700'
                        : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                    }`}
                    onClick={() => setSelectedBudget(budget)}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold">{budget.name}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Created: {format(parseLocalDate(budget.created_at.split('T')[0]), 'MMM dd, yyyy')}
                        </p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteBudget(budget.id)
                        }}
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

          {/* Budget Details */}
          <div>
            {selectedBudget ? (
              <>
                <h2 className="text-2xl font-semibold mb-4">{selectedBudget.name}</h2>

                {/* Balance Display */}
                <div className="mb-6 p-4 border rounded-lg bg-gray-50 dark:bg-gray-900">
                  <div className="mb-4">
                    <h3 className="text-sm text-gray-600 dark:text-gray-400 mb-1">Current Balance</h3>
                    <p className={`text-2xl font-bold ${currentBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      ${currentBalance.toFixed(2)}
                    </p>
                  </div>
                  <div className="mb-4">
                    <h3 className="text-sm text-gray-600 dark:text-gray-400 mb-1">Budget Income</h3>
                    <p className="text-xl font-semibold text-green-600">+${budgetIncome.toFixed(2)}</p>
                  </div>
                  <div className="mb-4">
                    <h3 className="text-sm text-gray-600 dark:text-gray-400 mb-1">Budget Expenses</h3>
                    <p className="text-xl font-semibold text-red-600">-${budgetExpenses.toFixed(2)}</p>
                  </div>
                  <div className="pt-4 border-t">
                    <h3 className="text-sm text-gray-600 dark:text-gray-400 mb-1">Projected Balance</h3>
                    <p className={`text-3xl font-bold ${projectedBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      ${projectedBalance.toFixed(2)}
                    </p>
                  </div>
                </div>

                {/* Add Item Button */}
                <div className="mb-4">
                  <button
                    onClick={() => setShowItemForm(!showItemForm)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    {showItemForm ? 'Cancel' : '+ Add Item'}
                  </button>
                </div>

                {/* Add Item Form */}
                {showItemForm && (
                  <form onSubmit={handleAddItem} className="mb-6 p-4 border rounded-lg">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <label className="block text-sm font-medium mb-1">Type</label>
                        <select
                          value={itemFormData.type}
                          onChange={(e) =>
                            setItemFormData({ ...itemFormData, type: e.target.value as 'income' | 'expense' })
                          }
                          className="w-full px-3 py-2 border rounded-lg"
                        >
                          <option value="income">Income</option>
                          <option value="expense">Expense</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Amount</label>
                        <input
                          type="number"
                          step="0.01"
                          required
                          value={itemFormData.amount}
                          onChange={(e) => setItemFormData({ ...itemFormData, amount: e.target.value })}
                          className="w-full px-3 py-2 border rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Date</label>
                        <input
                          type="date"
                          required
                          value={itemFormData.date}
                          onChange={(e) => setItemFormData({ ...itemFormData, date: e.target.value })}
                          className="w-full px-3 py-2 border rounded-lg"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium mb-1">Description</label>
                        <input
                          type="text"
                          required
                          value={itemFormData.description}
                          onChange={(e) => setItemFormData({ ...itemFormData, description: e.target.value })}
                          className="w-full px-3 py-2 border rounded-lg"
                          placeholder="e.g., Monthly salary, Vacation costs, etc."
                        />
                      </div>
                    </div>
                    <button
                      type="submit"
                      className="mt-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                    >
                      Add Item
                    </button>
                  </form>
                )}

                {/* Budget Items List */}
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold">Budget Items</h3>
                  {budgetItems.length === 0 ? (
                    <p className="text-gray-600 dark:text-gray-400">No items yet. Add items to plan your budget.</p>
                  ) : (
                    budgetItems.map((item) => (
                      <div key={item.id} className="p-4 border rounded-lg flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-2">
                            <span
                              className={`px-2 py-1 rounded text-xs font-medium ${
                                item.type === 'income'
                                  ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                                  : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
                              }`}
                            >
                              {item.type.toUpperCase()}
                            </span>
                            <h4 className="font-semibold">{item.description}</h4>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            {format(parseLocalDate(item.date), 'MMM dd, yyyy')}
                          </p>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className={`text-lg font-bold ${item.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                            {item.type === 'income' ? '+' : '-'}${item.amount.toFixed(2)}
                          </span>
                          <button
                            onClick={() => handleDeleteItem(item.id)}
                            className="text-red-600 hover:text-red-800"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </>
            ) : (
              <div className="p-8 border rounded-lg text-center">
                <p className="text-gray-600 dark:text-gray-400">
                  Select a budget from the list to view and edit it, or create a new one.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}

