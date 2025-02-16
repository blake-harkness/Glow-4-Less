import React from 'react';
import { BrowserRouter as Router, Route, Routes, Link, } from 'react-router-dom';
import './App.css';
import Login from './Login';
import Home from './Home';
import GiveItAGo from './GiveItAGo';
import Settings from './Settings';
import Pricing from './Pricing';
import { supabase } from './lib/supabase'; // Import Supabase client

const App = () => {
  const [alternatives] = React.useState<string[]>([]);
  const [user, setUser] = React.useState<any>(null); // State to hold user information

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
          <ul className="nav-links">
            <li>
              <Link to="/home">Home</Link>
            </li>
            <li>
              <Link to="/pricing">Pricing</Link>
            </li>
            {user ? (
              <>
                <li>
                  <Link to="/give-it-a-go">Give It a Go</Link>
                </li>
                <li>
                  <Link to="/settings">Settings</Link>
                </li>
                <li>
                  <button onClick={handleSignOut} className="nav-signout">
                    Sign Out
                  </button>
                </li>
                <li className="nav-username">
                  {user.user_metadata.username || 'User'}
                </li>
              </>
            ) : (
              <li>
                <Link to="/login">Login</Link>
              </li>
            )}
          </ul>
        </nav>
        <Routes>
          <Route path="/" element={
            <>
              <h1 className="app-title">Makeup Product Alternatives Finder</h1>
              {/* Removed upload section and button */}
              <div className="results">
                {alternatives.length > 0 && (
                  <ul className="alternatives-list">
                    {alternatives.map((alt, index) => (
                      <li key={index} className="alternative-item">{alt}</li>
                    ))}
                  </ul>
                )}
              </div>
            </>
          } />
          <Route path="/home" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/give-it-a-go" element={<GiveItAGo />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/pricing" element={<Pricing />} />
        </Routes>
        <footer className="footer">
          <p>&copy; 2025 Glow 4 Less. All rights reserved.</p>
        </footer>
      </div>
    </Router>
  );
};

export default App;
