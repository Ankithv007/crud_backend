import express from 'express';
import cors from 'cors';
import mysql from 'mysql';

const app = express();
app.use(express.json());
app.use(cors());

// MySQL database connection
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'crud',
    dateStrings: 'date'
});

db.connect((err) => {
    if (err) {
        console.error('Error connecting to MySQL:', err);
        return;
    }
    console.log('Connected to MySQL database');
});

// ✅ GET all books
app.get('/books', (req, res) => {
    const sql = "SELECT id, publisher, name, DATE_FORMAT(date, '%Y-%m-%d') as date FROM book";
    db.query(sql, (err, data) => {
        if (err) return res.status(500).json({ error: "Failed to fetch books" });
        return res.json(data);
    });
});

// ✅ GET single book by ID
app.get('/books/:id', (req, res) => {
    const sql = "SELECT id, publisher, name, DATE_FORMAT(date, '%Y-%m-%d') as date FROM book WHERE id = ?";
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

// ✅ CREATE a new book
app.post('/create', (req, res) => {
    const sql = "INSERT INTO book (publisher, name, date) VALUES (?)";
    const values = [req.body.publisher, req.body.name, req.body.date];
    db.query(sql, [values], (err, data) => {
        if (err) {
            console.error('Error inserting book:', err);
            return res.status(500).json({ error: "Failed to create book" });
        }
        return res.status(201).json({ message: "Book created", data });
    });
});

// ✅ UPDATE a book by ID
app.put('/update/:id', (req, res) => {
    const sql = "UPDATE book SET publisher = ?, name = ?, date = ? WHERE id = ?";
    const values = [req.body.publisher, req.body.name, req.body.date];
    db.query(sql, [...values, req.params.id], (err, data) => {
        if (err) {
            console.error('Error updating book:', err);
            return res.status(500).json({ error: "Failed to update book" });
        }
        return res.json({ message: "Book updated", data });
    });
});

// ✅ DELETE a book by ID
app.delete('/delete/:id', (req, res) => {
    const sql = "DELETE FROM book WHERE id = ?";
    db.query(sql, [req.params.id], (err, data) => {
        if (err) {
            console.error('Error deleting book:', err);
            return res.status(500).json({ error: "Failed to delete book" });
        }
        return res.json({ message: "Book deleted", data });
    });
});

app.listen(5000, () => {
    console.log("Server running on http://localhost:5000");
});
