'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'
import { getUserId } from '@/lib/user'
import { startOfMonth } from 'date-fns'

// Helper function to parse date string as local date (avoids timezone issues)
const parseLocalDate = (dateString: string): Date => {
  const [year, month, day] = dateString.split('-').map(Number)
  return new Date(year, month - 1, day)
}

interface HouseIncome {
  id: string
  amount: number
  date: string
  is_recurring: boolean
}

interface AirbnbIncome {
  id: string
  amount: number
  date: string
  is_recurring: boolean
}

interface HouseExpense {
  id: string
  amount: number
  date: string
  is_recurring: boolean
}

interface AirbnbExpense {
  id: string
  amount: number
  date: string
  is_recurring: boolean
}

export default function DashboardPage() {
  const [houseIncomes, setHouseIncomes] = useState<HouseIncome[]>([])
  const [airbnbIncomes, setAirbnbIncomes] = useState<AirbnbIncome[]>([])
  const [houseExpenses, setHouseExpenses] = useState<HouseExpense[]>([])
  const [airbnbExpenses, setAirbnbExpenses] = useState<AirbnbExpense[]>([])
  const [loading, setLoading] = useState(true)

  const userId = getUserId()

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [houseIncomesResult, airbnbIncomesResult, houseExpensesResult, airbnbExpensesResult] = 
        await Promise.all([
          supabase
            .from('income')
            .select('*')
            .eq('user_id', userId),
          supabase
            .from('airbnb_income')
            .select('*')
            .eq('user_id', userId),
          supabase
            .from('expenses')
            .select('*')
            .eq('user_id', userId),
          supabase
            .from('airbnb_expenses')
            .select('*')
            .eq('user_id', userId),
        ])

      if (houseIncomesResult.error) throw houseIncomesResult.error
      if (airbnbIncomesResult.error) throw airbnbIncomesResult.error
      if (houseExpensesResult.error) throw houseExpensesResult.error
      if (airbnbExpensesResult.error) throw airbnbExpensesResult.error

      setHouseIncomes(houseIncomesResult.data || [])
      setAirbnbIncomes(airbnbIncomesResult.data || [])
      setHouseExpenses(houseExpensesResult.data || [])
      setAirbnbExpenses(airbnbExpensesResult.data || [])
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const now = new Date()
  const currentMonth = now.getMonth()
  const currentYear = now.getFullYear()

  // Calculate total balances (all income - all expenses)
  const totalHouseIncome = houseIncomes.reduce((sum, inc) => sum + inc.amount, 0)
  const totalHouseExpenses = houseExpenses.reduce((sum, exp) => sum + exp.amount, 0)
  const totalHouseBalance = totalHouseIncome - totalHouseExpenses

  const totalAirbnbIncome = airbnbIncomes.reduce((sum, inc) => sum + inc.amount, 0)
  const totalAirbnbExpenses = airbnbExpenses.reduce((sum, exp) => sum + exp.amount, 0)
  const totalAirbnbBalance = totalAirbnbIncome - totalAirbnbExpenses

  const totalBalance = totalHouseBalance + totalAirbnbBalance

  // Calculate this month totals for reference
  const thisMonthHouseIncome = houseIncomes
    .filter((inc) => {
      const incomeDate = parseLocalDate(inc.date)
      return incomeDate.getMonth() === currentMonth && incomeDate.getFullYear() === currentYear
    })
    .reduce((sum, inc) => sum + inc.amount, 0)

  const thisMonthAirbnbIncome = airbnbIncomes
    .filter((inc) => {
      const incomeDate = parseLocalDate(inc.date)
      return incomeDate.getMonth() === currentMonth && incomeDate.getFullYear() === currentYear
    })
    .reduce((sum, inc) => sum + inc.amount, 0)

  const thisMonthHouseExpenses = houseExpenses
    .filter((exp) => {
      const expenseDate = parseLocalDate(exp.date)
      return expenseDate.getMonth() === currentMonth && expenseDate.getFullYear() === currentYear
    })
    .reduce((sum, exp) => sum + exp.amount, 0)

  const thisMonthAirbnbExpenses = airbnbExpenses
    .filter((exp) => {
      const expenseDate = parseLocalDate(exp.date)
      return expenseDate.getMonth() === currentMonth && expenseDate.getFullYear() === currentYear
    })
    .reduce((sum, exp) => sum + exp.amount, 0)

  const totalThisMonthIncome = thisMonthHouseIncome + thisMonthAirbnbIncome
  const totalThisMonthExpenses = thisMonthHouseExpenses + thisMonthAirbnbExpenses
  const totalThisMonthCashFlow = totalThisMonthIncome - totalThisMonthExpenses

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
          <Link href="/" className="text-blue-600 hover:underline mb-4 inline-block">
            ← Back to Home
          </Link>
          <h1 className="text-4xl font-bold">General Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Complete overview of all your finances
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
          <div className="p-6 border rounded-lg bg-blue-50 dark:bg-blue-900/20">
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
              Total Balance
            </h3>
            <p className={`text-4xl font-bold ${totalBalance >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              ${totalBalance.toFixed(2)}
            </p>
            <p className="text-xs text-gray-500 mt-2">
              All income - All expenses (House + Airbnb)
            </p>
          </div>

          <div className="p-6 border rounded-lg bg-green-50 dark:bg-green-900/20">
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
              House Balance
            </h3>
            <p className={`text-3xl font-bold ${totalHouseBalance >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              ${totalHouseBalance.toFixed(2)}
            </p>
            <p className="text-xs text-gray-500 mt-2">
              Income: ${totalHouseIncome.toFixed(2)} | Expenses: ${totalHouseExpenses.toFixed(2)}
            </p>
          </div>

          <div className="p-6 border rounded-lg bg-purple-50 dark:bg-purple-900/20">
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
              Airbnb Balance
            </h3>
            <p className={`text-3xl font-bold ${totalAirbnbBalance >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              ${totalAirbnbBalance.toFixed(2)}
            </p>
            <p className="text-xs text-gray-500 mt-2">
              Income: ${totalAirbnbIncome.toFixed(2)} | Expenses: ${totalAirbnbExpenses.toFixed(2)}
            </p>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 mb-8">
          <div className="p-6 border rounded-lg bg-orange-50 dark:bg-orange-900/20">
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
              This Month Income
            </h3>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
              ${totalThisMonthIncome.toFixed(2)}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              House: ${thisMonthHouseIncome.toFixed(2)} | 
              Airbnb: ${thisMonthAirbnbIncome.toFixed(2)}
            </p>
          </div>

          <div className="p-6 border rounded-lg bg-red-50 dark:bg-red-900/20">
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
              This Month Expenses
            </h3>
            <p className="text-2xl font-bold text-red-600 dark:text-red-400">
              ${totalThisMonthExpenses.toFixed(2)}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              House: ${thisMonthHouseExpenses.toFixed(2)} | 
              Airbnb: ${thisMonthAirbnbExpenses.toFixed(2)}
            </p>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 mb-8">
          <div className="p-6 border rounded-lg">
            <h2 className="text-xl font-semibold mb-4">This Month Income</h2>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">House (Salary)</span>
                <span className="font-semibold">${thisMonthHouseIncome.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Airbnb</span>
                <span className="font-semibold">${thisMonthAirbnbIncome.toFixed(2)}</span>
              </div>
              <div className="flex justify-between pt-2 border-t">
                <span className="font-semibold">Total</span>
                <span className="font-bold text-green-600 dark:text-green-400 text-lg">
                  ${totalThisMonthIncome.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          <div className="p-6 border rounded-lg">
            <h2 className="text-xl font-semibold mb-4">This Month Expenses</h2>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">House</span>
                <span className="font-semibold">${thisMonthHouseExpenses.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Airbnb</span>
                <span className="font-semibold">${thisMonthAirbnbExpenses.toFixed(2)}</span>
              </div>
              <div className="flex justify-between pt-2 border-t">
                <span className="font-semibold">Total</span>
                <span className="font-bold text-red-600 dark:text-red-400 text-lg">
                  ${totalThisMonthExpenses.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-8">
          <Link
            href="/dashboard/history"
            className="inline-block px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-semibold"
          >
            View Monthly History →
          </Link>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Link
            href="/house/income"
            className="p-4 border rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <h3 className="text-lg font-semibold mb-2">House Income</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Manage house salary and income
            </p>
          </Link>

          <Link
            href="/airbnb/income"
            className="p-4 border rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <h3 className="text-lg font-semibold mb-2">Airbnb Income</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Manage Airbnb income
            </p>
          </Link>

          <Link
            href="/house/expenses"
            className="p-4 border rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <h3 className="text-lg font-semibold mb-2">House Expenses</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Manage house expenses
            </p>
          </Link>

          <Link
            href="/airbnb/expenses"
            className="p-4 border rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <h3 className="text-lg font-semibold mb-2">Airbnb Expenses</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Manage Airbnb expenses
            </p>
          </Link>
        </div>
      </div>
    </main>
  )
}

