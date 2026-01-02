-- Add inventory_level column to products table
ALTER TABLE products 
ADD COLUMN inventory_level TEXT CHECK (inventory_level IN ('full', 'medium', 'low', 'none'));

-- Add inventory_level column to airbnb_products table
ALTER TABLE airbnb_products 
ADD COLUMN inventory_level TEXT CHECK (inventory_level IN ('full', 'medium', 'low', 'none'));

-- Set default value to 'none' for existing rows
UPDATE products SET inventory_level = 'none' WHERE inventory_level IS NULL;
UPDATE airbnb_products SET inventory_level = 'none' WHERE inventory_level IS NULL;

-- Create indexes for better query performance
CREATE INDEX idx_products_inventory_level ON products(inventory_level);
CREATE INDEX idx_airbnb_products_inventory_level ON airbnb_products(inventory_level);

