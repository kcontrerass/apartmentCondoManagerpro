-- AlterTable: nuevos tipos de amenidad para centros comerciales
ALTER TABLE `amenities` MODIFY COLUMN `type` ENUM(
    'POOL',
    'GYM',
    'CLUBHOUSE',
    'COURT',
    'BBQ',
    'FOOD_COURT',
    'EVENT_SPACE',
    'VISITOR_PARKING',
    'LOADING_AREA',
    'MULTIPURPOSE_HALL',
    'PLAY_AREA',
    'OTHER'
) NOT NULL DEFAULT 'OTHER';
