const { PrismaClient } = require('../generated/prisma');

const prisma = new PrismaClient();

// Create book (librarians only)
const createBook = async (req, res) => {
  try {
    const { title, isbn, published_year, available_copies, authorIds } = req.body;

    // Validation
    if (!title || !isbn || !published_year || !available_copies) {
      return res.status(400).json({ 
        error: 'Title, ISBN, published year, and available copies are required' 
      });
    }

    if (!authorIds || !Array.isArray(authorIds) || authorIds.length === 0) {
      return res.status(400).json({ 
        error: 'At least one author ID is required' 
      });
    }

    // Check if book with ISBN already exists
    const existingBook = await prisma.book.findUnique({
      where: { isbn }
    });

    if (existingBook) {
      return res.status(409).json({ 
        error: 'Book with this ISBN already exists' 
      });
    }

    // Verify all authors exist
    const authors = await prisma.author.findMany({
      where: { id: { in: authorIds } }
    });

    if (authors.length !== authorIds.length) {
      return res.status(400).json({ 
        error: 'One or more author IDs are invalid' 
      });
    }

    // Create book with author relationships
    const book = await prisma.book.create({
      data: {
        title,
        isbn,
        published_year: parseInt(published_year),
        available_copies: parseInt(available_copies),
        bookAuthors: {
          create: authorIds.map(authorId => ({
            author_id: authorId
          }))
        }
      },
      include: {
        bookAuthors: {
          include: {
            author: {
              select: {
                id: true,
                name: true
              }
            }
          }
        },
        _count: {
          select: { loans: true }
        }
      }
    });

    // Transform response
    const response = {
      ...book,
      authors: book.bookAuthors.map(ba => ba.author),
      bookAuthors: undefined
    };

    res.status(201).json({
      message: 'Book created successfully',
      book: response
    });
  } catch (error) {
    console.error('Create book error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get all books (public access)
const getAllBooks = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, author, available } = req.query;
    const skip = (page - 1) * limit;

    let where = {};

    // Search by title or ISBN
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { isbn: { contains: search, mode: 'insensitive' } }
      ];
    }

    // Filter by author
    if (author) {
      where.bookAuthors = {
        some: {
          author: {
            name: { contains: author, mode: 'insensitive' }
          }
        }
      };
    }

    // Filter by availability
    if (available === 'true') {
      where.available_copies = { gt: 0 };
    } else if (available === 'false') {
      where.available_copies = { lte: 0 };
    }

    const [books, total] = await Promise.all([
      prisma.book.findMany({
        where,
        include: {
          bookAuthors: {
            include: {
              author: {
                select: {
                  id: true,
                  name: true
                }
              }
            }
          },
          _count: {
            select: { loans: true }
          }
        },
        skip: parseInt(skip),
        take: parseInt(limit),
        orderBy: { title: 'asc' }
      }),
      prisma.book.count({ where })
    ]);

    // Transform response
    const transformedBooks = books.map(book => ({
      ...book,
      authors: book.bookAuthors.map(ba => ba.author),
      bookAuthors: undefined
    }));

    res.json({
      books: transformedBooks,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        currentPage: parseInt(page),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get all books error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get book by ID (public access)
const getBookById = async (req, res) => {
  try {
    const { id } = req.params;

    const book = await prisma.book.findUnique({
      where: { id },
      include: {
        bookAuthors: {
          include: {
            author: {
              select: {
                id: true,
                name: true,
                bio: true
              }
            }
          }
        },
        loans: {
          where: { returned_at: null },
          select: {
            id: true,
            borrowed_at: true,
            due_at: true,
            user: {
              select: {
                id: true,
                name: true
              }
            }
          }
        },
        _count: {
          select: { loans: true }
        }
      }
    });

    if (!book) {
      return res.status(404).json({ error: 'Book not found' });
    }

    // Transform response
    const response = {
      ...book,
      authors: book.bookAuthors.map(ba => ba.author),
      bookAuthors: undefined,
      currentLoans: book.loans
    };

    res.json(response);
  } catch (error) {
    console.error('Get book by ID error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Update book (librarians only)
const updateBook = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, isbn, published_year, available_copies, authorIds } = req.body;

    // Check if book exists
    const existingBook = await prisma.book.findUnique({
      where: { id },
      include: {
        bookAuthors: true
      }
    });

    if (!existingBook) {
      return res.status(404).json({ error: 'Book not found' });
    }

    // Check if ISBN is already taken by another book
    if (isbn && isbn !== existingBook.isbn) {
      const bookWithIsbn = await prisma.book.findFirst({
        where: {
          isbn,
          NOT: { id }
        }
      });

      if (bookWithIsbn) {
        return res.status(409).json({ 
          error: 'Another book with this ISBN already exists' 
        });
      }
    }

    // Verify authors if provided
    if (authorIds) {
      if (!Array.isArray(authorIds) || authorIds.length === 0) {
        return res.status(400).json({ 
          error: 'At least one author ID is required' 
        });
      }

      const authors = await prisma.author.findMany({
        where: { id: { in: authorIds } }
      });

      if (authors.length !== authorIds.length) {
        return res.status(400).json({ 
          error: 'One or more author IDs are invalid' 
        });
      }
    }

    // Update book
    const updateData = {
      ...(title && { title }),
      ...(isbn && { isbn }),
      ...(published_year && { published_year: parseInt(published_year) }),
      ...(available_copies !== undefined && { available_copies: parseInt(available_copies) })
    };

    // Update authors if provided
    if (authorIds) {
      await prisma.bookAuthor.deleteMany({
        where: { book_id: id }
      });

      updateData.bookAuthors = {
        create: authorIds.map(authorId => ({
          author_id: authorId
        }))
      };
    }

    const updatedBook = await prisma.book.update({
      where: { id },
      data: updateData,
      include: {
        bookAuthors: {
          include: {
            author: {
              select: {
                id: true,
                name: true
              }
            }
          }
        },
        _count: {
          select: { loans: true }
        }
      }
    });

    // Transform response
    const response = {
      ...updatedBook,
      authors: updatedBook.bookAuthors.map(ba => ba.author),
      bookAuthors: undefined
    };

    res.json({
      message: 'Book updated successfully',
      book: response
    });
  } catch (error) {
    console.error('Update book error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Delete book (librarians only)
const deleteBook = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if book has active loans
    const activeLoans = await prisma.loan.count({
      where: {
        book_id: id,
        returned_at: null
      }
    });

    if (activeLoans > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete book with active loans' 
      });
    }

    await prisma.book.delete({
      where: { id }
    });

    res.json({ message: 'Book deleted successfully' });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Book not found' });
    }
    console.error('Delete book error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get book statistics (librarians only)
const getBookStats = async (req, res) => {
  try {
    const totalBooks = await prisma.book.count();
    
    const availableBooks = await prisma.book.count({
      where: { available_copies: { gt: 0 } }
    });

    const mostBorrowedBooks = await prisma.book.findMany({
      select: {
        id: true,
        title: true,
        isbn: true,
        _count: {
          select: { loans: true }
        }
      },
      orderBy: {
        loans: {
          _count: 'desc'
        }
      },
      take: 10
    });

    const booksWithActiveLoans = await prisma.book.findMany({
      where: {
        loans: {
          some: {
            returned_at: null
          }
        }
      },
      select: {
        id: true,
        title: true,
        available_copies: true,
        _count: {
          select: {
            loans: {
              where: {
                returned_at: null
              }
            }
          }
        }
      }
    });

    res.json({
      totalBooks,
      availableBooks,
      unavailableBooks: totalBooks - availableBooks,
      mostBorrowedBooks,
      booksWithActiveLoans: booksWithActiveLoans.length,
      activeLoanDetails: booksWithActiveLoans
    });
  } catch (error) {
    console.error('Get book stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Create test book for demo purposes
const createTestBook = async (req, res) => {
  try {
    // First, get any available author to link to
    const authors = await prisma.author.findMany({
      take: 1
    });

    if (authors.length === 0) {
      return res.status(400).json({ error: 'No authors available. Create an author first.' });
    }

    const testBook = await prisma.book.create({
      data: {
        title: `Test Book ${Date.now()}`,
        isbn: `978${Math.floor(Math.random() * 1000000000)}`,
        published_year: 2024,
        available_copies: 3,
        bookAuthors: {
          create: {
            author_id: authors[0].id
          }
        }
      },
      include: {
        bookAuthors: {
          include: {
            author: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      }
    });

    const response = {
      ...testBook,
      authors: testBook.bookAuthors.map(ba => ba.author),
      bookAuthors: undefined
    };

    res.status(201).json({
      message: 'Test book created successfully',
      book: response
    });
  } catch (error) {
    console.error('Create test book error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Advanced book search with filters
const searchBooks = async (req, res) => {
  try {
    const { query, author, available, year, limit = 10 } = req.query;
    
    const filters = {
      AND: []
    };

    // Search in title or ISBN
    if (query) {
      filters.AND.push({
        OR: [
          { title: { contains: query, mode: 'insensitive' } },
          { isbn: { contains: query } }
        ]
      });
    }

    // Filter by availability
    if (available === 'true') {
      filters.AND.push({ available_copies: { gt: 0 } });
    }

    // Filter by publication year
    if (year) {
      filters.AND.push({ published_year: parseInt(year) });
    }

    // Filter by author name
    if (author) {
      filters.AND.push({
        bookAuthors: {
          some: {
            author: {
              name: { contains: author, mode: 'insensitive' }
            }
          }
        }
      });
    }

    const books = await prisma.book.findMany({
      where: filters.AND.length > 0 ? filters : {},
      include: {
        bookAuthors: {
          include: {
            author: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      },
      take: parseInt(limit),
      orderBy: { title: 'asc' }
    });

    const formattedBooks = books.map(book => ({
      ...book,
      authors: book.bookAuthors.map(ba => ba.author),
      bookAuthors: undefined
    }));

    res.json({
      books: formattedBooks,
      total: formattedBooks.length,
      filters: { query, author, available, year }
    });
  } catch (error) {
    console.error('Search books error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  createBook,
  getAllBooks,
  getBookById,
  updateBook,
  deleteBook,
  getBookStats,
  searchBooks
};