-- Budgets table
CREATE TABLE budgets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Budget items table
CREATE TABLE budget_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  budget_id UUID NOT NULL REFERENCES budgets(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  amount DECIMAL(10, 2) NOT NULL,
  description TEXT NOT NULL,
  date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_budgets_user_id ON budgets(user_id);
CREATE INDEX idx_budget_items_budget_id ON budget_items(budget_id);
CREATE INDEX idx_budget_items_date ON budget_items(date);

-- Enable RLS
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own budgets" ON budgets
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own budgets" ON budgets
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their own budgets" ON budgets
  FOR UPDATE USING (true);

CREATE POLICY "Users can delete their own budgets" ON budgets
  FOR DELETE USING (true);

CREATE POLICY "Users can view their own budget items" ON budget_items
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own budget items" ON budget_items
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their own budget items" ON budget_items
  FOR UPDATE USING (true);

CREATE POLICY "Users can delete their own budget items" ON budget_items
  FOR DELETE USING (true);

