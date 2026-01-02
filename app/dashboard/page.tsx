'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'
import { getUserId } from '@/lib/user'
import { subMonths, startOfMonth, endOfMonth } from 'date-fns'

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

  // Calculate monthly recurring totals
  const monthlyRecurringHouseIncome = houseIncomes
    .filter((inc) => inc.is_recurring)
    .reduce((sum, inc) => sum + inc.amount, 0)

  // Airbnb income is never recurring, so this is always 0
  const monthlyRecurringAirbnbIncome = 0

  const monthlyRecurringHouseExpenses = houseExpenses
    .filter((exp) => exp.is_recurring)
    .reduce((sum, exp) => sum + exp.amount, 0)

  const monthlyRecurringAirbnbExpenses = airbnbExpenses
    .filter((exp) => exp.is_recurring)
    .reduce((sum, exp) => sum + exp.amount, 0)

  // Calculate this month totals
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

  // Calculate totals
  // Note: Airbnb income is never recurring, so total monthly income only includes house recurring income
  const totalMonthlyIncome = monthlyRecurringHouseIncome
  const totalMonthlyExpenses = monthlyRecurringHouseExpenses + monthlyRecurringAirbnbExpenses
  const totalMonthlyCashFlow = totalMonthlyIncome - totalMonthlyExpenses

  const totalThisMonthIncome = thisMonthHouseIncome + thisMonthAirbnbIncome
  const totalThisMonthExpenses = thisMonthHouseExpenses + thisMonthAirbnbExpenses
  const totalThisMonthCashFlow = totalThisMonthIncome - totalThisMonthExpenses

  // Calculate previous month's ending balance
  const previousMonth = subMonths(now, 1)
  const previousMonthStart = startOfMonth(previousMonth)
  const previousMonthEnd = endOfMonth(previousMonth)

  const previousMonthHouseIncome = houseIncomes
    .filter((inc) => {
      const incomeDate = parseLocalDate(inc.date)
      return incomeDate >= previousMonthStart && incomeDate <= previousMonthEnd
    })
    .reduce((sum, inc) => sum + inc.amount, 0)

  const previousMonthAirbnbIncome = airbnbIncomes
    .filter((inc) => {
      const incomeDate = parseLocalDate(inc.date)
      return incomeDate >= previousMonthStart && incomeDate <= previousMonthEnd
    })
    .reduce((sum, inc) => sum + inc.amount, 0)

  const previousMonthHouseExpenses = houseExpenses
    .filter((exp) => {
      const expenseDate = parseLocalDate(exp.date)
      return expenseDate >= previousMonthStart && expenseDate <= previousMonthEnd
    })
    .reduce((sum, exp) => sum + exp.amount, 0)

  const previousMonthAirbnbExpenses = airbnbExpenses
    .filter((exp) => {
      const expenseDate = parseLocalDate(exp.date)
      return expenseDate >= previousMonthStart && expenseDate <= previousMonthEnd
    })
    .reduce((sum, exp) => sum + exp.amount, 0)

  // Calculate all income and expenses before current month to get accumulated balance
  const currentMonthStart = startOfMonth(now)
  const allIncomeBeforeCurrentMonth = [...houseIncomes, ...airbnbIncomes]
    .filter((item) => {
      const itemDate = parseLocalDate(item.date)
      return itemDate < currentMonthStart
    })
    .reduce((sum, item) => sum + item.amount, 0)

  const allExpensesBeforeCurrentMonth = [...houseExpenses, ...airbnbExpenses]
    .filter((item) => {
      const itemDate = parseLocalDate(item.date)
      return itemDate < currentMonthStart
    })
    .reduce((sum, item) => sum + item.amount, 0)

  const previousMonthEndingBalance = allIncomeBeforeCurrentMonth - allExpensesBeforeCurrentMonth

  // Projected monthly cash flow (planned money for this month)
  // This shows how much money you'll have at the end of the month based on recurring income and expenses
  // Projected = Total Monthly Recurring Income - Total Monthly Recurring Expenses
  const projectedMonthlyCashFlow = totalMonthlyIncome - totalMonthlyExpenses

  // Projected end-of-month balance including previous month's balance
  // This shows the total money you'll have at the end of this month
  // Uses actual cash flow for this month (total income - total expenses), not just recurring
  const projectedEndOfMonthBalance = previousMonthEndingBalance + totalThisMonthCashFlow

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
          <div className="p-6 border rounded-lg bg-green-50 dark:bg-green-900/20">
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
              Total Monthly Income
            </h3>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
              ${totalMonthlyIncome.toFixed(2)}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              House: ${monthlyRecurringHouseIncome.toFixed(2)} (recurring only)
            </p>
            <p className="text-xs text-gray-400 mt-1 italic">
              Airbnb income is not recurring
            </p>
          </div>

          <div className="p-6 border rounded-lg bg-red-50 dark:bg-red-900/20">
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
              Monthly Recurring Expenses
            </h3>
            <p className="text-2xl font-bold text-red-600 dark:text-red-400">
              ${totalMonthlyExpenses.toFixed(2)}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              House: ${monthlyRecurringHouseExpenses.toFixed(2)} | 
              Airbnb: ${monthlyRecurringAirbnbExpenses.toFixed(2)}
            </p>
            <p className="text-xs text-gray-400 mt-1 italic">
              Only recurring expenses (marked as recurring)
            </p>
          </div>

          <div className="p-6 border rounded-lg bg-yellow-50 dark:bg-yellow-900/20">
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
              Projected End-of-Month Balance
            </h3>
            <p className={`text-2xl font-bold ${projectedEndOfMonthBalance >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              ${projectedEndOfMonthBalance.toFixed(2)}
            </p>
            <div className="mt-3 pt-3 border-t border-gray-300 dark:border-gray-700">
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Carried over from previous month:
              </p>
              <p className={`text-lg font-bold ${previousMonthEndingBalance >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                ${previousMonthEndingBalance.toFixed(2)}
              </p>
              <p className="text-xs text-gray-500 mt-2">
                (Total income - Total expenses from all previous months)
              </p>
            </div>
            <p className="text-xs text-gray-500 mt-3">
              + This month cash flow: ${totalThisMonthCashFlow.toFixed(2)}
            </p>
            <p className="text-xs text-gray-400 mt-1 italic">
              (Total income - Total expenses for this month, including all actual transactions)
            </p>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
          <div className="p-6 border rounded-lg bg-orange-50 dark:bg-orange-900/20">
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
              Total Expenses This Month
            </h3>
            <p className="text-2xl font-bold text-red-600 dark:text-red-400">
              ${totalThisMonthExpenses.toFixed(2)}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              House: ${thisMonthHouseExpenses.toFixed(2)} | 
              Airbnb: ${thisMonthAirbnbExpenses.toFixed(2)}
            </p>
            <p className="text-xs text-gray-400 mt-1 italic">
              All expenses (recurring + one-time) this month
            </p>
          </div>

          <div className="p-6 border rounded-lg bg-blue-50 dark:bg-blue-900/20">
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
              This Month Cash Flow
            </h3>
            <p className={`text-2xl font-bold ${totalThisMonthCashFlow >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              ${totalThisMonthCashFlow.toFixed(2)}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Actual cash flow so far this month
            </p>
          </div>

          <div className="p-6 border rounded-lg bg-purple-50 dark:bg-purple-900/20">
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
              Monthly Cash Flow (Recurring)
            </h3>
            <p className={`text-2xl font-bold ${totalMonthlyCashFlow >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              ${totalMonthlyCashFlow.toFixed(2)}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Recurring income - Recurring expenses
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
            href="/economy/income"
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
            href="/economy/expenses"
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

