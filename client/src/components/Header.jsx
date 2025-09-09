import React from 'react';

const Header = ({ user, onLogout, onViewHistory, onBack }) => {
    return (
        <header className="dashboard-header shadow-lg">
            <div className="container mx-auto px-4 sm:px-6 py-4 flex justify-between items-center">
                <h1 className="text-xl sm:text-2xl font-bold text-white">Excel Analysis Platform</h1>
                {user && (
                    <div className="flex items-center">
                        <span className="hidden sm:inline mr-4 text-white">Welcome, {user.name}</span>
                        {onViewHistory && <button onClick={onViewHistory} className="btn-primary text-white font-bold py-2 px-4 rounded-lg mr-2 sm:mr-4">History</button>}
                        {onBack && <button onClick={onBack} className="btn-primary text-white font-bold py-2 px-4 rounded-lg mr-2 sm:mr-4">Dashboard</button>}
                        <button onClick={onLogout} className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-lg transition duration-300">Logout</button>
                    </div>
                )}
            </div>
        </header>
    );
};

export default Header;