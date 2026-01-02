-- To-Do List table
CREATE TABLE todos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  priority TEXT NOT NULL CHECK (priority IN ('low', 'mid', 'high')),
  is_recurring BOOLEAN NOT NULL DEFAULT false,
  recurrence_type TEXT CHECK (recurrence_type IN ('daily', 'weekly', 'monthly', 'custom_days')),
  recurrence_value INTEGER, -- For custom_days: number of days (e.g., 5, 15)
  recurrence_day_of_month INTEGER CHECK (recurrence_day_of_month >= 1 AND recurrence_day_of_month <= 31), -- For monthly: day of month (e.g., 5)
  due_date DATE,
  completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_occurrence_date DATE -- Track when the last occurrence was generated/completed
);

-- Airbnb Expenses table (separate from main expenses)
CREATE TABLE airbnb_expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  is_recurring BOOLEAN NOT NULL DEFAULT false,
  recurring_day INTEGER CHECK (recurring_day >= 1 AND recurring_day <= 31),
  date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Airbnb Products table (separate from main products)
CREATE TABLE airbnb_products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  weight TEXT,
  brand TEXT,
  supplier TEXT, -- Similar to supermarket but for Airbnb supplies
  last_price DECIMAL(10, 2),
  last_purchase_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Airbnb Carts table
CREATE TABLE airbnb_carts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  total_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
  supplier TEXT NOT NULL,
  date DATE NOT NULL,
  is_completed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Airbnb Cart items table
CREATE TABLE airbnb_cart_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cart_id UUID NOT NULL REFERENCES airbnb_carts(id) ON DELETE CASCADE,
  product_id UUID REFERENCES airbnb_products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  weight TEXT,
  brand TEXT,
  price DECIMAL(10, 2) NOT NULL,
  supplier TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_todos_user_id ON todos(user_id);
CREATE INDEX idx_todos_completed ON todos(completed);
CREATE INDEX idx_todos_due_date ON todos(due_date);
CREATE INDEX idx_todos_recurring ON todos(is_recurring, recurrence_type);
CREATE INDEX idx_todos_priority ON todos(priority);

CREATE INDEX idx_airbnb_expenses_user_id ON airbnb_expenses(user_id);
CREATE INDEX idx_airbnb_expenses_date ON airbnb_expenses(date);
CREATE INDEX idx_airbnb_expenses_category ON airbnb_expenses(category);

CREATE INDEX idx_airbnb_products_user_id ON airbnb_products(user_id);
CREATE INDEX idx_airbnb_products_name ON airbnb_products(name);

CREATE INDEX idx_airbnb_carts_user_id ON airbnb_carts(user_id);
CREATE INDEX idx_airbnb_carts_date ON airbnb_carts(date);

CREATE INDEX idx_airbnb_cart_items_cart_id ON airbnb_cart_items(cart_id);

-- Enable RLS
ALTER TABLE todos ENABLE ROW LEVEL SECURITY;
ALTER TABLE airbnb_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE airbnb_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE airbnb_carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE airbnb_cart_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies (adjust based on your auth setup)
CREATE POLICY "Users can view their own todos" ON todos
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own todos" ON todos
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their own todos" ON todos
  FOR UPDATE USING (true);

CREATE POLICY "Users can delete their own todos" ON todos
  FOR DELETE USING (true);

CREATE POLICY "Users can view their own airbnb expenses" ON airbnb_expenses
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own airbnb expenses" ON airbnb_expenses
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their own airbnb expenses" ON airbnb_expenses
  FOR UPDATE USING (true);

CREATE POLICY "Users can delete their own airbnb expenses" ON airbnb_expenses
  FOR DELETE USING (true);

CREATE POLICY "Users can view their own airbnb products" ON airbnb_products
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own airbnb products" ON airbnb_products
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their own airbnb products" ON airbnb_products
  FOR UPDATE USING (true);

CREATE POLICY "Users can delete their own airbnb products" ON airbnb_products
  FOR DELETE USING (true);

CREATE POLICY "Users can view their own airbnb carts" ON airbnb_carts
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own airbnb carts" ON airbnb_carts
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their own airbnb carts" ON airbnb_carts
  FOR UPDATE USING (true);

CREATE POLICY "Users can delete their own airbnb carts" ON airbnb_carts
  FOR DELETE USING (true);

CREATE POLICY "Users can view airbnb cart items" ON airbnb_cart_items
  FOR SELECT USING (true);

CREATE POLICY "Users can insert airbnb cart items" ON airbnb_cart_items
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update airbnb cart items" ON airbnb_cart_items
  FOR UPDATE USING (true);

CREATE POLICY "Users can delete airbnb cart items" ON airbnb_cart_items
  FOR DELETE USING (true);

