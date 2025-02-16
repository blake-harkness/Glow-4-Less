import React, { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './GiveItAGo.css';
import { initializeOpenAI, getOpenAIInstance } from './services/openai';
import { supabase } from './lib/supabase';
import { incrementUsage, getRemainingUsage, getSubscription } from './services/subscription';

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

        // Get remaining usage
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
      } finally {
        setLoading(false); // Ensure loading is set to false here
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
    if (!image || !selectedCountry) return;

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
        // Try to reinitialize OpenAI
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

      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: `You are an intelligent shopping assistant that helps users find cheaper alternatives to makeup products by analyzing images and finding availability in their country (${selectedCountry}). Return 3 different products their price listing them 1. 2. 3., a short description of why its good and a link to the google search for them.` },
              { type: "image_url", image_url: { url: image } }
            ],
          },
        ],
        max_tokens: 1000,
      });

      if (response?.choices?.[0]?.message?.content) {
        const alternatives = response.choices[0].message.content.split(/\d+\.\s+/).filter(line => line.trim() !== "");
        
        if (alternatives.length > 0) {
          // First increment usage and update the remaining count
          const success = await incrementUsage(user.id);
          if (success) {
            const remaining = await getRemainingUsage(user.id);
            setRemainingUsage(remaining);
          } else {
            throw new Error("Failed to update usage count. Please try again.");
          }
          
          // Only set alternatives after successful usage increment
          setAlternatives(alternatives);
        } else {
          throw new Error("No valid alternatives found. Please try again with a clearer image.");
        }
      } else {
        throw new Error("No alternatives found. Please try again with a clearer image.");
      }
    } catch (err: any) {
      console.error('Error:', err);
      setError(err.message || 'An error occurred while processing your request.');
    } finally {
      setLoading(false);
    }
  };

  const formatOutput = (text: string) => {
    // Convert new lines to <br /> and make links clickable
    return text
      .replace(/(\*\*(.*?)\*\*)/g, '<strong>$2</strong>') // Bold text
      .replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>') // Links
      .replace(/\n/g, '<br /><br />'); // New lines with extra space
  };

  return (
    <div className="give-it-a-go-content">
      <h2>Find Your Perfect Match</h2>
      <p>Upload a photo of your favorite makeup product and discover affordable alternatives available in your region.</p>
      <p>Our AI-powered system will analyze your product and suggest the best matches for your beauty needs.</p>
      
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

      <div className="button-group">
        <button 
          className="submit-button" 
          onClick={() => fileInputRef.current?.click()}
          disabled={remainingUsage <= 0}
        >
          Choose Product Photo
        </button>
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

      {image && (
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
        disabled={!image || !selectedCountry || remainingUsage <= 0 || loading}
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