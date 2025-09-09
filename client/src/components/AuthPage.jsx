import React, { useState } from 'react';
import Header from './Header';
import Footer from './Footer';

const AuthPage = ({ onLoginSuccess }) => {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccessMessage('');

        const url = isLogin ? '/api/login' : '/api/register';
        const payload = isLogin ? { email, password } : { name, email, password };

        try {
            const response = await fetch(`http://localhost:5000/api/auth${url.replace('/api', '')}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.msg || 'Something went wrong');
            }

            if (isLogin) {
                onLoginSuccess(data);
            } else {
                setSuccessMessage('Registration successful! Please sign in.');
                setIsLogin(true);
                setName('');
                setEmail('');
                setPassword('');
            }
        } catch (err) {
            setError(err.message);
        }
    };
    
    return (
        <div className="min-h-screen flex flex-col">
            <Header />
            <div className="flex-grow auth-container text-gray-800 flex items-center justify-center p-4">
                <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-md fade-in">
                    <h2 className="text-4xl font-bold text-center text-gray-800 mb-6">{isLogin ? 'Welcome Back!' : 'Create Account'}</h2>
                    {error && <p className="bg-red-100 text-red-700 p-3 rounded-md mb-4 text-center">{error}</p>}
                    {successMessage && <p className="bg-green-100 text-green-700 p-3 rounded-md mb-4 text-center">{successMessage}</p>}
                    <form onSubmit={handleSubmit}>
                        {!isLogin && (
                            <div className="mb-4">
                                <label className="block text-gray-600 mb-2" htmlFor="name">Name</label>
                                <input
                                    type="text" id="name" value={name} onChange={(e) => setName(e.target.value)}
                                    className="w-full bg-gray-100 border border-gray-300 rounded-md py-2 px-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-500" required
                                />
                            </div>
                        )}
                        <div className="mb-4">
                            <label className="block text-gray-600 mb-2" htmlFor="email">Email Address</label>
                            <input
                                type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-gray-100 border border-gray-300 rounded-md py-2 px-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-500" required
                            />
                        </div>
                        <div className="mb-6">
                            <label className="block text-gray-600 mb-2" htmlFor="password">Password</label>
                            <input
                                type="password" id="password" value={password} onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-gray-100 border border-gray-300 rounded-md py-2 px-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-500" required
                            />
                        </div>
                        <button type="submit" className="w-full btn-primary text-white font-bold py-2 px-4 rounded-lg">
                            {isLogin ? 'Sign In' : 'Sign Up'}
                        </button>
                    </form>
                    <button onClick={() => { setIsLogin(!isLogin); setError(''); setSuccessMessage(''); }} className="w-full mt-4 text-sm text-purple-600 hover:underline">
                        {isLogin ? 'Need an account? Sign Up' : 'Already have an account? Sign In'}
                    </button>
                </div>
            </div>
            <Footer />
        </div>
    );
};

export default AuthPage;