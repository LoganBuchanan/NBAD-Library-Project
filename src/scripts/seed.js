require('dotenv').config();
const { PrismaClient } = require('../generated/prisma');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('🌱 Starting database seed...');

    // Clear existing data
    await prisma.loan.deleteMany();
    await prisma.bookAuthor.deleteMany();
    await prisma.book.deleteMany();
    await prisma.author.deleteMany();
    await prisma.user.deleteMany();

    console.log('🗑️  Cleared existing data');

    // Create users
    const hashedPassword = await bcrypt.hash('password123', 12);
    
    const librarian = await prisma.user.create({
      data: {
        name: 'Alice Johnson',
        email: 'librarian@library.com',
        password_hash: hashedPassword,
        role: 'LIBRARIAN'
      }
    });

    const customer1 = await prisma.user.create({
      data: {
        name: 'John Smith',
        email: 'john@example.com',
        password_hash: hashedPassword,
        role: 'CUSTOMER'
      }
    });

    const customer2 = await prisma.user.create({
      data: {
        name: 'Sarah Davis',
        email: 'sarah@example.com',
        password_hash: hashedPassword,
        role: 'CUSTOMER'
      }
    });

    console.log('👥 Created users');

    // Create authors
    const author1 = await prisma.author.create({
      data: {
        name: 'J.K. Rowling',
        bio: 'British author best known for the Harry Potter fantasy series.'
      }
    });

    const author2 = await prisma.author.create({
      data: {
        name: 'George Orwell',
        bio: 'English novelist and essayist, journalist and critic.'
      }
    });

    const author3 = await prisma.author.create({
      data: {
        name: 'Jane Austen',
        bio: 'English novelist known primarily for her six major novels.'
      }
    });

    const author4 = await prisma.author.create({
      data: {
        name: 'Stephen King',
        bio: 'American author of horror, supernatural fiction, suspense, and fantasy novels.'
      }
    });

    console.log('✍️  Created authors');

    // Create books
    const book1 = await prisma.book.create({
      data: {
        title: 'Harry Potter and the Philosopher\'s Stone',
        isbn: '9780747532699',
        published_year: 1997,
        available_copies: 3
      }
    });

    const book2 = await prisma.book.create({
      data: {
        title: '1984',
        isbn: '9780451524935',
        published_year: 1949,
        available_copies: 2
      }
    });

    const book3 = await prisma.book.create({
      data: {
        title: 'Pride and Prejudice',
        isbn: '9780141439518',
        published_year: 1813,
        available_copies: 4
      }
    });

    const book4 = await prisma.book.create({
      data: {
        title: 'The Shining',
        isbn: '9780385121675',
        published_year: 1977,
        available_copies: 1
      }
    });

    const book5 = await prisma.book.create({
      data: {
        title: 'Animal Farm',
        isbn: '9780451526342',
        published_year: 1945,
        available_copies: 3
      }
    });

    console.log('📚 Created books');

    // Create book-author relationships
    await prisma.bookAuthor.createMany({
      data: [
        { book_id: book1.id, author_id: author1.id },
        { book_id: book2.id, author_id: author2.id },
        { book_id: book3.id, author_id: author3.id },
        { book_id: book4.id, author_id: author4.id },
        { book_id: book5.id, author_id: author2.id }
      ]
    });

    console.log('🔗 Created book-author relationships');

    // Create some loans
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 14);

    await prisma.loan.create({
      data: {
        user_id: customer1.id,
        book_id: book1.id,
        due_at: dueDate
      }
    });

    // Update book availability
    await prisma.book.update({
      where: { id: book1.id },
      data: { available_copies: 2 }
    });

    console.log('📖 Created loans');

    console.log('✅ Database seeded successfully!');
    console.log('\n🔐 Test credentials:');
    console.log('Librarian: librarian@library.com / password123');
    console.log('Customer 1: john@example.com / password123');
    console.log('Customer 2: sarah@example.com / password123');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});