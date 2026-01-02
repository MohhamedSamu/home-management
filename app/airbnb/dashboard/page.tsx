'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'
import { getUserId } from '@/lib/user'

// Helper function to parse date string as local date (avoids timezone issues)
const parseLocalDate = (dateString: string): Date => {
  const [year, month, day] = dateString.split('-').map(Number)
  return new Date(year, month - 1, day)
}

interface Income {
  id: string
  amount: number
  date: string
  is_recurring: boolean
}

interface Expense {
  id: string
  amount: number
  date: string
  is_recurring: boolean
}

export default function AirbnbDashboardPage() {
  const [incomes, setIncomes] = useState<Income[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)

  const userId = getUserId()

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [incomesResult, expensesResult] = await Promise.all([
        supabase
          .from('airbnb_income')
          .select('*')
          .eq('user_id', userId),
        supabase
          .from('airbnb_expenses')
          .select('*')
          .eq('user_id', userId),
      ])

      if (incomesResult.error) throw incomesResult.error
      if (expensesResult.error) throw expensesResult.error

      setIncomes(incomesResult.data || [])
      setExpenses(expensesResult.data || [])
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const now = new Date()
  const currentMonth = now.getMonth()
  const currentYear = now.getFullYear()

  // Calculate this month's income (Airbnb income is never recurring)
  const thisMonthIncome = incomes
    .filter((inc) => {
      const incomeDate = parseLocalDate(inc.date)
      return incomeDate.getMonth() === currentMonth && incomeDate.getFullYear() === currentYear
    })
    .reduce((sum, inc) => sum + inc.amount, 0)

  // Calculate monthly recurring expenses
  const monthlyRecurringExpenses = expenses
    .filter((exp) => exp.is_recurring)
    .reduce((sum, exp) => sum + exp.amount, 0)

  // Calculate this month's expenses
  const thisMonthExpenses = expenses
    .filter((exp) => {
      const expenseDate = parseLocalDate(exp.date)
      return expenseDate.getMonth() === currentMonth && expenseDate.getFullYear() === currentYear
    })
    .reduce((sum, exp) => sum + exp.amount, 0)

  // Calculate cash flow (Airbnb doesn't have recurring income)
  const thisMonthCashFlow = thisMonthIncome - thisMonthExpenses

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
          <Link href="/airbnb" className="text-blue-600 hover:underline mb-4 inline-block">
            ← Back to Airbnb
          </Link>
          <h1 className="text-4xl font-bold">Airbnb Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Overview of your Airbnb finances
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
          <div className="p-6 border rounded-lg bg-green-50 dark:bg-green-900/20">
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
              This Month Income
            </h3>
            <p className="text-3xl font-bold text-green-600 dark:text-green-400">
              ${thisMonthIncome.toFixed(2)}
            </p>
          </div>

          <div className="p-6 border rounded-lg bg-red-50 dark:bg-red-900/20">
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
              Monthly Recurring Expenses
            </h3>
            <p className="text-3xl font-bold text-red-600 dark:text-red-400">
              ${monthlyRecurringExpenses.toFixed(2)}
            </p>
          </div>

          <div className="p-6 border rounded-lg bg-blue-50 dark:bg-blue-900/20">
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
              This Month Cash Flow
            </h3>
            <p className={`text-3xl font-bold ${thisMonthCashFlow >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              ${thisMonthCashFlow.toFixed(2)}
            </p>
          </div>
        </div>

        <div className="mb-8">
          <div className="p-6 border rounded-lg">
            <h2 className="text-xl font-semibold mb-4">This Month Expenses</h2>
            <p className="text-2xl font-bold text-red-600 dark:text-red-400">
              ${thisMonthExpenses.toFixed(2)}
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Link
            href="/airbnb/income"
            className="p-4 border rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <h3 className="text-lg font-semibold mb-2">Manage Income</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Add and manage Airbnb income entries
            </p>
          </Link>

          <Link
            href="/airbnb/expenses"
            className="p-4 border rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <h3 className="text-lg font-semibold mb-2">Manage Expenses</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Add and manage Airbnb expenses
            </p>
          </Link>
        </div>
      </div>
    </main>
  )
}

