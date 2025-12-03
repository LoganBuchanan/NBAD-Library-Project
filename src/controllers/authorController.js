const { PrismaClient } = require('../generated/prisma');

const prisma = new PrismaClient();

// Create author (librarians only)
const createAuthor = async (req, res) => {
  try {
    const { name, bio } = req.body;

    // Validation
    if (!name) {
      return res.status(400).json({ 
        error: 'Author name is required' 
      });
    }

    // Check if author already exists
    const existingAuthor = await prisma.author.findFirst({
      where: { name }
    });

    if (existingAuthor) {
      return res.status(409).json({ 
        error: 'Author with this name already exists' 
      });
    }

    const author = await prisma.author.create({
      data: {
        name,
        bio: bio || null
      },
      include: {
        _count: {
          select: { bookAuthors: true }
        }
      }
    });

    res.status(201).json({
      message: 'Author created successfully',
      author
    });
  } catch (error) {
    console.error('Create author error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get all authors (public access)
const getAllAuthors = async (req, res) => {
  try {
    const { page = 1, limit = 10, search } = req.query;
    const skip = (page - 1) * limit;

    const where = search ? {
      name: {
        contains: search,
        mode: 'insensitive'
      }
    } : {};

    const [authors, total] = await Promise.all([
      prisma.author.findMany({
        where,
        include: {
          _count: {
            select: { bookAuthors: true }
          }
        },
        skip: parseInt(skip),
        take: parseInt(limit),
        orderBy: { name: 'asc' }
      }),
      prisma.author.count({ where })
    ]);

    res.json({
      authors,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        currentPage: parseInt(page),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get all authors error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get author by ID (public access)
const getAuthorById = async (req, res) => {
  try {
    const { id } = req.params;

    const author = await prisma.author.findUnique({
      where: { id },
      include: {
        bookAuthors: {
          include: {
            book: {
              select: {
                id: true,
                title: true,
                isbn: true,
                published_year: true,
                available_copies: true
              }
            }
          }
        },
        _count: {
          select: { bookAuthors: true }
        }
      }
    });

    if (!author) {
      return res.status(404).json({ error: 'Author not found' });
    }

    // Transform the response to include books directly
    const response = {
      ...author,
      books: author.bookAuthors.map(ba => ba.book),
      bookAuthors: undefined
    };

    res.json(response);
  } catch (error) {
    console.error('Get author by ID error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Update author (librarians only)
const updateAuthor = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, bio } = req.body;

    // Check if author exists
    const existingAuthor = await prisma.author.findUnique({
      where: { id }
    });

    if (!existingAuthor) {
      return res.status(404).json({ error: 'Author not found' });
    }

    // Check if name is already taken by another author
    if (name && name !== existingAuthor.name) {
      const authorWithName = await prisma.author.findFirst({
        where: {
          name,
          NOT: { id }
        }
      });

      if (authorWithName) {
        return res.status(409).json({ 
          error: 'Another author with this name already exists' 
        });
      }
    }

    const updatedAuthor = await prisma.author.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(bio !== undefined && { bio })
      },
      include: {
        _count: {
          select: { bookAuthors: true }
        }
      }
    });

    res.json({
      message: 'Author updated successfully',
      author: updatedAuthor
    });
  } catch (error) {
    console.error('Update author error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Delete author (librarians only)
const deleteAuthor = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if author has books
    const authorWithBooks = await prisma.author.findUnique({
      where: { id },
      include: {
        _count: {
          select: { bookAuthors: true }
        }
      }
    });

    if (!authorWithBooks) {
      return res.status(404).json({ error: 'Author not found' });
    }

    if (authorWithBooks._count.bookAuthors > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete author with associated books. Remove book associations first.' 
      });
    }

    await prisma.author.delete({
      where: { id }
    });

    res.json({ message: 'Author deleted successfully' });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Author not found' });
    }
    console.error('Delete author error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get authors stats (librarians only)
const getAuthorStats = async (req, res) => {
  try {
    const stats = await prisma.author.findMany({
      select: {
        id: true,
        name: true,
        _count: {
          select: { bookAuthors: true }
        }
      },
      orderBy: {
        bookAuthors: {
          _count: 'desc'
        }
      },
      take: 10
    });

    const totalAuthors = await prisma.author.count();
    const authorsWithBooks = await prisma.author.count({
      where: {
        bookAuthors: {
          some: {}
        }
      }
    });

    res.json({
      totalAuthors,
      authorsWithBooks,
      authorsWithoutBooks: totalAuthors - authorsWithBooks,
      topAuthorsByBooks: stats
    });
  } catch (error) {
    console.error('Get author stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get popular authors based on book loans
const getPopularAuthors = async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    
    const authors = await prisma.author.findMany({
      include: {
        bookAuthors: {
          include: {
            book: {
              include: {
                loans: {
                  where: {
                    returned_at: { not: null }
                  }
                }
              }
            }
          }
        }
      },
      take: parseInt(limit)
    });

    const popularAuthors = authors.map(author => {
      const totalLoans = author.bookAuthors.reduce((total, bookAuthor) => {
        return total + bookAuthor.book.loans.length;
      }, 0);
      
      const bookTitles = author.bookAuthors.map(ba => ba.book.title);
      
      return {
        id: author.id,
        name: author.name,
        bio: author.bio,
        totalBooks: author.bookAuthors.length,
        totalLoans,
        popularity: totalLoans / Math.max(author.bookAuthors.length, 1),
        bookTitles
      };
    }).sort((a, b) => b.totalLoans - a.totalLoans);

    res.json({
      authors: popularAuthors,
      total: popularAuthors.length
    });
  } catch (error) {
    console.error('Get popular authors error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  createAuthor,
  getAllAuthors,
  getAuthorById,
  updateAuthor,
  deleteAuthor,
  getAuthorStats,
  getPopularAuthors
};