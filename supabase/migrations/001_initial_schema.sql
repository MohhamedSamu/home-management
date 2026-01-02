-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Income table
CREATE TABLE income (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  description TEXT NOT NULL,
  is_recurring BOOLEAN NOT NULL DEFAULT false,
  recurring_day INTEGER CHECK (recurring_day >= 1 AND recurring_day <= 31),
  date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Expenses table
CREATE TABLE expenses (
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

-- Products table (for supermarket inventory)
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  weight TEXT,
  brand TEXT,
  supermarket TEXT,
  last_price DECIMAL(10, 2),
  last_purchase_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Carts table (supermarket shopping carts)
CREATE TABLE carts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  total_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
  supermarket TEXT NOT NULL,
  date DATE NOT NULL,
  is_completed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Cart items table
CREATE TABLE cart_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cart_id UUID NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  weight TEXT,
  brand TEXT,
  price DECIMAL(10, 2) NOT NULL,
  supermarket TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for better query performance
CREATE INDEX idx_income_user_id ON income(user_id);
CREATE INDEX idx_income_date ON income(date);
CREATE INDEX idx_income_recurring ON income(is_recurring, recurring_day);

CREATE INDEX idx_expenses_user_id ON expenses(user_id);
CREATE INDEX idx_expenses_date ON expenses(date);
CREATE INDEX idx_expenses_category ON expenses(category);
CREATE INDEX idx_expenses_recurring ON expenses(is_recurring, recurring_day);

CREATE INDEX idx_products_user_id ON products(user_id);
CREATE INDEX idx_products_name ON products(name);
CREATE INDEX idx_products_supermarket ON products(supermarket);

CREATE INDEX idx_carts_user_id ON carts(user_id);
CREATE INDEX idx_carts_date ON carts(date);
CREATE INDEX idx_carts_completed ON carts(is_completed);

CREATE INDEX idx_cart_items_cart_id ON cart_items(cart_id);
CREATE INDEX idx_cart_items_product_id ON cart_items(product_id);

-- Row Level Security (RLS) policies
-- Note: You'll need to set up authentication first and replace 'auth.uid()' with your auth user ID function

-- Enable RLS
ALTER TABLE income ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies (assuming Supabase Auth - adjust user_id matching as needed)
-- For now, we'll use a simple approach where users can only see their own data
-- You'll need to update these policies based on your authentication setup

-- Income policies
CREATE POLICY "Users can view their own income" ON income
  FOR SELECT USING (true); -- Adjust based on your auth setup

CREATE POLICY "Users can insert their own income" ON income
  FOR INSERT WITH CHECK (true); -- Adjust based on your auth setup

CREATE POLICY "Users can update their own income" ON income
  FOR UPDATE USING (true); -- Adjust based on your auth setup

CREATE POLICY "Users can delete their own income" ON income
  FOR DELETE USING (true); -- Adjust based on your auth setup

-- Expenses policies
CREATE POLICY "Users can view their own expenses" ON expenses
  FOR SELECT USING (true); -- Adjust based on your auth setup

CREATE POLICY "Users can insert their own expenses" ON expenses
  FOR INSERT WITH CHECK (true); -- Adjust based on your auth setup

CREATE POLICY "Users can update their own expenses" ON expenses
  FOR UPDATE USING (true); -- Adjust based on your auth setup

CREATE POLICY "Users can delete their own expenses" ON expenses
  FOR DELETE USING (true); -- Adjust based on your auth setup

-- Products policies
CREATE POLICY "Users can view their own products" ON products
  FOR SELECT USING (true); -- Adjust based on your auth setup

CREATE POLICY "Users can insert their own products" ON products
  FOR INSERT WITH CHECK (true); -- Adjust based on your auth setup

CREATE POLICY "Users can update their own products" ON products
  FOR UPDATE USING (true); -- Adjust based on your auth setup

CREATE POLICY "Users can delete their own products" ON products
  FOR DELETE USING (true); -- Adjust based on your auth setup

-- Carts policies
CREATE POLICY "Users can view their own carts" ON carts
  FOR SELECT USING (true); -- Adjust based on your auth setup

CREATE POLICY "Users can insert their own carts" ON carts
  FOR INSERT WITH CHECK (true); -- Adjust based on your auth setup

CREATE POLICY "Users can update their own carts" ON carts
  FOR UPDATE USING (true); -- Adjust based on your auth setup

CREATE POLICY "Users can delete their own carts" ON carts
  FOR DELETE USING (true); -- Adjust based on your auth setup

-- Cart items policies
CREATE POLICY "Users can view cart items for their carts" ON cart_items
  FOR SELECT USING (true); -- Adjust based on your auth setup

CREATE POLICY "Users can insert cart items" ON cart_items
  FOR INSERT WITH CHECK (true); -- Adjust based on your auth setup

CREATE POLICY "Users can update cart items" ON cart_items
  FOR UPDATE USING (true); -- Adjust based on your auth setup

CREATE POLICY "Users can delete cart items" ON cart_items
  FOR DELETE USING (true); -- Adjust based on your auth setup

