const express = require('express');
const app = express();
const cors = require("cors");
const bcrypt = require('bcrypt');
const db = require("./db");
const jwt = require('jsonwebtoken');
const Port = 3001;
const secretKey = 'priyanshu';

const corsOptions = {
    origin: 'https://assignment-frontend-1.onrender.com',
    optionsSuccessStatus: 200
};
app.use(cors(corsOptions));
app.use(express.json());
app.use((req, res, next) => {
    console.log(`Request received: ${req.method} ${req.url}`);
    next();
});

//signup
app.post('/signup', (req, res) => {
    const { email, password } = req.body; 
    db.query('SELECT email FROM users WHERE email=?', [email], (err, data) => {
        if (err) {
            console.log("error", err);
            res.status(500).json({ message: "Something went wrong" });
        } else {
            if (data[0]) {
               return res.status(500).json({ message: "User already exists" });
            } else {
                bcrypt.hash(password, 10, (err, hash) => {
                    if (err) {
                        console.log("error", err);
                        res.status(500).json({ message: "Error hashing password" });
                    } else {
                        db.query('INSERT INTO users SET ?', { email: email, password: hash }, (err, response) => {
                            if (err) {
                                console.log("error", err);
                                res.status(500).json({ message: "Error inserting user into database" });
                            } else {
                                console.log("aaaa", response);
                                const token = jwt.sign({ email: email, id:1 }, secretKey, { expiresIn: '1h' }); 
                                res.json({ message: "Signup successful", token: token });
                            }
                        });
                    }
                });
            }
        }
    });
});

app.post('/login', (req, res) => {
    const { email, password } = req.body; 
    db.query('SELECT id, email, password FROM users WHERE email=?', [email], async (err, data) => {
        if (err) {
            console.log("error", err);
            res.status(500).json({ message: "Something went wrong" });
        } else {
            if (data.length === 0) {
                return res.status(401).json({ message: "Invalid email or password" });
            } else {
                const isPasswordCorrect = await bcrypt.compare(password, data[0].password);
                console.log(">>>>>", password, data[0].password, isPasswordCorrect, data);
                if (isPasswordCorrect) {
                    const token = jwt.sign({ email: data[0].email, id: data[0].id }, secretKey, { expiresIn: '1h' }); 
                    res.json({ message: "Login successful", token: token });
                } else {
                    return res.status(401).json({ message: "Invalid email or password" });
                }
            }
        }
    });
});

app.use(async (req, res, next) => {
    try {
        const token = req.headers['authorization'];
        if (!token) {
            return res.status(401).json({ message: 'Authorization token is missing' });
        }
        
        jwt.verify(token, secretKey, (err, decoded) => {
            if (err) {
                return res.status(401).json({ message: 'Failed to authenticate token' });
            }
            req.user = decoded;
            next(); // Pass control to the next middleware or route handler
        });
    } catch(e) {
        // Handle any synchronous errors and return response
        return res.status(500).json({ message: 'Internal Server Error' });
    }
});

app.post('/create-task', (req, res) => {
    try {
        const userId = req.user.id;
        console.log("User ID:", req.user.id);

        const { task_name, task_desc, task_status } = req.body;

        db.query('INSERT INTO task SET ?', { task_name, task_desc, task_status, user_id: req.user.id }, (err, result) => {
            if (err) {
                console.log("Error:", err);
                return res.status(500).json({ message: "Error creating task data" });
            } else {
                return res.json({ message: "Task created successfully" });
            }
        });
    } catch (e) {
        console.log("Error:", e);
        return res.status(500).json({ message: "Internal Server Error" });
    }
});

// show data

app.get('/showdata', (req, res) => {
    try {
        db.query('SELECT * from task WHERE user_id=?', [req.user.id], (err, data) => {
            if (err) {
                console.log("error", err)
                return res.status(500).json({
                    message: "Something went wrong"
                });
            } else {
                return res.json({
                    data: data,
                    message: "Data found successfully."
                });
            }
        });
    } catch (e) {
        return res.status(500).json({
            message: "Internal Server Error"
        });
    }
});



// edit data

app.put('/edit', (req, res) => {
    try {
    const { name, desc, status, id } = req.body;

    let query = 'UPDATE task SET';
    const values = [];

    if (name !== undefined && name !== '') {
        query += ' task_name=?,';
        values.push(name);
    }
    if (desc !== undefined && desc !== '') {
        query += ' task_desc=?,';
        values.push(desc);
    }
    if (status !== undefined && status !== '') {
        query += ' task_status=?,';
        values.push(status);
    }
    query = query.slice(0, -1);
    query += ' WHERE id=? AND user_id=?';
    values.push(id,  req.user.id);  
    db.query(query, values, (err, data) => {
        console.log(data)
        if (err) {
            console.log("error", err);
            res.json({ message: "Something went wrong" });
        } else {
            res.json({ message: "Updated successfully" });
        }
    });
    }catch(e) {
        return res.json({
                    message: e
                })
    }
});



// delete data

app.delete('/delete', (req, res) => {
    try {
    db.query(`DELETE FROM task WHERE id=${req.query.id}`, (err, data) => {
        console.log(err, data);
        if (err) {
            console.log("error", err)
            res.json({
                message: "something went wrong"
            })
        } else {
            res.json({
                message: "Deleted successfully"
            })
        }
    })
    } catch(e) {
        return res.json({
                    message: e
                })
    }
})





app.listen(Port, (err, result) => {
    if (err) {
        res.status(500).send("error", err)
    }
    console.log(`Server is running on ${Port}`)
});