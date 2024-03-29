import express, { Response } from "express";
import sqlite3 from "sqlite3";
import { open } from "sqlite";
import * as url from "url";
import argon2 from 'argon2';
import { randomBytes } from 'crypto';

let rateLimiter = require("express-rate-limit");
let helmet = require("helmet");

let app = express();
app.use(express.json());
app.use(express.static("public"));
app.use(helmet());



let limiter = rateLimiter({
    windowMs: 10 * 6000,
    max: 10,
    message: "Login attempts increased limit. Try again later."

})
// create database "connection"
// use absolute path to avoid this issue
// https://github.com/TryGhost/node-sqlite3/issues/441
let __dirname = url.fileURLToPath(new URL("..", import.meta.url));
let dbfile = `${__dirname}database.db`;
let db = await open({
    filename: dbfile,
    driver: sqlite3.Database,
});
await db.get("PRAGMA foreign_keys = ON");


//
// SQLITE EXAMPLES
// comment these out or they'll keep inserting every time you run your server
// if you get 'UNIQUE constraint failed' errors it's because
// this will keep inserting a row with the same primary key
// but the primary key should be unique
//

//Add credentials to users tables
let testPassword = "test";
let testUsername = "rafay" 
let hashed = await argon2.hash(testPassword);
await db.run("INSERT INTO users (username, pwd) VALUES ($1, $2) RETURNING *", [testUsername, hashed])

// insert example
await db.run(
    "INSERT INTO authors(id, name, bio) VALUES('1', 'Figginsworth III', 'A traveling gentleman.')"
);
await db.run(
    "INSERT INTO books(author_id, title, pub_year, genre) VALUES ('1', 'My Fairest Lady', '1866', 'romance')"
);

/*
// insert example with parameterized queries
// important to use parameterized queries to prevent SQL injection
// when inserting untrusted data
let statement = await db.prepare(
    "INSERT INTO books(id, author_id, title, pub_year, genre) VALUES (?, ?, ?, ?, ?)"
);
await statement.bind(["2", "1", "A Travelogue of Tales", "1867", "adventure"]);
await statement.run();
*/
// select examples
let authors = await db.all("SELECT * FROM authors");
console.log("Authors", authors);
let books = await db.all("SELECT * FROM books WHERE id = '1'");
console.log("Books", books);
let filteredBooks = await db.all("SELECT * FROM books WHERE pub_year = '1867'");

console.log("Some books", filteredBooks);

//
// EXPRESS EXAMPLES
//

// GET/POST/DELETE example
interface Foo {
    message: string;
}

interface Error {
    error: string;
}
type FooResponse = Response<Foo | Error>;
// res's type limits what responses this request handler can send
// it must send either an object with a message or an error
app.get("/api/books", async (req, res) => {
    const {id, title, author, genre, pub_year} = req.query;
    let query = "SELECT * FROM books";
    let filters = [];
    console.log(req.query);

    if (id){
        query += ` WHERE id = ?`;
        filters.push(id)
    }
    else{
        if (title){
            query += " WHERE title = ?";
            filters.push(title);
        }
    
        if (author){
            if (filters.length > 0){
                query += " AND ";
            }
            else{
                query += " WHERE ";
            }
            query += " author_id = (SELECT id from authors WHERE name = ?)";
            filters.push(author);
        }
    
        if (genre){
            if (filters.length > 0){
                query += " AND ";
            }
            else{
                query += " WHERE ";
            }
    
            query += " genre = ?";
            filters.push(genre)
        }

        if (pub_year){
            if (filters.length > 0){
                query += " AND ";
            }
            else{
                query += " WHERE ";
            }
            query += " pub_year = ?";
            filters.push(pub_year);
        }
    }
    console.log(query);

    try{
        let val = await db.all(query, filters);
        res.json({response: val});
    }
    catch (err){
        return res.json({message: "Query unsuccesful"});
    }
});

function generateToken(length = 32): string {
    return randomBytes(length).toString('hex');
}

