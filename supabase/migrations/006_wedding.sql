-- Wedding Module Tables

-- Wedding Categories (shared across expenses, budgets, and quotes)
CREATE TABLE IF NOT EXISTS wedding_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, name)
);

-- Wedding Expenses
CREATE TABLE IF NOT EXISTS wedding_expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  description TEXT NOT NULL,
  category_id UUID REFERENCES wedding_categories(id) ON DELETE SET NULL,
  date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Wedding Budgets
CREATE TABLE IF NOT EXISTS wedding_budgets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  initial_balance DECIMAL(10, 2) NOT NULL DEFAULT 0,
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Wedding Budget Items
CREATE TABLE IF NOT EXISTS wedding_budget_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  budget_id UUID NOT NULL REFERENCES wedding_budgets(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  category_id UUID REFERENCES wedding_categories(id) ON DELETE SET NULL,
  is_real BOOLEAN NOT NULL DEFAULT false,
  date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Wedding Quotes
CREATE TABLE IF NOT EXISTS wedding_quotes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  person_name TEXT NOT NULL,
  contact_info TEXT, -- Can store phone, email, etc.
  category_id UUID REFERENCES wedding_categories(id) ON DELETE SET NULL,
  concept TEXT NOT NULL, -- What is being quoted (e.g., "Photography package", "Venue rental")
  price DECIMAL(10, 2) NOT NULL,
  details TEXT, -- Details about what they offer (to compare)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Wedding Folders (for notes organization)
CREATE TABLE IF NOT EXISTS wedding_folders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Wedding Notes (within folders)
CREATE TABLE IF NOT EXISTS wedding_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  folder_id UUID REFERENCES wedding_folders(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT, -- Rich text content (stored as plain text, can be markdown)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_wedding_categories_user_id ON wedding_categories(user_id);
CREATE INDEX IF NOT EXISTS idx_wedding_expenses_user_id ON wedding_expenses(user_id);
CREATE INDEX IF NOT EXISTS idx_wedding_expenses_category_id ON wedding_expenses(category_id);
CREATE INDEX IF NOT EXISTS idx_wedding_expenses_date ON wedding_expenses(date);
CREATE INDEX IF NOT EXISTS idx_wedding_budgets_user_id ON wedding_budgets(user_id);
CREATE INDEX IF NOT EXISTS idx_wedding_budget_items_budget_id ON wedding_budget_items(budget_id);
CREATE INDEX IF NOT EXISTS idx_wedding_budget_items_category_id ON wedding_budget_items(category_id);
CREATE INDEX IF NOT EXISTS idx_wedding_quotes_user_id ON wedding_quotes(user_id);
CREATE INDEX IF NOT EXISTS idx_wedding_quotes_category_id ON wedding_quotes(category_id);
CREATE INDEX IF NOT EXISTS idx_wedding_folders_user_id ON wedding_folders(user_id);
CREATE INDEX IF NOT EXISTS idx_wedding_notes_user_id ON wedding_notes(user_id);
CREATE INDEX IF NOT EXISTS idx_wedding_notes_folder_id ON wedding_notes(folder_id);

-- Enable RLS
ALTER TABLE wedding_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE wedding_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE wedding_budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE wedding_budget_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE wedding_quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE wedding_folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE wedding_notes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for wedding_categories
CREATE POLICY "Users can view their own wedding categories" ON wedding_categories
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own wedding categories" ON wedding_categories
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their own wedding categories" ON wedding_categories
  FOR UPDATE USING (true);

CREATE POLICY "Users can delete their own wedding categories" ON wedding_categories
  FOR DELETE USING (true);

-- RLS Policies for wedding_expenses
CREATE POLICY "Users can view their own wedding expenses" ON wedding_expenses
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own wedding expenses" ON wedding_expenses
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their own wedding expenses" ON wedding_expenses
  FOR UPDATE USING (true);

CREATE POLICY "Users can delete their own wedding expenses" ON wedding_expenses
  FOR DELETE USING (true);

-- RLS Policies for wedding_budgets
CREATE POLICY "Users can view their own wedding budgets" ON wedding_budgets
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own wedding budgets" ON wedding_budgets
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their own wedding budgets" ON wedding_budgets
  FOR UPDATE USING (true);

CREATE POLICY "Users can delete their own wedding budgets" ON wedding_budgets
  FOR DELETE USING (true);

-- RLS Policies for wedding_budget_items
CREATE POLICY "Users can view their own wedding budget items" ON wedding_budget_items
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own wedding budget items" ON wedding_budget_items
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their own wedding budget items" ON wedding_budget_items
  FOR UPDATE USING (true);

CREATE POLICY "Users can delete their own wedding budget items" ON wedding_budget_items
  FOR DELETE USING (true);

-- RLS Policies for wedding_quotes
CREATE POLICY "Users can view their own wedding quotes" ON wedding_quotes
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own wedding quotes" ON wedding_quotes
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their own wedding quotes" ON wedding_quotes
  FOR UPDATE USING (true);

CREATE POLICY "Users can delete their own wedding quotes" ON wedding_quotes
  FOR DELETE USING (true);

-- RLS Policies for wedding_folders
CREATE POLICY "Users can view their own wedding folders" ON wedding_folders
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own wedding folders" ON wedding_folders
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their own wedding folders" ON wedding_folders
  FOR UPDATE USING (true);

CREATE POLICY "Users can delete their own wedding folders" ON wedding_folders
  FOR DELETE USING (true);

-- RLS Policies for wedding_notes
CREATE POLICY "Users can view their own wedding notes" ON wedding_notes
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own wedding notes" ON wedding_notes
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their own wedding notes" ON wedding_notes
  FOR UPDATE USING (true);

CREATE POLICY "Users can delete their own wedding notes" ON wedding_notes
  FOR DELETE USING (true);
