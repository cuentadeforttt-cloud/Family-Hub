-- ─────────────────────────────────────────────────────────────────────────────
-- FamilyHub — Inventory Module Migration (007)
-- ─────────────────────────────────────────────────────────────────────────────

-- Products table - Master product catalog per household
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT,
  description TEXT,
  current_stock INTEGER NOT NULL DEFAULT 0,
  unit TEXT DEFAULT 'unidad',
  expiry_date DATE,
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Inventory items - Individual stock entries with expiry tracking (FIFO)
CREATE TABLE inventory_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 0,
  expiry_date DATE,
  purchase_date DATE DEFAULT CURRENT_DATE,
  notes TEXT,
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Templates - Ideal stock levels for shopping list generation
CREATE TABLE inventory_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  ideal_quantity INTEGER NOT NULL DEFAULT 0,
  priority TEXT NOT NULL CHECK (priority IN ('high', 'medium', 'low')) DEFAULT 'medium',
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (household_id, product_id)
);

-- Stock movements - Audit trail for all stock changes
CREATE TABLE stock_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  inventory_item_id UUID REFERENCES inventory_items(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN ('add', 'remove', 'expired', 'adjustment')),
  quantity INTEGER NOT NULL,
  reason TEXT,
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Settings - User/household preferences for inventory
CREATE TABLE inventory_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  key TEXT NOT NULL,
  value TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (household_id, user_id, key)
);

-- ─────────────────────────────────────────────────────────────────────────────
-- Indexes
-- ─────────────────────────────────────────────────────────────────────────────
CREATE INDEX idx_products_household ON products(household_id);
CREATE INDEX idx_products_name ON products(household_id, name);
CREATE INDEX idx_products_category ON products(household_id, category);
CREATE INDEX idx_products_expiry ON products(household_id, expiry_date) WHERE expiry_date IS NOT NULL;

CREATE INDEX idx_inventory_items_household ON inventory_items(household_id);
CREATE INDEX idx_inventory_items_product ON inventory_items(product_id);
CREATE INDEX idx_inventory_items_expiry ON inventory_items(expiry_date) WHERE expiry_date IS NOT NULL AND quantity > 0;

CREATE INDEX idx_inventory_templates_household ON inventory_templates(household_id);
CREATE INDEX idx_inventory_templates_product ON inventory_templates(product_id);

CREATE INDEX idx_stock_movements_household ON stock_movements(household_id);
CREATE INDEX idx_stock_movements_product ON stock_movements(product_id);
CREATE INDEX idx_stock_movements_created ON stock_movements(created_at DESC);

CREATE INDEX idx_inventory_settings_household ON inventory_settings(household_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- RLS Policies
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_settings ENABLE ROW LEVEL SECURITY;

-- Helper function to check household membership
CREATE OR REPLACE FUNCTION is_household_member(p_household_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM household_members
    WHERE household_id = p_household_id
    AND user_id = auth.uid()
    AND status = 'active'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Products policies
CREATE POLICY "Members can view household products" ON products
  FOR SELECT USING (is_household_member(household_id));

CREATE POLICY "Members can insert household products" ON products
  FOR INSERT WITH CHECK (is_household_member(household_id));

CREATE POLICY "Members can update household products" ON products
  FOR UPDATE USING (is_household_member(household_id));

CREATE POLICY "Coordinators can delete household products" ON products
  FOR DELETE USING (
    is_household_member(household_id) AND
    EXISTS (
      SELECT 1 FROM household_members
      WHERE household_id = products.household_id
      AND user_id = auth.uid()
      AND rol = 'coordinador'
      AND status = 'active'
    )
  );

-- Inventory items policies
CREATE POLICY "Members can view household inventory" ON inventory_items
  FOR SELECT USING (is_household_member(household_id));

CREATE POLICY "Members can insert household inventory" ON inventory_items
  FOR INSERT WITH CHECK (is_household_member(household_id));

CREATE POLICY "Members can update household inventory" ON inventory_items
  FOR UPDATE USING (is_household_member(household_id));

CREATE POLICY "Coordinators can delete household inventory" ON inventory_items
  FOR DELETE USING (
    is_household_member(household_id) AND
    EXISTS (
      SELECT 1 FROM household_members
      WHERE household_id = inventory_items.household_id
      AND user_id = auth.uid()
      AND rol = 'coordinador'
      AND status = 'active'
    )
  );

-- Templates policies
CREATE POLICY "Members can view household templates" ON inventory_templates
  FOR SELECT USING (is_household_member(household_id));

CREATE POLICY "Members can manage household templates" ON inventory_templates
  FOR ALL USING (is_household_member(household_id));

-- Stock movements policies
CREATE POLICY "Members can view household stock movements" ON stock_movements
  FOR SELECT USING (is_household_member(household_id));

CREATE POLICY "Members can insert household stock movements" ON stock_movements
  FOR INSERT WITH CHECK (is_household_member(household_id));

-- Settings policies
CREATE POLICY "Users can view own inventory settings" ON inventory_settings
  FOR SELECT USING (
    household_id IN (SELECT household_id FROM household_members WHERE user_id = auth.uid() AND status = 'active')
    AND (user_id = auth.uid() OR user_id IS NULL)
  );

CREATE POLICY "Users can manage own inventory settings" ON inventory_settings
  FOR ALL USING (user_id = auth.uid());

-- ─────────────────────────────────────────────────────────────────────────────
-- Triggers for updated_at
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TRIGGER set_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_inventory_items_updated_at
  BEFORE UPDATE ON inventory_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_inventory_templates_updated_at
  BEFORE UPDATE ON inventory_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_inventory_settings_updated_at
  BEFORE UPDATE ON inventory_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ─────────────────────────────────────────────────────────────────────────────
-- Default Settings
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO inventory_settings (household_id, user_id, key, value)
SELECT h.id, NULL, 'expiry_alert_days', '3'
FROM households h
ON CONFLICT (household_id, user_id, key) DO NOTHING;

INSERT INTO inventory_settings (household_id, user_id, key, value)
SELECT h.id, NULL, 'low_stock_alert', 'true'
FROM households h
ON CONFLICT (household_id, user_id, key) DO NOTHING;

INSERT INTO inventory_settings (household_id, user_id, key, value)
SELECT h.id, NULL, 'notifications_enabled', 'true'
FROM households h
ON CONFLICT (household_id, user_id, key) DO NOTHING;