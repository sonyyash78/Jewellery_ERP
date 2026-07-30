SET FOREIGN_KEY_CHECKS = 0;

-- 1. Authentication
CREATE TABLE `users` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `username` VARCHAR(255) NOT NULL UNIQUE,
    `email` VARCHAR(255) NOT NULL UNIQUE,
    `password_hash` VARCHAR(255) NOT NULL,
    `is_active` BOOLEAN DEFAULT TRUE,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_users_username` (`username`),
    INDEX `idx_users_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `roles` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(100) NOT NULL UNIQUE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `user_roles` (
    `user_id` BIGINT NOT NULL,
    `role_id` BIGINT NOT NULL,
    PRIMARY KEY (`user_id`, `role_id`),
    CONSTRAINT `fk_user_roles_user` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_user_roles_role` FOREIGN KEY (`role_id`) REFERENCES `roles`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Customers
CREATE TABLE `customers` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `first_name` VARCHAR(100) NOT NULL,
    `last_name` VARCHAR(100),
    `phone_number` VARCHAR(20) NOT NULL UNIQUE,
    `email` VARCHAR(255),
    `pan_card` VARCHAR(20) UNIQUE,
    `aadhar_card` VARCHAR(20) UNIQUE,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_customers_phone` (`phone_number`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `customer_addresses` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `customer_id` BIGINT NOT NULL,
    `address_line1` TEXT NOT NULL,
    `address_line2` TEXT,
    `city` VARCHAR(100) NOT NULL,
    `state` VARCHAR(100) NOT NULL,
    `zip_code` VARCHAR(20) NOT NULL,
    `is_default` BOOLEAN DEFAULT FALSE,
    CONSTRAINT `fk_cust_address_customer` FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON DELETE CASCADE,
    INDEX `idx_cust_address_customer_id` (`customer_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Products
CREATE TABLE `categories` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(255) NOT NULL,
    `parent_id` BIGINT NULL,
    CONSTRAINT `fk_categories_parent` FOREIGN KEY (`parent_id`) REFERENCES `categories`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `metal_types` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(50) NOT NULL UNIQUE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `purities` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `metal_type_id` BIGINT NOT NULL,
    `karat_name` VARCHAR(50) NOT NULL,
    `percentage` DECIMAL(5,2) NOT NULL,
    CONSTRAINT `fk_purities_metal` FOREIGN KEY (`metal_type_id`) REFERENCES `metal_types`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `products` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `category_id` BIGINT,
    `name` VARCHAR(255) NOT NULL,
    `sku_prefix` VARCHAR(50) NOT NULL UNIQUE,
    `metal_type_id` BIGINT NOT NULL,
    CONSTRAINT `fk_products_category` FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON DELETE SET NULL,
    CONSTRAINT `fk_products_metal` FOREIGN KEY (`metal_type_id`) REFERENCES `metal_types`(`id`) ON DELETE RESTRICT,
    INDEX `idx_products_sku` (`sku_prefix`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `product_variants` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `product_id` BIGINT NOT NULL,
    `purity_id` BIGINT NOT NULL,
    `standard_weight` DECIMAL(10,3),
    `size` VARCHAR(50),
    `making_charge_type` VARCHAR(50),
    CONSTRAINT `fk_variant_product` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_variant_purity` FOREIGN KEY (`purity_id`) REFERENCES `purities`(`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Inventory
CREATE TABLE `warehouses` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(255) NOT NULL,
    `location_address` TEXT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `inventory_items` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `product_variant_id` BIGINT NOT NULL,
    `warehouse_id` BIGINT NOT NULL,
    `barcode` VARCHAR(100) NOT NULL UNIQUE,
    `gross_weight` DECIMAL(10,3) NOT NULL,
    `net_weight` DECIMAL(10,3) NOT NULL,
    `status` ENUM('Available', 'Sold', 'Reserved') DEFAULT 'Available',
    CONSTRAINT `fk_inv_item_variant` FOREIGN KEY (`product_variant_id`) REFERENCES `product_variants`(`id`) ON DELETE RESTRICT,
    CONSTRAINT `fk_inv_item_warehouse` FOREIGN KEY (`warehouse_id`) REFERENCES `warehouses`(`id`) ON DELETE RESTRICT,
    INDEX `idx_inventory_barcode` (`barcode`),
    INDEX `idx_inventory_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `inventory_transactions` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `inventory_item_id` BIGINT NOT NULL,
    `transaction_type` ENUM('In', 'Out', 'Transfer', 'Adjustment') NOT NULL,
    `quantity` INT NOT NULL DEFAULT 1,
    `date` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `user_id` BIGINT NOT NULL,
    CONSTRAINT `fk_inv_trans_item` FOREIGN KEY (`inventory_item_id`) REFERENCES `inventory_items`(`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_inv_trans_user` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT,
    INDEX `idx_inv_trans_date` (`date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. & 6. Billing Rates
CREATE TABLE `gold_rates` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `purity_id` BIGINT NOT NULL,
    `rate_per_gram` DECIMAL(10,2) NOT NULL,
    `effective_datetime` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `fk_gold_rates_purity` FOREIGN KEY (`purity_id`) REFERENCES `purities`(`id`) ON DELETE RESTRICT,
    INDEX `idx_gold_rates_effective` (`effective_datetime`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `silver_rates` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `purity_id` BIGINT NOT NULL,
    `rate_per_gram` DECIMAL(10,2) NOT NULL,
    `effective_datetime` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `fk_silver_rates_purity` FOREIGN KEY (`purity_id`) REFERENCES `purities`(`id`) ON DELETE RESTRICT,
    INDEX `idx_silver_rates_effective` (`effective_datetime`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. Invoices
CREATE TABLE `invoices` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `customer_id` BIGINT NOT NULL,
    `invoice_number` VARCHAR(100) NOT NULL UNIQUE,
    `invoice_date` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `subtotal` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    `tax_amount` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    `discount_amount` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    `grand_total` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    `status` ENUM('Draft', 'Paid', 'Cancelled') DEFAULT 'Draft',
    `created_by` BIGINT NOT NULL,
    CONSTRAINT `fk_invoices_customer` FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON DELETE RESTRICT,
    CONSTRAINT `fk_invoices_user` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE RESTRICT,
    INDEX `idx_invoices_number` (`invoice_number`),
    INDEX `idx_invoices_date` (`invoice_date`),
    INDEX `idx_invoices_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `invoice_items` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `invoice_id` BIGINT NOT NULL,
    `inventory_item_id` BIGINT NOT NULL,
    `item_type` ENUM('Gold', 'Silver', 'Diamond') NOT NULL,
    `final_price` DECIMAL(12,2) NOT NULL,
    CONSTRAINT `fk_invoice_items_invoice` FOREIGN KEY (`invoice_id`) REFERENCES `invoices`(`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_invoice_items_inventory` FOREIGN KEY (`inventory_item_id`) REFERENCES `inventory_items`(`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `gold_calculations` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `invoice_item_id` BIGINT NOT NULL UNIQUE,
    `metal_rate_id` BIGINT NOT NULL,
    `gross_weight` DECIMAL(10,3) NOT NULL,
    `stone_weight` DECIMAL(10,3) NOT NULL DEFAULT 0.000,
    `net_weight` DECIMAL(10,3) NOT NULL,
    `making_charges_amount` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    `hallmark_charges` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    `total_gold_value` DECIMAL(12,2) NOT NULL,
    CONSTRAINT `fk_gold_calc_item` FOREIGN KEY (`invoice_item_id`) REFERENCES `invoice_items`(`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_gold_calc_rate` FOREIGN KEY (`metal_rate_id`) REFERENCES `gold_rates`(`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `silver_calculations` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `invoice_item_id` BIGINT NOT NULL UNIQUE,
    `metal_rate_id` BIGINT NOT NULL,
    `gross_weight` DECIMAL(10,3) NOT NULL,
    `tanch_percentage` DECIMAL(5,2) NOT NULL,
    `pure_weight` DECIMAL(10,3) NOT NULL,
    `making_charges_amount` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    `total_silver_value` DECIMAL(12,2) NOT NULL,
    CONSTRAINT `fk_silver_calc_item` FOREIGN KEY (`invoice_item_id`) REFERENCES `invoice_items`(`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_silver_calc_rate` FOREIGN KEY (`metal_rate_id`) REFERENCES `silver_rates`(`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. Payments
CREATE TABLE `payment_methods` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(100) NOT NULL UNIQUE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `payments` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `invoice_id` BIGINT NOT NULL,
    `payment_method_id` BIGINT NOT NULL,
    `amount` DECIMAL(12,2) NOT NULL,
    `payment_date` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `transaction_reference` VARCHAR(255),
    CONSTRAINT `fk_payments_invoice` FOREIGN KEY (`invoice_id`) REFERENCES `invoices`(`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_payments_method` FOREIGN KEY (`payment_method_id`) REFERENCES `payment_methods`(`id`) ON DELETE RESTRICT,
    INDEX `idx_payments_invoice` (`invoice_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. Exchange
CREATE TABLE `exchanges` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `customer_id` BIGINT NOT NULL,
    `invoice_id` BIGINT NULL,
    `exchange_date` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `total_exchange_value` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    CONSTRAINT `fk_exchanges_customer` FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON DELETE RESTRICT,
    CONSTRAINT `fk_exchanges_invoice` FOREIGN KEY (`invoice_id`) REFERENCES `invoices`(`id`) ON DELETE SET NULL,
    INDEX `idx_exchanges_customer` (`customer_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `exchange_items` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `exchange_id` BIGINT NOT NULL,
    `metal_type_id` BIGINT NOT NULL,
    `gross_weight` DECIMAL(10,3) NOT NULL,
    `purity_assessed` DECIMAL(5,2) NOT NULL,
    `net_weight` DECIMAL(10,3) NOT NULL,
    `rate_applied` DECIMAL(10,2) NOT NULL,
    `calculated_value` DECIMAL(12,2) NOT NULL,
    CONSTRAINT `fk_exc_items_exchange` FOREIGN KEY (`exchange_id`) REFERENCES `exchanges`(`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_exc_items_metal` FOREIGN KEY (`metal_type_id`) REFERENCES `metal_types`(`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 10. Expenses
CREATE TABLE `expense_categories` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(255) NOT NULL UNIQUE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `expenses` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `expense_category_id` BIGINT NOT NULL,
    `amount` DECIMAL(12,2) NOT NULL,
    `expense_date` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `description` TEXT,
    `recorded_by` BIGINT NOT NULL,
    CONSTRAINT `fk_expenses_category` FOREIGN KEY (`expense_category_id`) REFERENCES `expense_categories`(`id`) ON DELETE RESTRICT,
    CONSTRAINT `fk_expenses_user` FOREIGN KEY (`recorded_by`) REFERENCES `users`(`id`) ON DELETE RESTRICT,
    INDEX `idx_expenses_date` (`expense_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 11. Reports
CREATE TABLE `generated_reports` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `report_name` VARCHAR(255) NOT NULL,
    `report_type` VARCHAR(100) NOT NULL,
    `generated_by` BIGINT NOT NULL,
    `generated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `s3_file_url` TEXT,
    CONSTRAINT `fk_reports_user` FOREIGN KEY (`generated_by`) REFERENCES `users`(`id`) ON DELETE RESTRICT,
    INDEX `idx_reports_type` (`report_type`),
    INDEX `idx_reports_date` (`generated_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 12. Settings
CREATE TABLE `system_settings` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `setting_key` VARCHAR(100) NOT NULL UNIQUE,
    `setting_value` TEXT NOT NULL,
    `description` VARCHAR(255)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `tax_configurations` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `tax_name` VARCHAR(100) NOT NULL UNIQUE,
    `percentage` DECIMAL(5,2) NOT NULL,
    `is_active` BOOLEAN DEFAULT TRUE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `number_sequences` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `entity` VARCHAR(100) NOT NULL UNIQUE,
    `prefix` VARCHAR(50) NOT NULL,
    `next_number` BIGINT NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;
