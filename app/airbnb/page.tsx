import Link from 'next/link'

export default function AirbnbPage() {
  return (
    <main className="min-h-screen p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <Link href="/" className="text-blue-600 hover:underline mb-4 inline-block">
            ← Back to Home
          </Link>
          <h1 className="text-4xl font-bold">Airbnb Management</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Track expenses and products specifically for your Airbnb
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Link
            href="/airbnb/dashboard"
            className="p-6 border rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors bg-blue-50 dark:bg-blue-900/20"
          >
            <h2 className="text-2xl font-semibold mb-2">Dashboard</h2>
            <p className="text-gray-600 dark:text-gray-400">
              Overview of income, expenses, and cash flow
            </p>
          </Link>

          <Link
            href="/airbnb/income"
            className="p-6 border rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <h2 className="text-2xl font-semibold mb-2">Income</h2>
            <p className="text-gray-600 dark:text-gray-400">
              Track Airbnb income and revenue
            </p>
          </Link>

          <Link
            href="/airbnb/expenses"
            className="p-6 border rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <h2 className="text-2xl font-semibold mb-2">Expenses</h2>
            <p className="text-gray-600 dark:text-gray-400">
              Track bills and purchases for Airbnb
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
            href="/airbnb/inventory"
            className="p-6 border rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <h2 className="text-2xl font-semibold mb-2">Inventory</h2>
            <p className="text-gray-600 dark:text-gray-400">
              View all products in your Airbnb inventory
            </p>
          </Link>
        </div>
      </div>
    </main>
  )
}

