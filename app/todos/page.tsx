'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'
import { getUserId } from '@/lib/user'
import { format, addDays, addMonths, isSameDay, parseISO } from 'date-fns'

interface Todo {
  id: string
  title: string
  description: string | null
  priority: 'low' | 'mid' | 'high'
  is_recurring: boolean
  recurrence_type: 'daily' | 'weekly' | 'monthly' | 'custom_days' | null
  recurrence_value: number | null
  recurrence_day_of_month: number | null
  due_date: string | null
  completed: boolean
  completed_at: string | null
  last_occurrence_date: string | null
}

export default function TodosPage() {
  const [todos, setTodos] = useState<Todo[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'completed'>('all')
  const [priorityFilter, setPriorityFilter] = useState<'all' | 'high' | 'mid' | 'low'>('all')
  const [recurringFilter, setRecurringFilter] = useState<'all' | 'recurring' | 'non-recurring'>('all')
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'mid' as 'low' | 'mid' | 'high',
    is_recurring: false,
    recurrence_type: 'custom_days' as 'daily' | 'weekly' | 'monthly' | 'custom_days',
    recurrence_value: '',
    recurrence_day_of_month: '',
    due_date: '',
  })

  const userId = getUserId()

  useEffect(() => {
    fetchTodos()
  }, [])

  const fetchTodos = async () => {
    try {
      const { data, error } = await supabase
        .from('todos')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) throw error

      // Process recurring todos to generate next occurrences if needed
      const processedTodos = await processRecurringTodos(data || [])
      setTodos(processedTodos)
    } catch (error) {
      console.error('Error fetching todos:', error)
    } finally {
      setLoading(false)
    }
  }

  const processRecurringTodos = async (todosList: Todo[]) => {
    const today = new Date()
    const updatedTodos: Todo[] = []

    for (const todo of todosList) {
      if (!todo.completed && todo.is_recurring && todo.recurrence_type) {
        let nextDueDate: Date | null = null
        let needsNewOccurrence = false

        if (todo.last_occurrence_date) {
          const lastOccurrence = parseISO(todo.last_occurrence_date)
          
          switch (todo.recurrence_type) {
            case 'daily':
              nextDueDate = addDays(lastOccurrence, 1)
              needsNewOccurrence = today >= lastOccurrence
              break
            case 'weekly':
              nextDueDate = addDays(lastOccurrence, 7)
              needsNewOccurrence = today >= lastOccurrence
              break
            case 'monthly':
              if (todo.recurrence_day_of_month) {
                nextDueDate = new Date(today.getFullYear(), today.getMonth(), todo.recurrence_day_of_month)
                if (nextDueDate < today) {
                  nextDueDate = addMonths(nextDueDate, 1)
                }
                needsNewOccurrence = isSameDay(today, new Date(today.getFullYear(), today.getMonth(), todo.recurrence_day_of_month))
              }
              break
            case 'custom_days':
              if (todo.recurrence_value) {
                nextDueDate = addDays(lastOccurrence, todo.recurrence_value)
                needsNewOccurrence = today >= lastOccurrence
              }
              break
          }
        } else {
          // First occurrence
          needsNewOccurrence = true
          if (todo.recurrence_type === 'monthly' && todo.recurrence_day_of_month) {
            nextDueDate = new Date(today.getFullYear(), today.getMonth(), todo.recurrence_day_of_month)
            if (nextDueDate < today) {
              nextDueDate = addMonths(nextDueDate, 1)
            }
          } else {
            nextDueDate = today
          }
        }

        if (needsNewOccurrence && nextDueDate) {
          todo.due_date = format(nextDueDate, 'yyyy-MM-dd')
        }
      }

      updatedTodos.push(todo)
    }

    return updatedTodos
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const { error } = await supabase.from('todos').insert({
        user_id: userId,
        title: formData.title,
        description: formData.description || null,
        priority: formData.priority,
        is_recurring: formData.is_recurring,
        recurrence_type: formData.is_recurring ? formData.recurrence_type : null,
        recurrence_value: formData.is_recurring && formData.recurrence_type === 'custom_days' && formData.recurrence_value
          ? parseInt(formData.recurrence_value)
          : null,
        recurrence_day_of_month: formData.is_recurring && formData.recurrence_type === 'monthly' && formData.recurrence_day_of_month
          ? parseInt(formData.recurrence_day_of_month)
          : null,
        due_date: formData.due_date || null,
        completed: false,
      })

      if (error) throw error

      setFormData({
        title: '',
        description: '',
        priority: 'mid',
        is_recurring: false,
        recurrence_type: 'custom_days',
        recurrence_value: '',
        recurrence_day_of_month: '',
        due_date: '',
      })
      setShowForm(false)
      fetchTodos()
    } catch (error) {
      console.error('Error adding todo:', error)
      alert('Error adding todo. Please try again.')
    }
  }

  const handleToggleComplete = async (todo: Todo) => {
    try {
      const newCompletedState = !todo.completed
      
      if (newCompletedState && todo.is_recurring) {
        // For recurring todos, mark as completed and create a new occurrence
        const completedDate = todo.due_date ? parseISO(todo.due_date) : new Date()
        
        // Mark current todo as completed
        const { error: updateError } = await supabase
          .from('todos')
          .update({
            completed: true,
            completed_at: new Date().toISOString(),
            last_occurrence_date: format(completedDate, 'yyyy-MM-dd'),
          })
          .eq('id', todo.id)

        if (updateError) throw updateError

        // Create a new occurrence for the next cycle
        if (todo.recurrence_type) {
          let nextDueDate: Date | null = null

          switch (todo.recurrence_type) {
            case 'daily':
              nextDueDate = addDays(completedDate, 1)
              break
            case 'weekly':
              nextDueDate = addDays(completedDate, 7)
              break
            case 'monthly':
              if (todo.recurrence_day_of_month) {
                nextDueDate = new Date(completedDate.getFullYear(), completedDate.getMonth(), todo.recurrence_day_of_month)
                if (nextDueDate <= completedDate) {
                  nextDueDate = addMonths(nextDueDate, 1)
                }
              }
              break
            case 'custom_days':
              if (todo.recurrence_value) {
                nextDueDate = addDays(completedDate, todo.recurrence_value)
              }
              break
          }

          if (nextDueDate) {
            // Create new todo occurrence
            const { error: insertError } = await supabase.from('todos').insert({
              user_id: userId,
              title: todo.title,
              description: todo.description,
              priority: todo.priority,
              is_recurring: true,
              recurrence_type: todo.recurrence_type,
              recurrence_value: todo.recurrence_value,
              recurrence_day_of_month: todo.recurrence_day_of_month,
              due_date: format(nextDueDate, 'yyyy-MM-dd'),
              completed: false,
            })
            
            if (insertError) throw insertError
          }
        }
      } else {
        // For non-recurring todos, just toggle completed status
        const { error } = await supabase
          .from('todos')
          .update({
            completed: newCompletedState,
            completed_at: newCompletedState ? new Date().toISOString() : null,
          })
          .eq('id', todo.id)

        if (error) throw error
      }

      fetchTodos()
    } catch (error) {
      console.error('Error updating todo:', error)
      alert('Error updating todo. Please try again.')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this todo?')) return

    try {
      const { error } = await supabase.from('todos').delete().eq('id', id)
      if (error) throw error
      fetchTodos()
    } catch (error) {
      console.error('Error deleting todo:', error)
      alert('Error deleting todo. Please try again.')
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
      case 'mid':
        return 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200'
      case 'low':
        return 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
      default:
        return 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200'
    }
  }

  const filteredTodos = todos.filter((todo) => {
    // Status filter
    if (statusFilter === 'active' && todo.completed) return false
    if (statusFilter === 'completed' && !todo.completed) return false
    
    // Priority filter
    if (priorityFilter !== 'all' && todo.priority !== priorityFilter) return false
    
    // Recurring filter
    if (recurringFilter === 'recurring' && !todo.is_recurring) return false
    if (recurringFilter === 'non-recurring' && todo.is_recurring) return false
    
    return true
  })

  const sortedTodos = [...filteredTodos].sort((a, b) => {
    // Sort by: completed status, priority, due date
    if (a.completed !== b.completed) return a.completed ? 1 : -1
    
    const priorityOrder = { high: 3, mid: 2, low: 1 }
    if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
      return priorityOrder[b.priority] - priorityOrder[a.priority]
    }
    
    if (a.due_date && b.due_date) {
      return a.due_date.localeCompare(b.due_date)
    }
    return 0
  })

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
          <Link href="/" className="text-blue-600 hover:underline mb-4 inline-block">
            ← Back to Home
          </Link>
          <h1 className="text-4xl font-bold">To-Do List</h1>
        </div>

        <div className="mb-6 space-y-4">
          {/* Status Filters */}
          <div className="flex gap-2 flex-wrap">
            <span className="text-sm font-medium self-center mr-2">Status:</span>
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-sm ${
                statusFilter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setStatusFilter('active')}
              className={`px-3 py-1.5 rounded-lg text-sm ${
                statusFilter === 'active' ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700'
              }`}
            >
              Active
            </button>
            <button
              onClick={() => setStatusFilter('completed')}
              className={`px-3 py-1.5 rounded-lg text-sm ${
                statusFilter === 'completed' ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700'
              }`}
            >
              Completed
            </button>
          </div>

          {/* Priority Filters */}
          <div className="flex gap-2 flex-wrap">
            <span className="text-sm font-medium self-center mr-2">Priority:</span>
            <button
              onClick={() => setPriorityFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-sm ${
                priorityFilter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setPriorityFilter('high')}
              className={`px-3 py-1.5 rounded-lg text-sm ${
                priorityFilter === 'high' ? 'bg-red-600 text-white' : 'bg-gray-200 dark:bg-gray-700'
              }`}
            >
              High
            </button>
            <button
              onClick={() => setPriorityFilter('mid')}
              className={`px-3 py-1.5 rounded-lg text-sm ${
                priorityFilter === 'mid' ? 'bg-yellow-600 text-white' : 'bg-gray-200 dark:bg-gray-700'
              }`}
            >
              Mid
            </button>
            <button
              onClick={() => setPriorityFilter('low')}
              className={`px-3 py-1.5 rounded-lg text-sm ${
                priorityFilter === 'low' ? 'bg-green-600 text-white' : 'bg-gray-200 dark:bg-gray-700'
              }`}
            >
              Low
            </button>
          </div>

          {/* Recurring Filters */}
          <div className="flex gap-2 flex-wrap">
            <span className="text-sm font-medium self-center mr-2">Type:</span>
            <button
              onClick={() => setRecurringFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-sm ${
                recurringFilter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setRecurringFilter('recurring')}
              className={`px-3 py-1.5 rounded-lg text-sm ${
                recurringFilter === 'recurring' ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700'
              }`}
            >
              Recurring
            </button>
            <button
              onClick={() => setRecurringFilter('non-recurring')}
              className={`px-3 py-1.5 rounded-lg text-sm ${
                recurringFilter === 'non-recurring' ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700'
              }`}
            >
              Non-Recurring
            </button>
          </div>

          <div className="flex justify-end">
            <button
              onClick={() => setShowForm(!showForm)}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              {showForm ? 'Cancel' : '+ Add Todo'}
            </button>
          </div>
        </div>

        {showForm && (
          <form onSubmit={handleSubmit} className="mb-8 p-4 border rounded-lg">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Title *</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  rows={3}
                />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium mb-1">Priority</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value as 'low' | 'mid' | 'high' })}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="low">Low</option>
                    <option value="mid">Mid</option>
                    <option value="high">High</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Due Date (optional)</label>
                  <input
                    type="date"
                    value={formData.due_date}
                    onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
              </div>
              <div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.is_recurring}
                    onChange={(e) => setFormData({ ...formData, is_recurring: e.target.checked })}
                  />
                  <span>Recurring task</span>
                </label>
              </div>
              {formData.is_recurring && (
                <div className="pl-6 space-y-4 border-l-2">
                  <div>
                    <label className="block text-sm font-medium mb-1">Recurrence Type</label>
                    <select
                      value={formData.recurrence_type}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          recurrence_type: e.target.value as 'daily' | 'weekly' | 'monthly' | 'custom_days',
                        })
                      }
                      className="w-full px-3 py-2 border rounded-lg"
                    >
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly (specific day)</option>
                      <option value="custom_days">Custom (every N days)</option>
                    </select>
                  </div>
                  {formData.recurrence_type === 'custom_days' && (
                    <div>
                      <label className="block text-sm font-medium mb-1">Every N days (e.g., 5, 15)</label>
                      <input
                        type="number"
                        min="1"
                        value={formData.recurrence_value}
                        onChange={(e) => setFormData({ ...formData, recurrence_value: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg"
                      />
                    </div>
                  )}
                  {formData.recurrence_type === 'monthly' && (
                    <div>
                      <label className="block text-sm font-medium mb-1">Day of month (1-31)</label>
                      <input
                        type="number"
                        min="1"
                        max="31"
                        value={formData.recurrence_day_of_month}
                        onChange={(e) => setFormData({ ...formData, recurrence_day_of_month: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
            <button
              type="submit"
              className="mt-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Add Todo
            </button>
          </form>
        )}

        <div className="space-y-4">
          {sortedTodos.length === 0 ? (
            <p className="text-gray-600 dark:text-gray-400">No todos found.</p>
          ) : (
            sortedTodos.map((todo) => (
              <div
                key={todo.id}
                className={`p-4 border rounded-lg ${
                  todo.completed ? 'opacity-60 bg-gray-50 dark:bg-gray-800' : ''
                }`}
              >
                <div className="flex items-start gap-4">
                  <input
                    type="checkbox"
                    checked={todo.completed}
                    onChange={() => handleToggleComplete(todo)}
                    className="mt-1 w-5 h-5"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className={`font-semibold ${todo.completed ? 'line-through' : ''}`}>
                        {todo.title}
                      </h3>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getPriorityColor(todo.priority)}`}>
                        {todo.priority.toUpperCase()}
                      </span>
                      {todo.is_recurring && (
                        <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 rounded text-xs">
                          Recurring
                        </span>
                      )}
                    </div>
                    {todo.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{todo.description}</p>
                    )}
                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-600 dark:text-gray-400">
                      {todo.due_date && (
                        <span>
                          Due: {format(parseISO(todo.due_date), 'MMM dd, yyyy')}
                        </span>
                      )}
                      {todo.is_recurring && todo.recurrence_type && (
                        <span>
                          {todo.recurrence_type === 'custom_days' && todo.recurrence_value
                            ? `Every ${todo.recurrence_value} days`
                            : todo.recurrence_type === 'monthly' && todo.recurrence_day_of_month
                            ? `Monthly on day ${todo.recurrence_day_of_month}`
                            : `${todo.recurrence_type.charAt(0).toUpperCase() + todo.recurrence_type.slice(1)}`}
                        </span>
                      )}
                      {todo.completed && todo.completed_at && (
                        <span>
                          Completed: {format(parseISO(todo.completed_at), 'MMM dd, yyyy')}
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(todo.id)}
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

