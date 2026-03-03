const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        console.log('Starting manual table creation...');

        // Polls table
        await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS polls (
        id VARCHAR(191) NOT NULL,
        title VARCHAR(191) NOT NULL,
        description TEXT NULL,
        status ENUM('OPEN', 'CLOSED') NOT NULL DEFAULT 'OPEN',
        expires_at DATETIME(3) NULL,
        complex_id VARCHAR(191) NOT NULL,
        author_id VARCHAR(191) NOT NULL,
        created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        updated_at DATETIME(3) NOT NULL,
        PRIMARY KEY (id),
        INDEX polls_complex_id_idx (complex_id)
      ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
    `);
        console.log('Table "polls" checked/created.');

        // PollOptions table
        await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS poll_options (
        id VARCHAR(191) NOT NULL,
        text VARCHAR(191) NOT NULL,
        poll_id VARCHAR(191) NOT NULL,
        PRIMARY KEY (id),
        INDEX poll_options_poll_id_idx (poll_id)
      ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
    `);
        console.log('Table "poll_options" checked/created.');

        // Votes table
        await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS votes (
        id VARCHAR(191) NOT NULL,
        poll_id VARCHAR(191) NOT NULL,
        option_id VARCHAR(191) NOT NULL,
        user_id VARCHAR(191) NOT NULL,
        created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        PRIMARY KEY (id),
        UNIQUE INDEX votes_poll_id_user_id_key (poll_id, user_id),
        INDEX votes_poll_id_idx (poll_id),
        INDEX votes_user_id_idx (user_id),
        INDEX votes_option_id_idx (option_id)
      ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
    `);
        console.log('Table "votes" checked/created.');

        console.log('All voting tables created successfully!');
    } catch (error) {
        console.error('Error creating tables:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

main();