app.post("/login", limiter, async (req, res: Response) => {
    try{
        let {username, password} = req.body;
        console.log(username, password);
        //let hash = await argon2.hash(password);
        const user = await db.all("SELECT * FROM users WHERE username = $1", [username]);
        if (user.length === 0){
            return res.status(404).send({message: "User not found"});
        }
        else{
            let hash = user[0].pwd;
            let activeUser: boolean = await argon2.verify(hash, password);
            if (activeUser){
                const token = generateToken();
                res.setHeader('Set-Cookie', `token=${token}; HttpOnly`);
                return res.status(200).send({message: "Logged in succesfully"});
            }
            else{
                return res.status(404);
            }
        }
    }
    catch(err){
        return res.status(404).send({message: "Invalid Credentials"});
    }
})


app.post("/api/books", async (req, res: Response) =>{
    const {title, author_id, genre, pub_year} = req.body;
    let vals = [author_id, title, pub_year, genre];
    let statement = await db.prepare(
        "INSERT INTO books(author_id, title, pub_year, genre) VALUES (?, ?, ?, ?)"
    );

    try{
        await statement.bind(vals);
        let val = await statement.run();
        let newId = val.lastID;
        let books = await db.all("SELECT * FROM books");
        console.log("Books", books);
        return res.json({response: books, id: newId});
    }
    catch (err){
        return res.json({message: "Query unsuccesful"});
    }
});

app.delete("/foo", (req, res) => {
    // etc.
    res.sendStatus(200);
});

app.get('/books/checkBook/:id', async (req, res: Response) => {
    const bookId = req.params.id;
    console.log(bookId);
  
    try {
      const book = await db.get(
        'SELECT * FROM books WHERE id = $bookId',
        { $bookId: bookId }
      );
  
      if (!book) {
        return res.status(404).send({ message: 'Book not found' });
      }
  
      return res.status(200).json({ book });
    } catch (error) {
      return res.status(500).send({ message: 'Error retrieving book' });
    }
  });



app.put('/books/edit/:id', async (req, res: Response) => {
    console.log(req.body);
    const { author_id, title, pub_year, genre } = req.body;
    const bookId = req.params.id;
    try {
        const result = await db.run(
            `UPDATE books SET author_id = $author_id, title = $title, pub_year = $pub_year, genre = $genre WHERE id = $bookId`,
            { $author_id: author_id, $title: title, $pub_year: pub_year, $genre: genre, $bookId: bookId }
          );
  
      if (result.changes === 0) {
        return res.status(404).send({ message: 'Book not found' });
      }
      const book = await db.get(
        'SELECT * FROM books WHERE id = $bookId',
        { $bookId: bookId }
      );
      
      return res.status(200).json({ data: book });
    } catch (error) {
      return res.status(500).send({ message: 'Error updating book' });
    }
});

app.delete("/api/books/:id", async (req, res: Response) => {
    try{
        let id = req.params.id;
        await db.run(`DELETE FROM books WHERE id = '${id}'`);
        let books = await db.all("SELECT * FROM books");
        console.log("Books", books);
        return res.json({response: books});
    }
    catch (err){
        return res.json({message: "Entry could not be deleted"});
    }
});

//
// ASYNC/AWAIT EXAMPLE
//

function sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
// need async keyword on request handler to use await inside it
app.get("/bar", async (req, res: FooResponse) => {
    console.log("Waiting...");
    // await is equivalent to calling sleep.then(() => { ... })
    // and putting all the code after this in that func body ^
    await sleep(3000);
    // if we omitted the await, all of this code would execute
    // immediately without waiting for the sleep to finish
    console.log("Done!");
    return res.sendStatus(200);
});
// test it out! while server is running:
// curl http://localhost:3000/bar

// run server
let port = 3000;
let host = "localhost";
let protocol = "http";
app.listen(port, host, () => {
    console.log(`${protocol}://${host}:${port}`);
});
