import React, { useState } from 'react';
import { BrowserRouter as Router, Route, Routes, Link, } from 'react-router-dom';
import './App.css';
import Login from './Login';
import Home from './Home';
import GiveItAGo from './GiveItAGo';
import Settings from './Settings';
import Pricing from './Pricing';
import Support from './Support';
import { supabase } from './lib/supabase'; // Import Supabase client

const App = () => {
  const [user, setUser] = React.useState<any>(null); // State to hold user information
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  React.useEffect(() => {
    const fetchSession = async () => {
        const { data } = await supabase.auth.getSession(); // Await the session
        if (data) {
            setUser(data.session?.user); // Set user if session exists
        }
    };

    fetchSession(); // Call the fetch function

    // Subscribe to auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
        setUser(session?.user); // Update user state on auth state change
    });

    return () => {
        subscription?.unsubscribe(); // Clean up subscription on unmount
    };
  }, []);

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (!error) {
      window.location.href = '/login';
    }
  };

  return (
    <Router>
      <div>
        <nav className="navbar">
          <div className="navbar-title">Glow 4 Less</div>
          <button 
            className="mobile-menu-btn" 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle menu"
          >
            {isMenuOpen ? '✕' : '☰'}
          </button>
          <ul className={`nav-links ${isMenuOpen ? 'active' : ''}`}>
            <li>
              <Link to="/" onClick={() => setIsMenuOpen(false)}>Home</Link>
            </li>
            <li>
              <Link to="/pricing" onClick={() => setIsMenuOpen(false)}>Pricing</Link>
            </li>
            <li>
              <Link to="/support" onClick={() => setIsMenuOpen(false)}>Support</Link>
            </li>
            {user ? (
              <>
                <li>
                  <Link to="/give-it-a-go" onClick={() => setIsMenuOpen(false)}>Give It a Go</Link>
                </li>
                <li>
                  <Link to="/settings" onClick={() => setIsMenuOpen(false)}>Settings</Link>
                </li>
                <li>
                  <button 
                    onClick={() => {
                      handleSignOut();
                      setIsMenuOpen(false);
                    }} 
                    className="nav-signout"
                  >
                    Sign Out
                  </button>
                </li>
                <li className="nav-username">
                  {user.user_metadata.username || 'User'}
                </li>
              </>
            ) : (
              <li>
                <Link to="/login" onClick={() => setIsMenuOpen(false)}>Login</Link>
              </li>
            )}
          </ul>
        </nav>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/give-it-a-go" element={<GiveItAGo />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/support" element={<Support />} />
        </Routes>
        <footer className="footer">
          <p>&copy; 2025 Glow 4 Less. All rights reserved.</p>
        </footer>
      </div>
    </Router>
  );
};

export default App;
