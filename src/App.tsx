import React, { useState } from 'react';
import * as PokerSolver from 'pokersolver';

export default function App() {
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState({ hand: '', winProb: 0 });

  // 1. Function to handle the Photo
  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  // 2. Logic to process the "Easy Way" (Mocking the AI call)
 // 1. Make sure your function is marked as 'async'
const analyzeHand = async () => {
  if (!image) {
    alert("Please upload or take a photo first!");
    return;
  }

  setLoading(true);

  try {
    // 2. This is the 'fetch' call that hits your /api/analyze.ts file
    const response = await fetch('/api/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ image }), // Sending the base64 photo
    });

    if (!response.ok) throw new Error('API request failed');

    const data = await response.json(); 
    // data looks like: { hand: ['As', 'Ad'], board: ['2h', '7d', 'Jc'] }

    // 3. Use 'pokersolver' to describe the hand strength
    // We combine the hand and board cards into one array for the solver
    const combinedCards = [...data.hand, ...data.board];
    const solvedHand = PokerSolver.Hand.solve(combinedCards);

    // 4. Update the UI state with the real data
    setResults({
      hand: solvedHand.descr, // e.g., "Full House, Aces over Kings"
      winProb: 75.4,          // For now, we can hardcode this or add the math next!
    });

  } catch (error) {
    console.error("Vibe Check Error:", error);
    alert("Check your Gemini API key in Vercel settings!");
  } finally {
    setLoading(false);
  }
};

  return (
    <div style={{ backgroundColor: 'white', minHeight: '100vh', padding: '40px', fontFamily: 'sans-serif' }}>
      <header style={{ textAlign: 'center', marginBottom: '40px' }}>
        <h1 style={{ fontWeight: '800', letterSpacing: '-1px' }}>POKER VIBE 1.0</h1>
        <p style={{ color: '#666' }}>Snap a photo, get the math.</p>
      </header>

      <main style={{ maxWidth: '500px', margin: '0 auto', textAlign: 'center' }}>
        {/* Upload Zone */}
        <div style={{ border: '2px dashed #eee', padding: '20px', borderRadius: '12px' }}>
          <input type="file" accept="image/*" onChange={handleUpload} />
          {image && <img src={image} style={{ width: '100%', marginTop: '20px', borderRadius: '8px' }} />}
        </div>

        <button 
          onClick={analyzeHand}
          style={{ width: '100%', padding: '15px', background: 'black', color: 'white', borderRadius: '8px', marginTop: '20px', cursor: 'pointer' }}
        >
          {loading ? 'Analyzing...' : 'CALCULATE ODDS'}
        </button>

        {/* Results Dashboard */}
        {results.hand && (
          <div style={{ marginTop: '40px', borderTop: '1px solid #eee', paddingTop: '20px' }}>
            <h2 style={{ fontSize: '14px', color: '#888', textTransform: 'uppercase' }}>Current Hand</h2>
            <p style={{ fontSize: '24px', fontWeight: 'bold' }}>{results.hand}</p>
            
            <h2 style={{ fontSize: '14px', color: '#888', textTransform: 'uppercase', marginTop: '20px' }}>Win Probability</h2>
            <p style={{ fontSize: '48px', fontWeight: '900', color: '#00C853' }}>{results.winProb}%</p>
          </div>
        )}
      </main>
    </div>
  );
}