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

interface Budget {
  id: string
  name: string
  initial_balance: number
  start_date: string | null
  end_date: string | null
  created_at: string
  updated_at: string
}

interface BudgetItem {
  id: string
  budget_id: string
  type: 'income' | 'expense'
  amount: number
  description: string
  category_id: string | null
  category?: Category | null
  is_real: boolean
  date: string | null
}

export default function WeddingBudgetsPage() {
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [selectedBudget, setSelectedBudget] = useState<Budget | null>(null)
  const [budgetItems, setBudgetItems] = useState<BudgetItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showNewBudgetForm, setShowNewBudgetForm] = useState(false)
  const [showItemForm, setShowItemForm] = useState(false)
  const [newBudgetName, setNewBudgetName] = useState('')
  const [initialBalance, setInitialBalance] = useState('0')
  const [itemFormData, setItemFormData] = useState({
    type: 'expense' as 'income' | 'expense',
    amount: '',
    description: '',
    category_id: '',
    date: format(new Date(), 'yyyy-MM-dd'),
  })

  const userId = getUserId()

  useEffect(() => {
    fetchCategories()
    fetchBudgets()
  }, [])

  useEffect(() => {
    if (categories.length > 0 && !itemFormData.category_id) {
      setItemFormData((prev) => ({ ...prev, category_id: categories[0].id }))
    }
  }, [categories, itemFormData.category_id])

  useEffect(() => {
    if (selectedBudget) {
      fetchBudgetItems(selectedBudget.id)
    } else {
      setBudgetItems([])
    }
  }, [selectedBudget])

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

  const fetchBudgets = async () => {
    try {
      const { data, error } = await supabase
        .from('wedding_budgets')
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
        .from('wedding_budget_items')
        .select(`
          *,
          category:wedding_categories(*)
        `)
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
      alert('Por favor ingresa un nombre para el presupuesto')
      return
    }

    try {
      const { data, error } = await supabase
        .from('wedding_budgets')
        .insert({
          user_id: userId,
          name: newBudgetName.trim(),
          initial_balance: parseFloat(initialBalance) || 0,
        })
        .select()
        .single()

      if (error) throw error
      setBudgets([data, ...budgets])
      setSelectedBudget(data)
      setNewBudgetName('')
      setInitialBalance('0')
      setShowNewBudgetForm(false)
    } catch (error) {
      console.error('Error creating budget:', error)
      alert('Error creating budget. Please try again.')
    }
  }

  const handleDeleteBudget = async (id: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este presupuesto?')) return

    try {
      const { error } = await supabase.from('wedding_budgets').delete().eq('id', id)
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
      alert('Por favor completa todos los campos')
      return
    }

    try {
      const { error } = await supabase.from('wedding_budget_items').insert({
        budget_id: selectedBudget.id,
        type: itemFormData.type,
        amount: parseFloat(itemFormData.amount),
        description: itemFormData.description,
        category_id: itemFormData.category_id || null,
        date: itemFormData.date,
        is_real: false,
      })

      if (error) throw error
      fetchBudgetItems(selectedBudget.id)
      setItemFormData({
        type: 'expense',
        amount: '',
        description: '',
        category_id: categories[0]?.id || '',
        date: format(new Date(), 'yyyy-MM-dd'),
      })
      setShowItemForm(false)
    } catch (error) {
      console.error('Error adding budget item:', error)
      alert('Error adding budget item. Please try again.')
    }
  }

  const handleDeleteItem = async (id: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este item?')) return
    if (!selectedBudget) return

    try {
      const { error } = await supabase.from('wedding_budget_items').delete().eq('id', id)
      if (error) throw error
      fetchBudgetItems(selectedBudget.id)
    } catch (error) {
      console.error('Error deleting budget item:', error)
      alert('Error deleting budget item. Please try again.')
    }
  }

  const budgetIncome = budgetItems
    .filter((item) => item.type === 'income')
    .reduce((sum, item) => sum + parseFloat(item.amount.toString()), 0)
  const budgetExpenses = budgetItems
    .filter((item) => item.type === 'expense')
    .reduce((sum, item) => sum + parseFloat(item.amount.toString()), 0)
  const projectedBalance = (selectedBudget ? parseFloat(selectedBudget.initial_balance.toString()) : 0) + budgetIncome - budgetExpenses

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
          <h1 className="text-4xl font-bold">Presupuestos de Boda</h1>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          <div>
            <div className="mb-4">
              <button
                onClick={() => setShowNewBudgetForm(!showNewBudgetForm)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                {showNewBudgetForm ? 'Cancelar' : '+ Nuevo Presupuesto'}
              </button>
            </div>

            {showNewBudgetForm && (
              <form onSubmit={handleCreateBudget} className="mb-6 p-4 border rounded-lg">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Nombre del Presupuesto</label>
                    <input
                      type="text"
                      required
                      value={newBudgetName}
                      onChange={(e) => setNewBudgetName(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg"
                      placeholder="e.g., Presupuesto General"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Balance Inicial</label>
                    <input
                      type="number"
                      step="0.01"
                      value={initialBalance}
                      onChange={(e) => setInitialBalance(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg"
                      placeholder="0.00"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    Crear Presupuesto
                  </button>
                </div>
              </form>
            )}

            <div className="space-y-2">
              <h2 className="text-xl font-semibold mb-4">Presupuestos</h2>
              {budgets.length === 0 ? (
                <p className="text-gray-600 dark:text-gray-400">No hay presupuestos aún.</p>
              ) : (
                budgets.map((budget) => (
                  <div
                    key={budget.id}
                    onClick={() => setSelectedBudget(budget)}
                    className={`p-4 border rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 ${
                      selectedBudget?.id === budget.id ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-500' : ''
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold">{budget.name}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Balance inicial: ${parseFloat(budget.initial_balance.toString()).toFixed(2)}
                        </p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteBudget(budget.id)
                        }}
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

          <div>
            {selectedBudget ? (
              <>
                <div className="mb-4">
                  <h2 className="text-2xl font-semibold mb-2">{selectedBudget.name}</h2>
                  <div className="p-4 border rounded-lg bg-gray-50 dark:bg-gray-900">
                    <div className="flex justify-between mb-2">
                      <span>Balance Inicial:</span>
                      <span className="font-semibold">${parseFloat(selectedBudget.initial_balance.toString()).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between mb-2">
                      <span>Ingresos:</span>
                      <span className="text-green-600">+${budgetIncome.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between mb-2">
                      <span>Gastos:</span>
                      <span className="text-red-600">-${budgetExpenses.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t">
                      <span className="font-semibold">Balance Proyectado:</span>
                      <span className={`font-bold text-lg ${projectedBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        ${projectedBalance.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mb-4">
                  <button
                    onClick={() => setShowItemForm(!showItemForm)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    {showItemForm ? 'Cancelar' : '+ Agregar Item'}
                  </button>
                </div>

                {showItemForm && (
                  <form onSubmit={handleAddItem} className="mb-6 p-4 border rounded-lg">
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">Tipo</label>
                        <select
                          value={itemFormData.type}
                          onChange={(e) => setItemFormData({ ...itemFormData, type: e.target.value as 'income' | 'expense' })}
                          className="w-full px-3 py-2 border rounded-lg"
                        >
                          <option value="income">Ingreso</option>
                          <option value="expense">Gasto</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Monto</label>
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
                        <label className="block text-sm font-medium mb-1">Descripción</label>
                        <input
                          type="text"
                          required
                          value={itemFormData.description}
                          onChange={(e) => setItemFormData({ ...itemFormData, description: e.target.value })}
                          className="w-full px-3 py-2 border rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Categoría</label>
                        <select
                          value={itemFormData.category_id}
                          onChange={(e) => setItemFormData({ ...itemFormData, category_id: e.target.value })}
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
                        <label className="block text-sm font-medium mb-1">Fecha</label>
                        <input
                          type="date"
                          required
                          value={itemFormData.date}
                          onChange={(e) => setItemFormData({ ...itemFormData, date: e.target.value })}
                          className="w-full px-3 py-2 border rounded-lg"
                        />
                      </div>
                      <button
                        type="submit"
                        className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                      >
                        Agregar Item
                      </button>
                    </div>
                  </form>
                )}

                <div className="space-y-2">
                  <h3 className="text-xl font-semibold mb-4">Items del Presupuesto</h3>
                  {budgetItems.length === 0 ? (
                    <p className="text-gray-600 dark:text-gray-400">No hay items aún.</p>
                  ) : (
                    budgetItems.map((item) => (
                      <div key={item.id} className="p-4 border rounded-lg flex justify-between items-start">
                        <div>
                          <h4 className="font-semibold">{item.description}</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {item.category?.name || 'Sin categoría'} • {item.type === 'income' ? 'Ingreso' : 'Gasto'}
                            {item.date && ` • ${format(new Date(item.date), 'MMM dd, yyyy')}`}
                          </p>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className={`text-lg font-bold ${item.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                            {item.type === 'income' ? '+' : '-'}${parseFloat(item.amount.toString()).toFixed(2)}
                          </span>
                          <button
                            onClick={() => handleDeleteItem(item.id)}
                            className="text-red-600 hover:text-red-800"
                          >
                            Eliminar
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </>
            ) : (
              <div className="p-8 border rounded-lg text-center text-gray-600 dark:text-gray-400">
                Selecciona un presupuesto para ver sus items
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}

