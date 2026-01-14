'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'
import { getUserId } from '@/lib/user'

export default function BodaPage() {
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

      const total = (data || []).reduce((sum, item) => sum + parseFloat(item.amount.toString()), 0)
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
          <h1 className="text-4xl font-bold">Boda</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Gestiona tus gastos, presupuestos, cotizaciones y notas de boda
          </p>
        </div>

        <div className="mb-8">
          <div className="p-6 border rounded-lg bg-gray-50 dark:bg-gray-900">
            <h3 className="text-sm text-gray-600 dark:text-gray-400 mb-2">Total Gastos</h3>
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
            href="/boda/expenses"
            className="p-6 border rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <h2 className="text-2xl font-semibold mb-2">Gastos</h2>
            <p className="text-gray-600 dark:text-gray-400">
              Registra y gestiona tus gastos de boda
            </p>
          </Link>

          <Link
            href="/boda/budgets"
            className="p-6 border rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <h2 className="text-2xl font-semibold mb-2">Presupuestos</h2>
            <p className="text-gray-600 dark:text-gray-400">
              Crea y gestiona presupuestos para tu boda
            </p>
          </Link>

          <Link
            href="/boda/quotes"
            className="p-6 border rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <h2 className="text-2xl font-semibold mb-2">Cotizaciones</h2>
            <p className="text-gray-600 dark:text-gray-400">
              Compara cotizaciones de proveedores
            </p>
          </Link>

          <Link
            href="/boda/notes"
            className="p-6 border rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <h2 className="text-2xl font-semibold mb-2">Notas</h2>
            <p className="text-gray-600 dark:text-gray-400">
              Organiza tus notas en carpetas
            </p>
          </Link>
        </div>
      </div>
    </main>
  )
}

