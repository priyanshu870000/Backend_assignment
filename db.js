const mysql = require('mysql');
const db = mysql.createConnection({
    host: 'sql6.freemysqlhosting.net',
    user: 'sql6696737',
    password: 'GsGqslNUIT',
    database: 'sql6696737'
})
module.exports=db