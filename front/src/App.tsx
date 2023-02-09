import React, {useState, useEffect} from 'react';
import './App.css';

interface SearchResult {
  author_id: string;
  genre: string;
  id: number;
  pub_year: string;
  title: string;
}

interface Data {
  author_id: string;
  genre: string;
  id: number;
  pub_year: string;
  title: string;
}

interface Book {
  title: string;
  pub_year: string;
  author_id: string;
  genre: string;
}


function useSearch(id: string) {
  const [results, setResults] = useState<SearchResult[]>([]);

  useEffect(() => {
    async function getResults() {
      const response = await fetch(`http://localhost:3000/api/books?id=${id}`);
      let results = await response.json();
      results = results['response'];
      console.log(results)
      setResults(results);
    }

    if (id) {
      getResults();
    } else {
      setResults([]);
    }
  }, [id]);

  return results;
}

function Search() {
  const [id, setId] = useState('');
  const [query, setQuery] = useState('');
  const results = useSearch(query);

  function clickHandler() {
    setQuery(id);
  }

  return (
    <div id="search-div">
      <h1>
        Search Book by ID
      </h1>

      <input
        type="text"
        value={id}
        placeholder="Input Book Id"
        onChange={e => setId(e.target.value)}
      />
      <button onClick={clickHandler}>Search</button>
      <ul>
        {results.map(result => (
          <li key={result.id}>
          <h2>{result.title}</h2>
          <p>Author ID: {result.author_id}</p>
          <p>Genre: {result.genre}</p>
          <p>Publication Year: {result.pub_year}</p>
        </li>
        ))}
      </ul>
    </div>
  );
}

function DisplayTable() {
  const [data, setData] = useState<Data[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const response = await fetch('http://localhost:3000/api/books');
      let results = await response.json();
      results = results['response']
      setData(results);
    };

    fetchData();
  }, []);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.target as HTMLFormElement);
    const newData = {
      author_id: formData.get('author_id') as string,
      genre: formData.get('genre') as string,
      id: 1,
      pub_year: formData.get('pub_year') as string,
      title: formData.get('title') as string,
    };

    await fetch('http://localhost:3000/api/books', {
      method: 'POST',
      body: JSON.stringify(newData),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    setData([...data, newData]);
  };

  return (
    <div>
      <h1>
        Add new book to database
      </h1>

      <form onSubmit={handleSubmit}>
        <input type="text" name="author_id" placeholder='Enter Author ID' />
        <input type="text" name="genre" placeholder="Enter Genre"/>
        <input type="number" name="pub_year" placeholder='Enter Publish Year'/>
        <input type="text" name="title" placeholder="Enter Title"/>
        <button type="submit">Add Data</button>
      </form>
      <h1>
          Books in Database
        </h1>
      <div id="db-div">
      <ul>
        {data.map((item) => (
          <li key={item.id}>Title: {item.title}</li>
        ))}
      </ul>
      </div>
    </div>
  );
}

function BookForm() {
  const [bookId, setBookId] = useState('');
  const [book, setBook] = useState<Book | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchBook = async (id: string) => {
    setIsLoading(true);

    try {
      console.log(id);
      const response = await fetch(`http://localhost:3000/books/checkBook/${id}`);

      if (response.status === 200) {
        const book = await response.json();
        setBook(book);
      } else if (response.status === 404) {
        alert('Book not found');
      }
    } catch (error) {
      console.error(error);
    }

    setIsLoading(false);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!book) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:3000/books/edit/${bookId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(book)
      });

      if (response.status === 200) {
        alert('Book updated successfully');
      } else {
        console.error('Failed to update book');
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!book) {
      return;
    }

    setBook({ ...book, [event.target.name]: event.target.value });
  };

  return (
    <div>
      <form>
        <div>
          <h1>
            Search and Edit Book
          </h1>

          <label htmlFor="bookId">Book ID:</label>
          <input type="text" id="bookId" value={bookId} onChange={event => setBookId(event.target.value)} />
        </div>
        <button type="button" onClick={() => fetchBook(bookId)}>
          Search
        </button>
      </form>
      {isLoading ? (
        <div>Loading...</div>
      ) : book ? (
        <form onSubmit={handleSubmit}>
          <div>
            <label htmlFor="title">Title:</label>
            <input type="text" id="title" name="title" value={book.title} onChange={handleChange} />
          </div>
          <div>
            <label htmlFor="pub_year">Publish Year:</label>
            <input type="text" id="pub_year" name="pub_year" value={book.pub_year} onChange={handleChange} />
          </div>
          <div>
            <label htmlFor="author_id">Author ID:</label>
            <input type="text" id="author_id" name="author_id" value={book.author_id} onChange={handleChange} />
            </div>
            <div>
            <label htmlFor="genre">Genre:</label>
            <input type="text" id="genre" name="genre" value={book.genre} onChange={handleChange} />
            </div>
            <button type="submit">Submit</button>
        </form>
      ) : null}
    </div>
  );
};




function App(){
  return (
    <div>
      <h1>
      Books Catalog
    </h1>
    <Search/>
    <DisplayTable/>
    <BookForm/>
    </div>
  );
}

export default App;


