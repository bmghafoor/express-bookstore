process.env.NODE_ENV = "test";
const request = require("supertest");
const app = require("../app");
const db = require("../db");

// isbn of sample book
let sample_book;

beforeEach(async () => {
  let result = await db.query(`
    INSERT INTO
      books (isbn, amazon_url,author,language,pages,publisher,title,year)
      VALUES(
        '123456789',
        'https://amazon.com/GoT',
        'John Deere',
        'English',
        300,
        'Activision',
        'Game of Thrones',
        2008)
      RETURNING *`);

  sample_book = result.rows[0];
});

describe("GET /books", () => {
  test("Gets a list of sample book created", async () => {
    const response = await request(app).get(`/books`);
    const books = response.body.books;
    expect(books).toHaveLength(1);
    expect(books[0].isbn).toEqual(sample_book.isbn);
    expect(books[0].amazon_url).toEqual(sample_book.amazon_url);
  });
});

describe("GET /books/:isbn", () => {
  test("Get a single book by isbn", async () => {
    const response = await request(app).get(`/books/${sample_book.isbn}`);
    const book = response.body.book;
    expect(book.isbn).toEqual(`${sample_book.isbn}`);
    expect(book.title).toEqual(`${sample_book.title}`);
  });
});

describe("POST /books", function () {
  test("Create a new book", async () => {
    const response = await request(app).post(`/books`).send({
      isbn: "987654321",
      amazon_url: "https://amazon.com/test",
      author: "tester",
      language: "english",
      pages: 10,
      publisher: "testing services",
      title: "test",
      year: 1997,
    });
    expect(response.statusCode).toBe(201);
    expect(response.body.book).toHaveProperty("isbn");
  });

  test("Prevents book creation without all required information", async () => {
    const response = await request(app).post(`/books`).send({
      amazon_url: "https://amazon.com/test2",
      author: "Tester2",
      language: "spanish",
      pages: 345,
      year: 2000,
    });
    expect(response.statusCode).toBe(400);
  });
});

describe("PUT /books/:isbn", async() => {
  test("Updates a single book", async() => {
    const response = await request(app).put(`/books/${sample_book.isbn}`).send({
      amazon_url: "https://amazon.com/GoT",
      author: "John Deere",
      language: "english",
      pages: 300,
      publisher: "New Publisher",
      title: "Harry Potter",
      year: 2002,
    });
    expect(response.body.book.title).toBe("Harry Potter");
    expect(response.body.book.publisher).toBe("New Publisher");
  });
});

afterEach(async function () {
  await db.query("DELETE FROM BOOKS");
});

afterAll(async function () {
  await db.end();
});
