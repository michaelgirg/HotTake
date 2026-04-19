import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppNav from '../components/AppNav';
import { get } from '../lib/api';

export default function SearchPage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const debounceRef = useRef(null);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setSelected(null);
      return undefined;
    }

    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      setError('');
      setSelected(null);
      try {
        const data = await get(`/api/titles/search?q=${encodeURIComponent(query)}`);
        setResults(data);
      } catch (err) {
        if (err.status === 401) {
          navigate('/login');
          return;
        }
        setError(err.message || 'Search failed.');
      } finally {
        setLoading(false);
      }
    }, 350);

    return () => clearTimeout(debounceRef.current);
  }, [navigate, query]);

  return (
    <div className="app-page">
      <AppNav />
      <main className="page-content">
        <section className="page-heading">
          <h1>Search titles</h1>
          <p>Find anime, manga, movies, and TV shows stored in HotTake.</p>
        </section>

        <input
          type="text"
          placeholder="Search by title, genre, or type"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          className="search-input"
        />

        {loading && <p className="status-text">Searching...</p>}
        {error && <p className="error-message">{error}</p>}
        {!loading && query && results.length === 0 && (
          <p className="status-text">No results found for "{query}"</p>
        )}

        <div className="search-layout">
          {results.length > 0 && (
            <ul className="results-list">
              {results.map((title) => (
                <li
                  key={title.id}
                  className={`result-item ${selected?.id === title.id ? 'active' : ''}`}
                  onClick={() => setSelected(title)}
                >
                  <span className="result-name">{title.name}</span>
                  <span className="result-type">{title.type}</span>
                </li>
              ))}
            </ul>
          )}

          {selected && (
            <aside className="title-detail">
              <h2>{selected.name}</h2>
              <div className="detail-row">
                <span className="detail-label">Type</span>
                <span className="detail-value">{selected.type}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Genre</span>
                <span className="detail-value">{selected.genre}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Released</span>
                <span className="detail-value">{selected.release_year}</span>
              </div>
            </aside>
          )}
        </div>
      </main>
    </div>
  );
}
