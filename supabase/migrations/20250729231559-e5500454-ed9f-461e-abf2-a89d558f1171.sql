-- Clean up orphaned transactions with null asset_id
DELETE FROM virtual_transactions WHERE asset_id IS NULL;