-- Fix Wedding RLS Policies
-- This migration fixes the RLS policies to use 'true' instead of 'auth.uid()'
-- to be consistent with the rest of the project

-- Drop existing policies for wedding_categories
DROP POLICY IF EXISTS "Users can view their own wedding categories" ON wedding_categories;
DROP POLICY IF EXISTS "Users can insert their own wedding categories" ON wedding_categories;
DROP POLICY IF EXISTS "Users can update their own wedding categories" ON wedding_categories;
DROP POLICY IF EXISTS "Users can delete their own wedding categories" ON wedding_categories;

-- Drop existing policies for wedding_expenses
DROP POLICY IF EXISTS "Users can view their own wedding expenses" ON wedding_expenses;
DROP POLICY IF EXISTS "Users can insert their own wedding expenses" ON wedding_expenses;
DROP POLICY IF EXISTS "Users can update their own wedding expenses" ON wedding_expenses;
DROP POLICY IF EXISTS "Users can delete their own wedding expenses" ON wedding_expenses;

-- Drop existing policies for wedding_budgets
DROP POLICY IF EXISTS "Users can view their own wedding budgets" ON wedding_budgets;
DROP POLICY IF EXISTS "Users can insert their own wedding budgets" ON wedding_budgets;
DROP POLICY IF EXISTS "Users can update their own wedding budgets" ON wedding_budgets;
DROP POLICY IF EXISTS "Users can delete their own wedding budgets" ON wedding_budgets;

-- Drop existing policies for wedding_budget_items
DROP POLICY IF EXISTS "Users can view their own wedding budget items" ON wedding_budget_items;
DROP POLICY IF EXISTS "Users can insert their own wedding budget items" ON wedding_budget_items;
DROP POLICY IF EXISTS "Users can update their own wedding budget items" ON wedding_budget_items;
DROP POLICY IF EXISTS "Users can delete their own wedding budget items" ON wedding_budget_items;

-- Drop existing policies for wedding_quotes
DROP POLICY IF EXISTS "Users can view their own wedding quotes" ON wedding_quotes;
DROP POLICY IF EXISTS "Users can insert their own wedding quotes" ON wedding_quotes;
DROP POLICY IF EXISTS "Users can update their own wedding quotes" ON wedding_quotes;
DROP POLICY IF EXISTS "Users can delete their own wedding quotes" ON wedding_quotes;

-- Drop existing policies for wedding_folders
DROP POLICY IF EXISTS "Users can view their own wedding folders" ON wedding_folders;
DROP POLICY IF EXISTS "Users can insert their own wedding folders" ON wedding_folders;
DROP POLICY IF EXISTS "Users can update their own wedding folders" ON wedding_folders;
DROP POLICY IF EXISTS "Users can delete their own wedding folders" ON wedding_folders;

-- Drop existing policies for wedding_notes
DROP POLICY IF EXISTS "Users can view their own wedding notes" ON wedding_notes;
DROP POLICY IF EXISTS "Users can insert their own wedding notes" ON wedding_notes;
DROP POLICY IF EXISTS "Users can update their own wedding notes" ON wedding_notes;
DROP POLICY IF EXISTS "Users can delete their own wedding notes" ON wedding_notes;

-- Recreate policies with 'true' instead of 'auth.uid()'

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

