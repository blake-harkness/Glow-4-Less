import './Login.css';
import { useState } from 'react';
import { supabase } from './lib/supabase'
import { useNavigate } from 'react-router-dom';
import { createOrUpdateSubscription } from './services/subscription';

const Login = () => {
    const [username, setUsername] = useState('');
    const [registerEmail, setRegisterEmail] = useState('');
    const [registerPassword, setRegisterPassword] = useState('');
    const [loginEmail, setLoginEmail] = useState('');
    const [loginPassword, setLoginPassword] = useState('');
    const [message, setMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const navigate = useNavigate();

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            // Register the user
            const { data, error } = await supabase.auth.signUp({
                email: registerEmail,
                password: registerPassword,
                options: {
                    data: {
                        username,
                    },
                },
            });

            if (error) {
                console.error('Error registering:', error);
                setMessage(`Registration failed: ${error.message}`);
                return;
            }

            if (!data.user) {
                setMessage('Registration failed: No user data returned');
                return;
            }

            // Create a basic subscription for the new user
            const subscription = await createOrUpdateSubscription(data.user.id, 'Basic');
            
            if (!subscription) {
                return;
            }

            console.log('User registered:', data.user);
            setMessage('Registration successful! Please confirm your email before logging in.');
            setUsername('');
            setRegisterEmail('');
            setRegisterPassword('');
        } catch (err) {
            console.error('Registration error:', err);
            setMessage('An unexpected error occurred during registration. Please try again.');
        }
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        const { data, error } = await supabase.auth.signInWithPassword({
            email: loginEmail,
            password: loginPassword,
        });

        if (error) {
            console.error('Error logging in:', error.message);
            setErrorMessage('Login failed. Please check your credentials and try again.');
        } else {
            console.log('User logged in:', data.user);
            navigate('/give-it-a-go');
        }
    };

    return (
        <div className="login-container">
            <h2>Begin Your Beauty Journey</h2>
            {message && <p className="message success-message">{message}</p>}
            {errorMessage && <p className="message error-message">{errorMessage}</p>}
            <div className="form-container">
                <form className="login-form" onSubmit={handleLogin}>
                    <h3>Welcome Back</h3>
                    <input 
                        type="email" 
                        placeholder="Email" 
                        value={loginEmail} 
                        onChange={(e) => setLoginEmail(e.target.value)} 
                        required 
                    />
                    <input 
                        type="password" 
                        placeholder="Password" 
                        value={loginPassword} 
                        onChange={(e) => setLoginPassword(e.target.value)} 
                        required 
                    />
                    <button type="submit" className="login-button">Login</button>
                </form>
                <form className="register-form" onSubmit={handleRegister}>
                    <h3>Create Account</h3>
                    <input 
                        type="text" 
                        placeholder="Username" 
                        value={username} 
                        onChange={(e) => setUsername(e.target.value)} 
                        required 
                    />
                    <input 
                        type="email" 
                        placeholder="Email" 
                        value={registerEmail} 
                        onChange={(e) => setRegisterEmail(e.target.value)} 
                        required 
                    />
                    <input 
                        type="password" 
                        placeholder="Password" 
                        value={registerPassword} 
                        onChange={(e) => setRegisterPassword(e.target.value)} 
                        required 
                    />
                    <button type="submit" className="register-button">Register</button>
                </form>
            </div>
        </div>
    );
};

export default Login; 