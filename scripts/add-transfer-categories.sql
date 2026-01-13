DO $$
BEGIN
    -- 1. Transfer Masuk (Income)
    IF NOT EXISTS (SELECT 1 FROM public.categories WHERE name = 'Transfer Masuk' AND type = 'income' AND user_id IS NULL) THEN
        INSERT INTO public.categories (name, type, user_id, icon)
        VALUES ('Transfer Masuk', 'income', NULL, 'ArrowDownLeft');
    ELSE
        -- Update icon jika sudah ada
        UPDATE public.categories SET icon = 'ArrowDownLeft'
        WHERE name = 'Transfer Masuk' AND type = 'income' AND user_id IS NULL;
    END IF;

    -- 2. Transfer Keluar (Expense)
    IF NOT EXISTS (SELECT 1 FROM public.categories WHERE name = 'Transfer Keluar' AND type = 'expense' AND user_id IS NULL) THEN
        INSERT INTO public.categories (name, type, user_id, icon)
        VALUES ('Transfer Keluar', 'expense', NULL, 'ArrowUpRight');
    ELSE
        -- Update icon jika sudah ada
        UPDATE public.categories SET icon = 'ArrowUpRight'
        WHERE name = 'Transfer Keluar' AND type = 'expense' AND user_id IS NULL;
    END IF;
END $$;
