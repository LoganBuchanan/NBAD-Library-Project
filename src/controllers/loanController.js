const { PrismaClient } = require('../generated/prisma');

const prisma = new PrismaClient();

// Create loan (borrow book) - customers can borrow, librarians can create loans for any user
const createLoan = async (req, res) => {
  try {
    const { book_id, user_id, due_days = 14 } = req.body;
    const requestingUser = req.user;

    // Determine target user
    let targetUserId = user_id;
    
    // If not provided and user is customer, they can only borrow for themselves
    if (!targetUserId) {
      if (requestingUser.role === 'CUSTOMER') {
        targetUserId = requestingUser.id;
      } else {
        return res.status(400).json({ 
          error: 'User ID is required for librarian-created loans' 
        });
      }
    }

    // Customers can only create loans for themselves, librarians can create for anyone
    if (requestingUser.role === 'CUSTOMER' && targetUserId !== requestingUser.id) {
      return res.status(403).json({ 
        error: 'Customers can only borrow books for themselves' 
      });
    }

    // Validation
    if (!book_id) {
      return res.status(400).json({ 
        error: 'Book ID is required' 
      });
    }

    // Check if book exists and is available
    const book = await prisma.book.findUnique({
      where: { id: book_id },
      select: {
        id: true,
        title: true,
        available_copies: true,
        _count: {
          select: {
            loans: {
              where: { returned_at: null }
            }
          }
        }
      }
    });

    if (!book) {
      return res.status(404).json({ error: 'Book not found' });
    }

    if (book.available_copies <= 0) {
      return res.status(400).json({ 
        error: 'Book is not available for borrowing' 
      });
    }

    // Check if user already has this book borrowed
    const existingLoan = await prisma.loan.findFirst({
      where: {
        user_id: targetUserId,
        book_id,
        returned_at: null
      }
    });

    if (existingLoan) {
      return res.status(400).json({ 
        error: 'User already has this book borrowed' 
      });
    }

    // Check user's active loan limit (max 5 books)
    const activeLoanCount = await prisma.loan.count({
      where: {
        user_id: targetUserId,
        returned_at: null
      }
    });

    if (activeLoanCount >= 5) {
      return res.status(400).json({ 
        error: 'User has reached maximum loan limit (5 books)' 
      });
    }

    // Calculate due date
    const due_at = new Date();
    due_at.setDate(due_at.getDate() + parseInt(due_days));

    // Create loan and update book availability
    const loan = await prisma.$transaction(async (tx) => {
      const newLoan = await tx.loan.create({
        data: {
          user_id: targetUserId,
          book_id,
          due_at
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          book: {
            select: {
              id: true,
              title: true,
              isbn: true
            }
          }
        }
      });

      await tx.book.update({
        where: { id: book_id },
        data: {
          available_copies: {
            decrement: 1
          }
        }
      });

      return newLoan;
    });

    res.status(201).json({
      message: 'Book borrowed successfully',
      loan
    });
  } catch (error) {
    console.error('Create loan error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get all loans - customers see their own, librarians see all
const getAllLoans = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, user_id, overdue } = req.query;
    const skip = (page - 1) * limit;
    const requestingUser = req.user;

    let where = {};

    // Apply user filtering based on role
    if (requestingUser.role === 'CUSTOMER') {
      where.user_id = requestingUser.id;
    } else if (user_id) {
      where.user_id = user_id;
    }

    // Filter by status
    if (status === 'active') {
      where.returned_at = null;
    } else if (status === 'returned') {
      where.returned_at = { not: null };
    }

    // Filter overdue loans
    if (overdue === 'true') {
      where.AND = [
        { returned_at: null },
        { due_at: { lt: new Date() } }
      ];
    }

    const [loans, total] = await Promise.all([
      prisma.loan.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          book: {
            select: {
              id: true,
              title: true,
              isbn: true,
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
          }
        },
        skip: parseInt(skip),
        take: parseInt(limit),
        orderBy: { borrowed_at: 'desc' }
      }),
      prisma.loan.count({ where })
    ]);

    // Transform response to include book authors
    const transformedLoans = loans.map(loan => ({
      ...loan,
      book: {
        ...loan.book,
        authors: loan.book.bookAuthors?.map(ba => ba.author) || [],
        bookAuthors: undefined
      },
      isOverdue: loan.returned_at === null && loan.due_at < new Date()
    }));

    res.json({
      loans: transformedLoans,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        currentPage: parseInt(page),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get all loans error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get loan by ID
const getLoanById = async (req, res) => {
  try {
    const { id } = req.params;
    const requestingUser = req.user;

    const loan = await prisma.loan.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        book: {
          select: {
            id: true,
            title: true,
            isbn: true,
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
        }
      }
    });

    if (!loan) {
      return res.status(404).json({ error: 'Loan not found' });
    }

    // Authorization check
    if (requestingUser.role === 'CUSTOMER' && loan.user_id !== requestingUser.id) {
      return res.status(403).json({ 
        error: 'Access denied - you can only view your own loans' 
      });
    }

    // Transform response
    const response = {
      ...loan,
      book: {
        ...loan.book,
        authors: loan.book.bookAuthors?.map(ba => ba.author) || [],
        bookAuthors: undefined
      },
      isOverdue: loan.returned_at === null && loan.due_at < new Date()
    };

    res.json(response);
  } catch (error) {
    console.error('Get loan by ID error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Return book (update loan)
const returnBook = async (req, res) => {
  try {
    const { id } = req.params;
    const requestingUser = req.user;

    const loan = await prisma.loan.findUnique({
      where: { id },
      include: {
        book: {
          select: {
            id: true,
            title: true
          }
        },
        user: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    if (!loan) {
      return res.status(404).json({ error: 'Loan not found' });
    }

    // Authorization check
    if (requestingUser.role === 'CUSTOMER' && loan.user_id !== requestingUser.id) {
      return res.status(403).json({ 
        error: 'Access denied - you can only return your own loans' 
      });
    }

    if (loan.returned_at) {
      return res.status(400).json({ 
        error: 'Book has already been returned' 
      });
    }

    // Return book and update availability
    const updatedLoan = await prisma.$transaction(async (tx) => {
      const returnedLoan = await tx.loan.update({
        where: { id },
        data: {
          returned_at: new Date()
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          book: {
            select: {
              id: true,
              title: true,
              isbn: true
            }
          }
        }
      });

      await tx.book.update({
        where: { id: loan.book_id },
        data: {
          available_copies: {
            increment: 1
          }
        }
      });

      return returnedLoan;
    });

    res.json({
      message: 'Book returned successfully',
      loan: updatedLoan
    });
  } catch (error) {
    console.error('Return book error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Extend loan due date (librarians only)
const extendLoan = async (req, res) => {
  try {
    const { id } = req.params;
    const { extension_days = 7 } = req.body;

    const loan = await prisma.loan.findUnique({
      where: { id },
      include: {
        book: { select: { title: true } },
        user: { select: { name: true } }
      }
    });

    if (!loan) {
      return res.status(404).json({ error: 'Loan not found' });
    }

    if (loan.returned_at) {
      return res.status(400).json({ 
        error: 'Cannot extend loan for returned book' 
      });
    }

    const newDueDate = new Date(loan.due_at);
    newDueDate.setDate(newDueDate.getDate() + parseInt(extension_days));

    const updatedLoan = await prisma.loan.update({
      where: { id },
      data: { due_at: newDueDate },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        book: {
          select: {
            id: true,
            title: true,
            isbn: true
          }
        }
      }
    });

    res.json({
      message: `Loan extended by ${extension_days} days`,
      loan: updatedLoan
    });
  } catch (error) {
    console.error('Extend loan error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Delete loan (librarians only - for data management)
const deleteLoan = async (req, res) => {
  try {
    const { id } = req.params;

    const loan = await prisma.loan.findUnique({
      where: { id }
    });

    if (!loan) {
      return res.status(404).json({ error: 'Loan not found' });
    }

    // If loan is active, return book first
    if (!loan.returned_at) {
      await prisma.book.update({
        where: { id: loan.book_id },
        data: {
          available_copies: {
            increment: 1
          }
        }
      });
    }

    await prisma.loan.delete({
      where: { id }
    });

    res.json({ message: 'Loan record deleted successfully' });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Loan not found' });
    }
    console.error('Delete loan error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get loan statistics (librarians only)
const getLoanStats = async (req, res) => {
  try {
    const totalLoans = await prisma.loan.count();
    
    const activeLoans = await prisma.loan.count({
      where: { returned_at: null }
    });

    const overdueLoans = await prisma.loan.count({
      where: {
        returned_at: null,
        due_at: { lt: new Date() }
      }
    });

    const loansToday = await prisma.loan.count({
      where: {
        borrowed_at: {
          gte: new Date(new Date().setHours(0, 0, 0, 0))
        }
      }
    });

    const returnsToday = await prisma.loan.count({
      where: {
        returned_at: {
          gte: new Date(new Date().setHours(0, 0, 0, 0))
        }
      }
    });

    const mostActiveUsers = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
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

    res.json({
      totalLoans,
      activeLoans,
      returnedLoans: totalLoans - activeLoans,
      overdueLoans,
      loansToday,
      returnsToday,
      mostActiveUsers
    });
  } catch (error) {
    console.error('Get loan stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  createLoan,
  getAllLoans,
  getLoanById,
  returnBook,
  extendLoan,
  deleteLoan,
  getLoanStats
};