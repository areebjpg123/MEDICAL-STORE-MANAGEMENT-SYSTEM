-- Trigger function to automatically deduct stock from products when an order is placed
CREATE OR REPLACE FUNCTION deduct_stock_on_order()
RETURNS TRIGGER AS $$
DECLARE
    item JSONB;
BEGIN
    -- Loop through the JSONB array in NEW.items
    -- items looks like: [{"id": "uuid", "quantity": 2}, ...]
    FOR item IN SELECT * FROM jsonb_array_elements(NEW.items)
    LOOP
        -- Deduct stock from the products table based on the item id and quantity
        UPDATE products
        SET stock_quantity = stock_quantity - (item->>'quantity')::INT
        WHERE id = (item->>'id')::TEXT;
    END LOOP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop the trigger if it exists to avoid errors on re-run
DROP TRIGGER IF EXISTS on_order_created ON orders;

-- Create the trigger on the orders table
CREATE TRIGGER on_order_created
AFTER INSERT ON orders
FOR EACH ROW
EXECUTE FUNCTION deduct_stock_on_order();
