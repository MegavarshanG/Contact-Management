import express from 'express';
import cors from 'cors';
import mysql from 'mysql2';
import bcrypt from 'bcrypt'; 
import jwt from 'jsonwebtoken';
const app = express();
app.use(cors());
app.use(express.json());

// Database connection
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root', 
    password: 'root', 
    database: 'contact_manager'
});

// Connect to the database
db.connect((err) => {
    if (err) {
        console.error('Database connection failed:', err);
        return;
    }
    console.log('Connected to the database.');
});

// Routes for managing contacts

// Add a contact
app.post('/add-contact', (req, res) => {
    const { 
        name, 
        email, 
        personalemail, 
        phone, 
        year, 
        address, 
        domain, 
        department, 
        github, 
        linkedin, 
        leetcode, 
        hackerrank 
    } = req.body;

    // Validate required fields
    if (!name || !email || !phone || !address || !department) {
        return res.status(400).json({ message: 'Missing required fields.' });
    }

    // Query to insert contact into the database
    const query = `
        INSERT INTO contact 
        (name, email, personalemail, phone, year, address, domain, department, github, linkedin, leetcode, hackerrank) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    db.query(
        query, 
        [name, email, personalemail, phone, year, address, domain, department, github, linkedin, leetcode, hackerrank], 
        (err, result) => {
            if (err) {
                console.error('Error adding contact:', err);
                return res.status(500).json({ message: 'Failed to add contact', error: err });
            }
            res.status(201).json({ message: 'Contact added', id: result.insertId });
        }
    );
});

app.post('/contact', (req, res) => {
    const { 
        name, 
        email, 
        personalemail, 
        phone, 
        year, 
        address, 
        domain, 
        department, 
        github, 
        linkedin, 
        leetcode, 
        hackerrank 
    } = req.body;

    // Validate required fields
    if (!name || !email || !phone || !address || !department) {
        return res.status(400).json({ message: 'Missing required fields.' });
    }

    const query = `
        INSERT INTO contact 
        (name, email, personalemail, phone, year, address, domain, department, github, linkedin, leetcode, hackerrank) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    db.query(
        query, 
        [name, email, personalemail, phone, year, address, domain, department, github, linkedin, leetcode, hackerrank], 
        (err, result) => {
            if (err) {
                console.error('Error adding contact:', err);
                return res.status(500).json({ message: 'Failed to add contact', error: err });
            }
            res.status(201).json({ message: 'Contact added', id: result.insertId });
        }
    );
});

// Edit a contact
app.put('/contact/:id', (req, res) => {
    const { id } = req.params;
    const { 
        name, 
        email, 
        personalemail, 
        phone, 
        year, 
        address, 
        domain, 
        department, 
        github, 
        linkedin, 
        leetcode, 
        hackerrank 
    } = req.body;

    // Validate required fields
    if (!name || !email || !phone || !address || !department) {
        return res.status(400).json({ message: 'Missing required fields.' });
    }

    const query = `
        UPDATE contact 
        SET name = ?, email = ?, personalemail = ?, phone = ?, year = ?, address = ?, domain = ?, 
            department = ?, github = ?, linkedin = ?, leetcode = ?, hackerrank = ?
        WHERE id = ?
    `;
    db.query(
        query, 
        [name, email, personalemail, phone, year, address, domain, department, github, linkedin, leetcode, hackerrank, id], 
        (err, result) => {
            if (err) {
                console.error('Error updating contact:', err);
                return res.status(500).json({ message: 'Failed to update contact', error: err });
            }
            if (result.affectedRows === 0) {
                return res.status(404).json({ message: 'Contact not found' });
            }
            res.json({ message: 'Contact updated' });
        }
    );
});

// Get all contacts
app.get('/contact', (req, res) => {
    const query = 'SELECT * FROM contact';
    db.query(query, (err, results) => {
        if (err) {
            console.error('Error retrieving contacts:', err);
            return res.status(500).json({ message: 'Failed to retrieve contacts', error: err });
        }
        res.json(results);
    });
});
app.delete('/contact/:phone', async (req, res) => {
    const { phone } = req.params;

    try {
        // Use db.promise().query for consistency
        const [result] = await db.promise().query('DELETE FROM contact WHERE phone = ?', [phone]);

        if (result.affectedRows > 0) {
            res.status(200).json({ message: 'Contact deleted successfully' });
        } else {
            res.status(404).json({ message: 'Contact not found' });
        }
    } catch (error) {
        console.error('Error deleting contact:', error);
        res.status(500).json({ message: 'Error deleting contact', error: error.message });
    }
});


// Registration endpoint
app.post('/register', async (req, res) => {
    const { phone, password, role } = req.body;

    // Validate required fields
    if (!phone || !password || !role) {
        return res.status(400).json({ message: 'Missing required fields.' });
    }

    try {
        // Check if user already exists
        const [existingUser] = await db.promise().query('SELECT * FROM users WHERE phone = ?', [phone]);
        if (existingUser.length > 0) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Hash the password before saving
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insert the new user into the database
        await db.promise().query('INSERT INTO users (phone, password, role) VALUES (?, ?, ?)', [phone, hashedPassword, role]);

        // Return the user data or a success message
        res.status(201).json({ phone, role });
    } catch (error) {
        console.error('Error registering user:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Replace with the generated key or store it securely in an environment variable
const secretKey = 'e2b5d4f6e12df982874d6f8392dfbf40b4bfa9e5a732b7f5f48be8e4f0b7ef29ecafc3e6d5282fd1f654c98ab9f3e42b';

app.post('/login', (req, res) => {
    const { phone, password } = req.body;

    // Basic validation
    if (!phone || !password) {
        return res.status(400).json({ message: 'Missing phone or password.' });
    }

    // Authenticate user
    db.query('SELECT * FROM users WHERE phone = ?', [phone], async (err, results) => {
        if (err) {
            console.error('Error during login:', err);
            return res.status(500).json({ message: 'Internal server error' });
        }

        if (results.length === 0) {
            return res.status(400).json({ message: 'Invalid phone or password' });
        }

        const user = results[0];

        // Compare password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid phone or password' });
        }

        // Generate JWT token
        const token = jwt.sign(
            { phone: user.phone, role: user.role }, // Payload
            secretKey, // Strong secret key
            { expiresIn: '1h' } // Token expiration
        );

        res.status(200).json({
            message: 'Login successful',
            token,
            user: {
                phone: user.phone,
                role: user.role,
            },
        });
    });
});

// Start server
const PORT = 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
