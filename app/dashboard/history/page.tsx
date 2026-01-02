'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'
import { getUserId } from '@/lib/user'
import { format, startOfMonth, endOfMonth, eachMonthOfInterval, subMonths } from 'date-fns'

// Helper function to parse date string as local date (avoids timezone issues)
const parseLocalDate = (dateString: string): Date => {
  const [year, month, day] = dateString.split('-').map(Number)
  return new Date(year, month - 1, day)
}

interface MonthData {
  month: Date
  houseIncome: number
  airbnbIncome: number
  totalIncome: number
  houseExpenses: number
  airbnbExpenses: number
  totalExpenses: number
  cashFlow: number
  accumulatedBalance?: number
  carriedOverFromPrevious?: number
}

export default function DashboardHistoryPage() {
  const [monthlyData, setMonthlyData] = useState<MonthData[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [availableYears, setAvailableYears] = useState<number[]>([new Date().getFullYear()])

  const userId = getUserId()

  useEffect(() => {
    fetchMonthlyData()
  }, [selectedYear])

  const fetchMonthlyData = async () => {
    try {
      // Fetch ALL data (not just selected year) to calculate accumulated balance correctly
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

      const allHouseIncomes = houseIncomesResult.data || []
      const allAirbnbIncomes = airbnbIncomesResult.data || []
      const allHouseExpenses = houseExpensesResult.data || []
      const allAirbnbExpenses = airbnbExpensesResult.data || []

      // Find the earliest and latest dates to determine range
      const allDates = [
        ...allHouseIncomes.map(i => i.date),
        ...allAirbnbIncomes.map(i => i.date),
        ...allHouseExpenses.map(e => e.date),
        ...allAirbnbExpenses.map(e => e.date),
      ]
      
      if (allDates.length === 0) {
        setMonthlyData([])
        return
      }

      const earliestDate = new Date(Math.min(...allDates.map(d => new Date(d).getTime())))
      const latestDate = new Date(Math.max(...allDates.map(d => new Date(d).getTime())))
      
      // Generate array of all months from earliest to latest
      const allMonths = eachMonthOfInterval({
        start: startOfMonth(earliestDate),
        end: endOfMonth(latestDate),
      })

      // Calculate data for all months (chronologically)
      const allMonthsData: MonthData[] = allMonths.map((month) => {
        const monthStart = startOfMonth(month)
        const monthEnd = endOfMonth(month)

        const monthHouseIncome = allHouseIncomes
          .filter((inc) => {
            const incDate = parseLocalDate(inc.date)
            return incDate >= monthStart && incDate <= monthEnd
          })
          .reduce((sum, inc) => sum + inc.amount, 0)

        const monthAirbnbIncome = allAirbnbIncomes
          .filter((inc) => {
            const incDate = parseLocalDate(inc.date)
            return incDate >= monthStart && incDate <= monthEnd
          })
          .reduce((sum, inc) => sum + inc.amount, 0)

        const monthHouseExpenses = allHouseExpenses
          .filter((exp) => {
            const expDate = parseLocalDate(exp.date)
            return expDate >= monthStart && expDate <= monthEnd
          })
          .reduce((sum, exp) => sum + exp.amount, 0)

        const monthAirbnbExpenses = allAirbnbExpenses
          .filter((exp) => {
            const expDate = parseLocalDate(exp.date)
            return expDate >= monthStart && expDate <= monthEnd
          })
          .reduce((sum, exp) => sum + exp.amount, 0)

        const totalIncome = monthHouseIncome + monthAirbnbIncome
        const totalExpenses = monthHouseExpenses + monthAirbnbExpenses
        const cashFlow = totalIncome - totalExpenses

        return {
          month,
          houseIncome: monthHouseIncome,
          airbnbIncome: monthAirbnbIncome,
          totalIncome,
          houseExpenses: monthHouseExpenses,
          airbnbExpenses: monthAirbnbExpenses,
          totalExpenses,
          cashFlow,
        }
      })

      // Calculate accumulated balance and carried over amount for each month
      let accumulatedBalance = 0
      const monthsWithBalance = allMonthsData.map((monthData, index) => {
        const carriedOverFromPrevious = accumulatedBalance // This is the balance at the start of this month
        accumulatedBalance += monthData.cashFlow // This becomes the balance at the end of this month
        return {
          ...monthData,
          accumulatedBalance,
          carriedOverFromPrevious,
        }
      })

      // Filter to only show months with actual data (income or expenses > 0)
      const monthsWithData = monthsWithBalance.filter(
        (monthData) => monthData.totalIncome > 0 || monthData.totalExpenses > 0
      )

      // Calculate available years from all months with data
      const yearsSet = new Set<number>()
      monthsWithData.forEach((monthData) => {
        yearsSet.add(monthData.month.getFullYear())
      })
      const years = Array.from(yearsSet).sort((a, b) => b - a)
      setAvailableYears(years.length > 0 ? years : [new Date().getFullYear()])

      // Filter to selected year
      const selectedYearData = monthsWithData.filter(
        (monthData) => monthData.month.getFullYear() === selectedYear
      )

      // Reverse to show most recent months first
      setMonthlyData(selectedYearData.reverse())
    } catch (error) {
      console.error('Error fetching monthly data:', error)
    } finally {
      setLoading(false)
    }
  }

  const currentYear = new Date().getFullYear()

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
          <Link href="/dashboard" className="text-blue-600 hover:underline mb-4 inline-block">
            ← Back to Dashboard
          </Link>
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-4xl font-bold">Monthly History</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Compare income and expenses across months
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Year</label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className="px-3 py-2 border rounded-lg"
              >
                {availableYears.length > 0 ? (
                  availableYears.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))
                ) : (
                  <option value={currentYear}>{currentYear}</option>
                )}
              </select>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {monthlyData.map((monthData) => (
            <div key={monthData.month.toISOString()} className="p-6 border rounded-lg">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-2xl font-semibold">
                  {format(monthData.month, 'MMMM yyyy')}
                </h2>
                <div className="text-right">
                  <div className={`text-xl font-bold ${monthData.cashFlow >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    ${monthData.cashFlow.toFixed(2)}
                  </div>
                  {monthData.accumulatedBalance !== undefined && (
                    <div className={`text-sm mt-1 ${monthData.accumulatedBalance >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                      End Balance: ${monthData.accumulatedBalance.toFixed(2)}
                    </div>
                  )}
                </div>
              </div>

              {monthData.carriedOverFromPrevious !== undefined && (
                <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Carried over from previous month:
                  </p>
                  <p className={`text-lg font-bold ${monthData.carriedOverFromPrevious >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    ${monthData.carriedOverFromPrevious.toFixed(2)}
                  </p>
                </div>
              )}

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                    Income
                  </h3>
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">House</span>
                      <span className="font-semibold text-green-600 dark:text-green-400">
                        ${monthData.houseIncome.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Airbnb</span>
                      <span className="font-semibold text-green-600 dark:text-green-400">
                        ${monthData.airbnbIncome.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between pt-2 border-t">
                      <span className="font-semibold">Total Income</span>
                      <span className="font-bold text-green-600 dark:text-green-400">
                        ${monthData.totalIncome.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                    Expenses
                  </h3>
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">House</span>
                      <span className="font-semibold text-red-600 dark:text-red-400">
                        ${monthData.houseExpenses.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Airbnb</span>
                      <span className="font-semibold text-red-600 dark:text-red-400">
                        ${monthData.airbnbExpenses.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between pt-2 border-t">
                      <span className="font-semibold">Total Expenses</span>
                      <span className="font-bold text-red-600 dark:text-red-400">
                        ${monthData.totalExpenses.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {monthlyData.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-600 dark:text-gray-400">
              No data available for {selectedYear}
            </p>
          </div>
        )}
      </div>
    </main>
  )
}

