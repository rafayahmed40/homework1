import React, {useState, useEffect} from 'react';
import logo from './logo.svg';
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
    <div>
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
      <form onSubmit={handleSubmit}>
        <input type="text" name="author_id" placeholder='Enter Author ID' />
        <input type="text" name="genre" placeholder="Enter Genre"/>
        <input type="number" name="pub_year" placeholder='Enter Publish Year'/>
        <input type="text" name="title" placeholder="Enter Title"/>
        <button type="submit">Add Data</button>
      </form>
      <ul>
        <h1>
          Books in Database
        </h1>
        {data.map((item) => (
          <li key={item.id}>{item.title}, ID: {item.id}</li>
        ))}
      </ul>
    </div>
  );
}

function App(){
  return (
    <div>
      <h1>
      Books Catalog
    </h1>
    <Search/>
    <DisplayTable/>
    </div>
  );
}


export default App;
