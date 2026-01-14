import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">House Manager</h1>
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Link 
            href="/dashboard" 
            className="p-6 border rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors bg-blue-50 dark:bg-blue-900/20"
          >
            <h2 className="text-2xl font-semibold mb-2">Dashboard</h2>
            <p className="text-gray-600 dark:text-gray-400">
              Complete overview of all finances and cash flow
            </p>
          </Link>

          <Link 
            href="/economy" 
            className="p-6 border rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <h2 className="text-2xl font-semibold mb-2">Economy</h2>
            <p className="text-gray-600 dark:text-gray-400">
              Manage income, expenses, and supermarket budget
            </p>
          </Link>

          <Link 
            href="/todos" 
            className="p-6 border rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <h2 className="text-2xl font-semibold mb-2">To-Do List</h2>
            <p className="text-gray-600 dark:text-gray-400">
              Tasks and recurring reminders with priority levels
            </p>
          </Link>

          <Link 
            href="/airbnb" 
            className="p-6 border rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <h2 className="text-2xl font-semibold mb-2">Airbnb</h2>
            <p className="text-gray-600 dark:text-gray-400">
              Track expenses and products for your Airbnb
            </p>
          </Link>

          <Link 
            href="/boda" 
            className="p-6 border rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <h2 className="text-2xl font-semibold mb-2">Boda</h2>
            <p className="text-gray-600 dark:text-gray-400">
              Gestiona gastos, presupuestos, cotizaciones y notas de tu boda
            </p>
          </Link>
        </div>
      </div>
    </main>
  )
}

