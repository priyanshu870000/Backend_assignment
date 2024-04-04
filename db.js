const mysql = require('mysql');
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Shyam@2003',
    database: 'w3villa'
})
module.exports=db