'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'
import { getUserId } from '@/lib/user'

export default function HousePage() {
  const [balance, setBalance] = useState<number>(0)
  const [loading, setLoading] = useState(true)
  const userId = getUserId()

  useEffect(() => {
    fetchBalance()
  }, [])

  const fetchBalance = async () => {
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
      setBalance(totalIncome - totalExpenses)
    } catch (error) {
      console.error('Error fetching balance:', error)
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
          <h1 className="text-4xl font-bold">House</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Manage your income, expenses, and shopping for your house
          </p>
        </div>

        <div className="mb-8">
          <div className="p-6 border rounded-lg bg-gray-50 dark:bg-gray-900">
            <h3 className="text-sm text-gray-600 dark:text-gray-400 mb-2">Current Balance</h3>
            {loading ? (
              <p className="text-2xl font-bold">Loading...</p>
            ) : (
              <p className={`text-4xl font-bold ${balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                ${balance.toFixed(2)}
              </p>
            )}
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Link
            href="/house/income"
            className="p-6 border rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <h2 className="text-2xl font-semibold mb-2">Income</h2>
            <p className="text-gray-600 dark:text-gray-400">
              Track your income entries
            </p>
          </Link>

          <Link
            href="/house/expenses"
            className="p-6 border rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <h2 className="text-2xl font-semibold mb-2">Expenses</h2>
            <p className="text-gray-600 dark:text-gray-400">
              Manage bills and purchases
            </p>
          </Link>

          <Link
            href="/house/budget"
            className="p-6 border rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <h2 className="text-2xl font-semibold mb-2">Budget</h2>
            <p className="text-gray-600 dark:text-gray-400">
              Plan future expenses and budgets
            </p>
          </Link>

          <Link
            href="/house/shopping"
            className="p-6 border rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <h2 className="text-2xl font-semibold mb-2">Shopping</h2>
            <p className="text-gray-600 dark:text-gray-400">
              Unified shopping cart for House and Airbnb
            </p>
          </Link>

          <Link
            href="/house/inventory"
            className="p-6 border rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <h2 className="text-2xl font-semibold mb-2">Inventory</h2>
            <p className="text-gray-600 dark:text-gray-400">
              View all products in your household inventory
            </p>
          </Link>
        </div>
      </div>
    </main>
  )
}

