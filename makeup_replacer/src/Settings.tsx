import React from 'react';
import { supabase } from './lib/supabase';
import { useNavigate } from 'react-router-dom';
import './Settings.css';
import { getSubscription, getRemainingUsage, UserSubscription } from './services/subscription';

const Settings = () => {
    const [user, setUser] = React.useState<any>(null);
    const [subscription, setSubscription] = React.useState<UserSubscription | null>(null);
    const [remainingUsage, setRemainingUsage] = React.useState<number>(0);
    const navigate = useNavigate();

    React.useEffect(() => {
        const fetchUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                setUser(user);
                // Fetch subscription data
                const sub = await getSubscription(user.id);
                setSubscription(sub);
                const remaining = await getRemainingUsage(user.id);
                setRemainingUsage(remaining);
            } else {
                navigate('/login');
            }
        };

        fetchUser();
    }, [navigate]);

    const handleSignOut = async () => {
        const { error } = await supabase.auth.signOut();
        if (!error) {
            navigate('/login');
        }
    };

    const handleUpgrade = () => {
        navigate('/pricing');
    };

    if (!user) {
        return <div className="settings-container">Loading...</div>;
    }

    return (
        <div className="settings-container">
            <div className="settings-content">
                <h2>Account Settings</h2>
                
                <div className="profile-section">
                    <div className="profile-header">
                        <div className="profile-avatar">
                            {user.user_metadata.username ? user.user_metadata.username[0].toUpperCase() : 'U'}
                        </div>
                        <h3>{user.user_metadata.username || 'User'}</h3>
                    </div>

                    <div className="info-grid">
                        <div className="info-item">
                            <label>Username</label>
                            <p>{user.user_metadata.username || 'Not set'}</p>
                        </div>
                        <div className="info-item">
                            <label>Email</label>
                            <p>{user.email}</p>
                        </div>
                        <div className="info-item">
                            <label>Membership Tier</label>
                            <p className="membership-tag">
                                {subscription?.subscription_tier || 'Basic'}
                            </p>
                        </div>
                        <div className="info-item">
                            <label>Remaining Monthly Uses</label>
                            <p className="usage-tag">
                                {remainingUsage === Infinity ? 'Unlimited' : remainingUsage}
                            </p>
                        </div>
                        <div className="info-item">
                            <label>Account Created</label>
                            <p>{new Date(user.created_at).toLocaleDateString()}</p>
                        </div>
                    </div>

                    <div className="settings-actions">
                        {subscription?.subscription_tier !== 'Glow Premium' && (
                            <button onClick={handleUpgrade} className="upgrade-button">
                                Upgrade to {subscription?.subscription_tier === 'Glow' ? 'Premium' : 'Glow'}
                            </button>
                        )}
                        <button onClick={handleSignOut} className="signout-button">Sign Out</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Settings; 