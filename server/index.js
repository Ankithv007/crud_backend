import express from 'express';
import cors from 'cors';
import mysql from 'mysql';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

// MySQL DB connection
const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    dateStrings: process.env.DB_DATE_STRINGS === 'true'
});

db.connect((err) => {
    if (err) {
        console.error('Error connecting to MySQL:', err);
        return;
    }
    console.log('Connected to MySQL database');
});

/* -------------------- BOOK ROUTES -------------------- */

// Get all books with publisher name
app.get('/books', (req, res) => {
    const sql = `
      SELECT 
        book.id, 
        book.name, 
        DATE_FORMAT(book.date, '%Y-%m-%d') as date, 
        publisher.name AS publisher,
        book.publisher_id
      FROM book 
      LEFT JOIN publisher ON book.publisher_id = publisher.id
    `;
    db.query(sql, (err, data) => {
      if (err) return res.status(500).json({ error: "Failed to fetch books" });
      return res.json(data);
    });
});

// Get single book by ID with publisher name
app.get('/books/:id', (req, res) => {
    const sql = `
        SELECT 
            book.id, 
            book.name, 
            DATE_FORMAT(book.date, '%Y-%m-%d') as date,
            publisher.name AS publisher,
            book.publisher_id
        FROM book
        JOIN publisher ON book.publisher_id = publisher.id
        WHERE book.id = ?
    `;
    db.query(sql, [req.params.id], (err, data) => {
        if (err) {
            console.error('Error fetching book:', err);
            return res.status(500).json({ error: "Failed to fetch book" });
        }
        if (data.length === 0) {
            return res.status(404).json({ error: "Book not found" });
        }
        return res.json(data[0]);
    });
});

// Create a new book - UPDATED to use publisher_id
app.post('/books', (req, res) => {  // Changed endpoint from '/create' to '/books'
    const { publisher_id, name, date } = req.body;  // Changed from 'publisher' to 'publisher_id'
    
    // First validate publisher exists
    db.query('SELECT id FROM publisher WHERE id = ?', [publisher_id], (err, results) => {
        if (err) {
            return res.status(500).json({ error: "Database error" });
        }
        if (results.length === 0) {
            return res.status(400).json({ error: "Publisher does not exist" });
        }
        
        // Publisher exists, create the book
        const sql = "INSERT INTO book (publisher_id, name, date) VALUES (?, ?, ?)";
        db.query(sql, [publisher_id, name, date], (err, result) => {
            if (err) {
                console.error('Error inserting book:', err);
                return res.status(500).json({ error: "Failed to create book" });
            }
            return res.status(201).json({ 
                message: "Book created", 
                id: result.insertId,
                book: { id: result.insertId, publisher_id, name, date }
            });
        });
    });
});

// Update a book - UPDATED to use publisher_id
app.put('/books/:id', (req, res) => {  //
//  Changed endpoint from '/update/:id' to '/books/:id'
    console.log('hittign the put api');
    console.log('this si req',req);
    const { publisher_id, name, date } = req.body;  // Changed from 'publisher' to 'publisher_id'
    
    // First validate publisher exists
    db.query('SELECT id FROM publisher WHERE id = ?', [publisher_id], (err, results) => {
        if (err) {
            return res.status(500).json({ error: "Database error" });
        }
        if (results.length === 0) {
            return res.status(400).json({ error: "Publisher does not exist" });
        }
        
        // Publisher exists, update the book
        const sql = "UPDATE book SET publisher_id = ?, name = ?, date = ? WHERE id = ?";
        db.query(sql, [publisher_id, name, date, req.params.id], (err, result) => {
            if (err) {
                console.error('Error updating book:', err);
                return res.status(500).json({ error: "Failed to update book" });
            }
            if (result.affectedRows === 0) {
                return res.status(404).json({ error: "Book not found" });
            }
            return res.json({ 
                message: "Book updated", 
                book: { id: req.params.id, publisher_id, name, date }
            });
        });
    });
});

// Delete a book - UPDATED endpoint
app.delete('/books/:id', (req, res) => {  // Changed endpoint from '/delete/:id' to '/books/:id'
    const sql = "DELETE FROM book WHERE id = ?";
    db.query(sql, [req.params.id], (err, result) => {
        if (err) {
            console.error('Error deleting book:', err);
            return res.status(500).json({ error: "Failed to delete book" });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Book not found" });
        }
        return res.json({ message: "Book deleted" });
    });
}); 

/* -------------------- PUBLISHER ROUTES -------------------- */

// Get all publishers
app.get('/publishers', (req, res) => {
    const sql = "SELECT * FROM publisher";
    db.query(sql, (err, data) => {
        if (err) return res.status(500).json({ error: "Failed to fetch publishers" });
        return res.json(data);
    });
});

// Create new publisher
app.post('/publishers', (req, res) => {
    const { name, address, contact } = req.body;
    const sql = "INSERT INTO publisher (name, address, contact) VALUES (?, ?, ?)";
    db.query(sql, [name, address, contact], (err, result) => {
        if (err) {
            console.error('Error inserting publisher:', err);
            return res.status(500).json({ error: "Failed to create publisher" });
        }
        return res.status(201).json({ 
            message: "Publisher created", 
            id: result.insertId,
            publisher: { id: result.insertId, name, address, contact }
        });
    });
});

// Delete a publisher by ID
app.delete('/publishers/:id', (req, res) => {
    // First check if any books reference this publisher
    db.query('SELECT id FROM book WHERE publisher_id = ?', [req.params.id], (err, results) => {
        if (err) {
            return res.status(500).json({ error: "Database error" });
        }
        if (results.length > 0) {
            return res.status(400).json({ 
                error: "Cannot delete publisher - books are associated with it" 
            });
        }
        
        // No books reference this publisher, safe to delete
        const sql = "DELETE FROM publisher WHERE id = ?";
        db.query(sql, [req.params.id], (err, result) => {
            if (err) {
                console.error('Error deleting publisher:', err);
                return res.status(500).json({ error: "Failed to delete publisher" });
            }
            if (result.affectedRows === 0) {
                return res.status(404).json({ error: "Publisher not found" });
            }
            return res.json({ message: "Publisher deleted" });
        });
    });
});

/* -------------------- SERVER -------------------- */

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});