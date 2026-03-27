import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

export default function RegisterPage() {
    const navigate = useNavigate();
    const [form, setForm] = useState({ username: '', email: '', password: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!form.username || !form.email || !form.password) {
            return setError('All fields are required.');
        }
        if (form.password.length < 6) {
            return setError('Password must be at least 6 characters.');
        }

        setLoading(true);
        try {
            const res = await fetch('http://localhost:3001/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(form),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error || 'Registration failed.');
            } else {
                navigate('/login');
            }
        } catch (err) {
            setError('Could not connect to server.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <h1 className="logo">HotTake 🔥</h1>
            <div className="auth-card">
                <h2>Create an account</h2>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Username</label>
                        <input
                            name="username"
                            type="text"
                            placeholder="Enter username"
                            value={form.username}
                            onChange={handleChange}
                        />
                    </div>
                    <div className="form-group">
                        <label>Email</label>
                        <input
                            name="email"
                            type="email"
                            placeholder="Enter email"
                            value={form.email}
                            onChange={handleChange}
                        />
                    </div>
                    <div className="form-group">
                        <label>Password</label>
                        <input
                            name="password"
                            type="password"
                            placeholder="Min 6 characters"
                            value={form.password}
                            onChange={handleChange}
                        />
                    </div>
                    {error && <p className="error-message">{error}</p>}
                    <button type="submit" className="btn-primary" disabled={loading}>
                        {loading ? 'Creating account...' : 'Register'}
                    </button>
                </form>
                <p className="auth-switch">
                    Already have an account? <Link to="/login">Log in</Link>
                </p>
            </div>
        </div>
    );
}