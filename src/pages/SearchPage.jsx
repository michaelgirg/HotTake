import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

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
            return;
        }

        // Debounce — waits 400ms after user stops typing
        clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(async () => {
            setLoading(true);
            setError('');
            setSelected(null);
            try {
                const res = await fetch(
                    `http://localhost:3001/api/titles/search?q=${encodeURIComponent(query)}`,
                    { credentials: 'include' }
                );

                if (res.status === 401) {
                    navigate('/login');
                    return;
                }

                const data = await res.json();
                if (!res.ok) {
                    setError(data.error || 'Search failed.');
                } else {
                    setResults(data);
                }
            } catch (err) {
                setError('Could not connect to server.');
            } finally {
                setLoading(false);
            }
        }, 400);

        return () => clearTimeout(debounceRef.current);
    }, [query]);

    const handleLogout = async () => {
        await fetch('http://localhost:3001/api/auth/logout', {
            method: 'POST',
            credentials: 'include',
        });
        navigate('/login');
    };

    return (
        <div className="search-container">
            <div className="search-header">
                <h1 className="logo">HotTake 🔥</h1>
                <button className="btn-logout" onClick={handleLogout}>Log out</button>
            </div>

            <div className="search-box">
                <input
                    type="text"
                    placeholder="Search anime, manga, movies..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="search-input"
                />
            </div>

            {loading && <p className="search-status">Searching...</p>}
            {error && <p className="error-message">{error}</p>}
            {!loading && query && results.length === 0 && (
                <p className="search-status">No results found for "{query}"</p>
            )}

            <div className="search-layout">
                {/* PBI 10 — Results list */}
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

                {/* PBI 11 — Title detail panel */}
                {selected && (
                    <div className="title-detail">
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
                    </div>
                )}
            </div>
        </div>
    );
}