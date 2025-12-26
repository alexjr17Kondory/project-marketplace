-- CreateTable
CREATE TABLE `label_templates` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `backgroundImage` TEXT NULL,
    `width` DOUBLE NOT NULL DEFAULT 170.08,
    `height` DOUBLE NOT NULL DEFAULT 255.12,
    `isDefault` BOOLEAN NOT NULL DEFAULT false,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `label_templates_isDefault_idx`(`isDefault`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `label_template_product_types` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `labelTemplateId` INTEGER NOT NULL,
    `productTypeId` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `label_template_product_types_labelTemplateId_idx`(`labelTemplateId`),
    INDEX `label_template_product_types_productTypeId_idx`(`productTypeId`),
    UNIQUE INDEX `label_template_product_types_labelTemplateId_productTypeId_key`(`labelTemplateId`, `productTypeId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `label_zones` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `labelTemplateId` INTEGER NOT NULL,
    `zoneType` ENUM('PRODUCT_NAME', 'SIZE', 'COLOR', 'BARCODE', 'BARCODE_TEXT', 'SKU', 'PRICE', 'CUSTOM_TEXT') NOT NULL,
    `x` DOUBLE NOT NULL,
    `y` DOUBLE NOT NULL,
    `width` DOUBLE NOT NULL,
    `height` DOUBLE NOT NULL,
    `fontSize` INTEGER NOT NULL DEFAULT 10,
    `fontWeight` VARCHAR(191) NOT NULL DEFAULT 'normal',
    `textAlign` VARCHAR(191) NOT NULL DEFAULT 'center',
    `fontColor` VARCHAR(191) NOT NULL DEFAULT '#000000',
    `rotation` INTEGER NOT NULL DEFAULT 0,
    `zIndex` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `label_zones_labelTemplateId_idx`(`labelTemplateId`),
    INDEX `label_zones_zoneType_idx`(`zoneType`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `label_template_product_types` ADD CONSTRAINT `label_template_product_types_labelTemplateId_fkey` FOREIGN KEY (`labelTemplateId`) REFERENCES `label_templates`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `label_template_product_types` ADD CONSTRAINT `label_template_product_types_productTypeId_fkey` FOREIGN KEY (`productTypeId`) REFERENCES `product_types`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `label_zones` ADD CONSTRAINT `label_zones_labelTemplateId_fkey` FOREIGN KEY (`labelTemplateId`) REFERENCES `label_templates`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
