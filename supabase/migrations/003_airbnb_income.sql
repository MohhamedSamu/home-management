-- Airbnb Income table (separate from main income)
CREATE TABLE airbnb_income (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  description TEXT NOT NULL,
  is_recurring BOOLEAN NOT NULL DEFAULT false,
  recurring_day INTEGER CHECK (recurring_day >= 1 AND recurring_day <= 31),
  date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_airbnb_income_user_id ON airbnb_income(user_id);
CREATE INDEX idx_airbnb_income_date ON airbnb_income(date);
CREATE INDEX idx_airbnb_income_recurring ON airbnb_income(is_recurring, recurring_day);

-- Enable RLS
ALTER TABLE airbnb_income ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own airbnb income" ON airbnb_income
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own airbnb income" ON airbnb_income
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their own airbnb income" ON airbnb_income
  FOR UPDATE USING (true);

CREATE POLICY "Users can delete their own airbnb income" ON airbnb_income
  FOR DELETE USING (true);

