DO $$
DECLARE
    default_in_id UUID;
    default_out_id UUID;
BEGIN
    -- 1. Ambil ID kategori Default
    SELECT id INTO default_in_id FROM categories WHERE name = 'Transfer Masuk' AND user_id IS NULL;
    SELECT id INTO default_out_id FROM categories WHERE name = 'Transfer Keluar' AND user_id IS NULL;

    -- 2. Merge Transfer Masuk Custom -> Default
    IF default_in_id IS NOT NULL THEN
        -- Pindahkan transaksi dari custom ke default
        UPDATE transactions 
        SET category_id = default_in_id 
        WHERE category_id IN (
            SELECT id FROM categories WHERE name ILIKE 'Transfer Masuk' AND user_id IS NOT NULL
        );
        
        -- Hapus kategori custom
        DELETE FROM categories WHERE name ILIKE 'Transfer Masuk' AND user_id IS NOT NULL;
    END IF;

    -- 3. Merge Transfer Keluar Custom -> Default
    IF default_out_id IS NOT NULL THEN
        -- Pindahkan transaksi dari custom ke default
        UPDATE transactions 
        SET category_id = default_out_id 
        WHERE category_id IN (
            SELECT id FROM categories WHERE name ILIKE 'Transfer Keluar' AND user_id IS NOT NULL
        );
        
        -- Hapus kategori custom
        DELETE FROM categories WHERE name ILIKE 'Transfer Keluar' AND user_id IS NOT NULL;
    END IF;
END $$;
