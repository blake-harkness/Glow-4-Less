import React, { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './GiveItAGo.css';
import { initializeOpenAI, getOpenAIInstance } from './services/openai';
import { supabase } from './lib/supabase';
import { incrementUsage, getRemainingUsage, getSubscription } from './services/subscription';
import type { ChatCompletionContentPart } from 'openai/resources/chat/completions';

// Complete list of countries
const countries = [
  "Afghanistan", "Albania", "Algeria", "Andorra", "Angola", "Antigua and Barbuda", "Argentina", "Armenia", "Australia", "Austria",
  "Azerbaijan", "Bahamas", "Bahrain", "Bangladesh", "Barbados", "Belarus", "Belgium", "Belize", "Benin", "Bhutan",
  "Bolivia", "Bosnia and Herzegovina", "Botswana", "Brazil", "Brunei", "Bulgaria", "Burkina Faso", "Burundi", "Cabo Verde", "Cambodia",
  "Cameroon", "Canada", "Central African Republic", "Chad", "Chile", "China", "Colombia", "Comoros", "Congo", "Costa Rica",
  "Croatia", "Cuba", "Cyprus", "Czech Republic", "Democratic Republic of the Congo", "Denmark", "Djibouti", "Dominica", "Dominican Republic", "Ecuador",
  "Egypt", "El Salvador", "Equatorial Guinea", "Eritrea", "Estonia", "Eswatini", "Ethiopia", "Fiji", "Finland", "France",
  "Gabon", "Gambia", "Georgia", "Germany", "Ghana", "Greece", "Grenada", "Guatemala", "Guinea", "Guinea-Bissau",
  "Guyana", "Haiti", "Honduras", "Hungary", "Iceland", "India", "Indonesia", "Iran", "Iraq", "Ireland",
  "Israel", "Italy", "Jamaica", "Japan", "Jordan", "Kazakhstan", "Kenya", "Kiribati", "Korea, North", "Korea, South",
  "Kuwait", "Kyrgyzstan", "Laos", "Latvia", "Lebanon", "Lesotho", "Liberia", "Libya", "Liechtenstein", "Lithuania",
  "Luxembourg", "Madagascar", "Malawi", "Malaysia", "Maldives", "Mali", "Malta", "Marshall Islands", "Mauritania", "Mauritius",
  "Mexico", "Micronesia", "Moldova", "Monaco", "Mongolia", "Montenegro", "Morocco", "Mozambique", "Myanmar", "Namibia",
  "Nauru", "Nepal", "Netherlands", "New Zealand", "Nicaragua", "Niger", "Nigeria", "North Macedonia", "Norway", "Oman",
  "Pakistan", "Palau", "Palestine", "Panama", "Papua New Guinea", "Paraguay", "Peru", "Philippines", "Poland", "Portugal",
  "Qatar", "Romania", "Russia", "Rwanda", "Saint Kitts and Nevis", "Saint Lucia", "Saint Vincent and the Grenadines", "Samoa", "San Marino", "Sao Tome and Principe",
  "Saudi Arabia", "Senegal", "Serbia", "Seychelles", "Sierra Leone", "Singapore", "Slovakia", "Slovenia", "Solomon Islands", "Somalia",
  "South Africa", "South Sudan", "Spain", "Sri Lanka", "Sudan", "Suriname", "Sweden", "Switzerland", "Syria", "Taiwan",
  "Tajikistan", "Tanzania", "Thailand", "Timor-Leste", "Togo", "Tonga", "Trinidad and Tobago", "Tunisia", "Turkey", "Turkmenistan",
  "Tuvalu", "Uganda", "Ukraine", "United Arab Emirates", "United Kingdom", "United States", "Uruguay", "Uzbekistan", "Vanuatu", "Vatican City",
  "Venezuela", "Vietnam", "Yemen", "Zambia", "Zimbabwe"
];

const GiveItAGo = () => {
  const [image, setImage] = useState<string | null>(null);
  const [selectedCountry, setSelectedCountry] = useState('New Zealand');
  const [loading, setLoading] = useState(false);
  const [alternatives, setAlternatives] = useState<string[]>([]);
  const [remainingUsage, setRemainingUsage] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [searchMode, setSearchMode] = useState<'photo' | 'text'>('text');
  const [productName, setProductName] = useState('');
  const [customRequest, setCustomRequest] = useState('find me a...');
  const [subscription, setSubscription] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const setup = async () => {
      try {
        // Check authentication
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          navigate('/login');
          return;
        }

        // Get subscription and remaining usage
        const userSubscription = await getSubscription(user.id);
        setSubscription(userSubscription);
        const remaining = await getRemainingUsage(user.id);
        setRemainingUsage(remaining);

        // Initialize OpenAI
        const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
        if (!apiKey) {
          setError("API key not found. Please check your environment variables.");
          return;
        }
        
        initializeOpenAI(apiKey);
      } catch (err) {
        console.error('Setup error:', err);
        setError('Failed to initialize the application.');
      }
    };

    setup();
  }, [navigate]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async () => {
    if ((!image && searchMode === 'photo') || (!productName && searchMode === 'text') || !selectedCountry) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate('/login');
      return;
    }

    // Check remaining usage
    if (remainingUsage <= 0) {
      const subscription = await getSubscription(user.id);
      setError(
        subscription?.subscription_tier === 'Basic' 
          ? 'You have reached your monthly limit. Please upgrade to Glow for more uses.'
          : subscription?.subscription_tier === 'Glow'
          ? 'You have reached your monthly limit. Upgrade to Premium for unlimited uses.'
          : 'You have reached your monthly limit.'
      );
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let openai = getOpenAIInstance();
      if (!openai) {
        const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
        if (!apiKey) {
          throw new Error("OpenAI API key not found. Please check your environment variables.");
        }
        initializeOpenAI(apiKey);
        openai = getOpenAIInstance();
        if (!openai) {
          throw new Error("Failed to initialize OpenAI. Please refresh the page and try again.");
        }
      }

      let prompt = `You are an intelligent shopping assistant that helps users find cheaper alternatives to makeup products`;
      if (searchMode === 'photo') {
        prompt += ` by analyzing images`;
      }
      prompt += ` and finding availability in their country (${selectedCountry}).`;

      if (subscription?.subscription_tier !== 'Basic' && customRequest && customRequest !== 'find me a...') {
        prompt += ` The user has a specific request: "${customRequest}"`;
      }

      prompt += ` Return 3 different products their price listing them 1. 2. 3., a short description of why its good and a link to the google search for them.`;

      const messages = [{
        role: "user" as const,
        content: searchMode === 'photo' 
          ? [
              { 
                type: "text" as const, 
                text: prompt 
              } as ChatCompletionContentPart,
              { 
                type: "image_url" as const, 
                image_url: { url: image! } 
              } as ChatCompletionContentPart
            ]
          : prompt + ` The product name is: ${productName}`
      }];

      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages,
        max_tokens: 1000,
      });

      if (response?.choices?.[0]?.message?.content) {
        const alternatives = response.choices[0].message.content.split(/\d+\.\s+/).filter(line => line.trim() !== "");
        
        if (alternatives.length > 0) {
          const success = await incrementUsage(user.id);
          if (success) {
            const remaining = await getRemainingUsage(user.id);
            setRemainingUsage(remaining);
          } else {
            throw new Error("Failed to update usage count. Please try again.");
          }
          
          setAlternatives(alternatives);
        } else {
          throw new Error("No valid alternatives found. Please try again with a clearer image or product name.");
        }
      } else {
        throw new Error("No alternatives found. Please try again with a clearer image or product name.");
      }
    } catch (err: any) {
      console.error('Error:', err);
      setError(err.message || 'An error occurred while processing your request.');
    } finally {
      setLoading(false);
    }
  };

  const formatOutput = (text: string) => {
    return text
      .replace(/(\*\*(.*?)\*\*)/g, '<strong>$2</strong>')
      .replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>')
      .replace(/\n/g, '<br /><br />');
  };

  const isCustomRequestEnabled = subscription?.subscription_tier === 'Glow' || subscription?.subscription_tier === 'Premium';

  return (
    <div className="give-it-a-go-content">
      <h2>Find Your Perfect Match</h2>
      <p>Discover affordable alternatives to your favorite beauty products available in your region.</p>
      
      {remainingUsage > 0 ? (
        <p className="usage-info">
          You have {remainingUsage === Infinity ? 'unlimited' : remainingUsage} uses remaining this month.
        </p>
      ) : (
        <p className="usage-warning">
          You have reached your monthly limit. 
          <button onClick={() => navigate('/pricing')} className="upgrade-link">
            Upgrade your plan for more uses
          </button>
        </p>
      )}

      {error && (
        <div className="error-message">
          {error}
          <button onClick={() => navigate('/pricing')} className="upgrade-link">
            View Pricing Plans
          </button>
        </div>
      )}

      <div className="search-options">
        <button 
          className={`search-option ${searchMode === 'text' ? 'active' : ''}`}
          onClick={() => setSearchMode('text')}
        >
          Search by Name
        </button>
        <button 
          className={`search-option ${searchMode === 'photo' ? 'active' : ''}`}
          onClick={() => setSearchMode('photo')}
        >
          Search by Photo
        </button>
      </div>

      <div className="search-section">
        {searchMode === 'text' ? (
          <input
            type="text"
            className="search-input"
            placeholder="Enter product name"
            value={productName}
            onChange={(e) => setProductName(e.target.value)}
            disabled={remainingUsage <= 0}
          />
        ) : (
          <button 
            className="submit-button" 
            onClick={() => fileInputRef.current?.click()}
            disabled={remainingUsage <= 0}
          >
            Choose Product Photo
          </button>
        )}

        <div className="custom-request">
          {isCustomRequestEnabled && (
            <span className="custom-request-badge">Glow Feature</span>
          )}
          <input
            type="text"
            className="search-input"
            placeholder="find me a..."
            value={customRequest}
            onChange={(e) => setCustomRequest(e.target.value)}
            disabled={!isCustomRequestEnabled || remainingUsage <= 0}
          />
        </div>

        <div className="country-selection">
          <input
            list="countries"
            id="country"
            value={selectedCountry}
            onChange={(e) => setSelectedCountry(e.target.value)}
            placeholder="Select your country"
            disabled={remainingUsage <= 0}
          />
          <datalist id="countries">
            {countries.map((country, index) => (
              <option key={index} value={country} />
            ))}
          </datalist>
        </div>
      </div>

      <input
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        ref={fileInputRef}
        onChange={handleFileChange}
      />

      {image && searchMode === 'photo' && (
        <div className="preview-container">
          <img
            src={image}
            alt="Product Preview"
          />
        </div>
      )}

      <button 
        className="submit-button" 
        onClick={handleSubmit}
        disabled={
          (searchMode === 'photo' && !image) || 
          (searchMode === 'text' && !productName) || 
          !selectedCountry || 
          remainingUsage <= 0 || 
          loading
        }
      >
        {loading ? 'Processing...' : 'Find Alternatives'}
      </button>

      {alternatives.length > 0 && (
        <div className="results">
          <ul className="alternatives-list">
            {alternatives.map((alt, index) => (
              <li 
                key={index} 
                className="alternative-item" 
                dangerouslySetInnerHTML={{ __html: formatOutput(alt) }} 
              />
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default GiveItAGo;