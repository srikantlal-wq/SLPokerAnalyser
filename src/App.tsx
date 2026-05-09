import React, { useState } from 'react';
import PokerSolver from 'pokersolver';

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
  const analyzeHand = async () => {
    setLoading(true);
    // Here is where you'd call your GPT-4o Vision API
    // For now, let's simulate the AI returning: My Hand: As, Ad | Board: 2h, 7d, Jc
    setTimeout(() => {
      const myHand = PokerSolver.Hand.solve(['As', 'Ad', '2h', '7d', 'Jc']);
      setResults({
        hand: myHand.descr, // e.g., "Pair, Aces"
        winProb: 82.5,     // We'll calculate this in Phase 3
      });
      setLoading(false);
    }, 1500);
  };

  return (
    <div style={{ backgroundColor: 'white', minHeight: '100vh', padding: '40px', fontFamily: 'sans-serif' }}>
      <header style={{ textAlign: 'center', marginBottom: '40px' }}>
        <h1 style={{ fontWeight: '800', letterSpacing: '-1px' }}>POKER VIBE</h1>
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