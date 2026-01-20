'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'
import { getUserId } from '@/lib/user'

export default function WeddingPage() {
  const [totalExpenses, setTotalExpenses] = useState<number>(0)
  const [loading, setLoading] = useState(true)
  const userId = getUserId()

  useEffect(() => {
    fetchTotalExpenses()
  }, [])

  const fetchTotalExpenses = async () => {
    try {
      const { data, error } = await supabase
        .from('wedding_expenses')
        .select('amount')
        .eq('user_id', userId)

      if (error) throw error
      const total = (data || []).reduce((sum, item) => sum + Number(item.amount), 0)
      setTotalExpenses(total)
    } catch (error) {
      console.error('Error fetching expenses:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <Link href="/" className="text-blue-600 hover:underline mb-4 inline-block">
            ← Back to Home
          </Link>
          <h1 className="text-4xl font-bold">Wedding Planning</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Manage expenses, budgets, quotes, and notes for your wedding
          </p>
        </div>

        <div className="mb-8">
          <div className="p-6 border rounded-lg bg-gray-50 dark:bg-gray-900">
            <h3 className="text-sm text-gray-600 dark:text-gray-400 mb-2">Total Expenses</h3>
            {loading ? (
              <p className="text-2xl font-bold">Loading...</p>
            ) : (
              <p className="text-4xl font-bold text-red-600">
                ${totalExpenses.toFixed(2)}
              </p>
            )}
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Link
            href="/wedding/expenses"
            className="p-6 border rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <h2 className="text-2xl font-semibold mb-2">Expenses</h2>
            <p className="text-gray-600 dark:text-gray-400">
              Track wedding expenses by category
            </p>
          </Link>

          <Link
            href="/wedding/budgets"
            className="p-6 border rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <h2 className="text-2xl font-semibold mb-2">Budgets</h2>
            <p className="text-gray-600 dark:text-gray-400">
              Plan and manage wedding budgets
            </p>
          </Link>

          <Link
            href="/wedding/quotes"
            className="p-6 border rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <h2 className="text-2xl font-semibold mb-2">Quotes</h2>
            <p className="text-gray-600 dark:text-gray-400">
              Compare quotes from different vendors
            </p>
          </Link>

          <Link
            href="/wedding/notes"
            className="p-6 border rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <h2 className="text-2xl font-semibold mb-2">Notes</h2>
            <p className="text-gray-600 dark:text-gray-400">
              Organize notes and ideas in folders
            </p>
          </Link>
        </div>
      </div>
    </main>
  )
}



