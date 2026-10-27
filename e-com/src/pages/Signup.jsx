import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import './Auth.css';

const Signup = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { register } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Validate email domain
        const allowedDomains = [
            'gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'live.com',
            'icloud.com', 'aol.com', 'protonmail.com', 'zoho.com', 'mail.com',
            'yandex.com', 'gmx.com', 'fastmail.com', 'tutanota.com',
            'yahoo.co.in', 'rediffmail.com', 'msn.com', 'example.com', 'test.com', 'shopnest.com'
        ];
        const emailDomain = email.split('@')[1]?.toLowerCase();
        if (!emailDomain || !allowedDomains.includes(emailDomain)) {
            setError('Please use a valid email from a recognized provider (e.g., Gmail, Yahoo, Outlook)');
            return;
        }
        
        try {
            setError('');
            await register(name, email, password);
            navigate('/');
        } catch (err) {
            setError('Failed to create account: ' + err.message);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <h2>Sign Up</h2>
                {error && <div className="auth-error">{error}</div>}
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Name</label>
                        <input
                            type="text"
                            required
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                    </div>
                    <div className="form-group">
                        <label>Email</label>
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                        <p style={{ fontSize: '11px', color: '#888', marginTop: '4px' }}>Use a valid email (Gmail, Yahoo, Outlook, etc.)</p>
                    </div>
                    <div className="form-group">
                        <label>Password</label>
                        <input
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>
                    <button type="submit" className="auth-btn">Sign Up</button>
                </form>
                <div className="auth-footer">
                    Already have an account? <Link to="/login">Login</Link>
                </div>
            </div>
        </div>
    );
};

export default Signup;
