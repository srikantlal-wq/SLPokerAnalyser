import React, { useState } from 'react';
import * as PokerSolver from 'pokersolver';
import { CardGroup, OddsCalculator } from 'poker-odds-calculator';

export default function App() {
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState({ hand: '', winProb: 0, rawCards: { hand: [], board: [] } });

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const calculateRealOdds = (hand: string[], board: string[]) => {
    try {
      if (hand.length < 2) return 0;
      const playerGroup = CardGroup.fromString(hand.join(''));
      const boardGroup = board.length > 0 ? CardGroup.fromString(board.join('')) : null;
      
      const result = OddsCalculator.calculate([playerGroup], boardGroup);
      return Math.round(result.equities[0].getEquity());
    } catch (e) {
      console.error("Math Error:", e);
      return 0;
    }
  };

  const analyzeHand = async () => {
    if (!image) return alert("Upload a photo first!");
    setLoading(true);

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image }),
      });

      const data = await response.json(); // { hand: ['Ah', 'Ad'], board: ['2h', '7s'] }

      const solvedHand = PokerSolver.Hand.solve([...data.hand, ...data.board]);
      const probability = calculateRealOdds(data.hand, data.board);

      setResults({
        hand: solvedHand.descr,
        winProb: probability,
        rawCards: data
      });
    } catch (error) {
      alert("Check your Gemini API Key in Vercel!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ backgroundColor: '#F9FAFB', minHeight: '100vh', padding: '40px', fontFamily: 'Inter, system-ui, sans-serif' }}>
      <main style={{ maxWidth: '480px', margin: '0 auto', background: 'white', padding: '30px', borderRadius: '24px', boxShadow: '0 10px 25px rgba(0,0,0,0.05)' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '900', letterSpacing: '-1px', marginBottom: '8px' }}>POKER VIBE 2.0</h1>
        <p style={{ color: '#6B7280', marginBottom: '32px' }}>AI-Powered Odds Evaluator</p>

        
        <div style={{ border: '2px dashed #E5E7EB', borderRadius: '16px', overflow: 'hidden', cursor: 'pointer', position: 'relative' }}>
          <input type="file" accept="image/*" onChange={handleUpload} style={{ opacity: 0, position: 'absolute', width: '100%', height: '100%', cursor: 'pointer' }} />
          {image ? (
            <img src={image} style={{ width: '100%', display: 'block' }} />
          ) : (
            <div style={{ padding: '60px 20px', color: '#9CA3AF' }}>Tap to upload hand photo</div>
          )}
        </div>

        <button 
          onClick={analyzeHand}
          disabled={loading}
          style={{ 
            width: '100%', padding: '18px', background: 'black', color: 'white', 
            borderRadius: '14px', marginTop: '24px', fontWeight: '700', fontSize: '16px',
            border: 'none', cursor: 'pointer', opacity: loading ? 0.6 : 1, transition: '0.2s'
          }}
        >
          {loading ? 'AI IS THINKING...' : 'CALCULATE EQUITY'}
        </button>

        
        {results.hand && (
          <div style={{ marginTop: '32px', textAlign: 'left', animation: 'fadeIn 0.5s ease' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: '12px', color: '#9CA3AF', fontWeight: '700', textTransform: 'uppercase' }}>Current Hand</span>
                <p style={{ fontSize: '20px', fontWeight: '700', color: '#111827' }}>{results.hand}</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '12px', color: '#9CA3AF', fontWeight: '700', textTransform: 'uppercase' }}>Win Prob</span>
                <p style={{ 
                  fontSize: '32px', fontWeight: '900', 
                  color: results.winProb > 60 ? '#10B981' : results.winProb > 35 ? '#F59E0B' : '#EF4444' 
                }}>
                  {results.winProb}%
                </p>
              </div>
            </div>
            
            
            <div style={{ marginTop: '20px', padding: '15px', background: '#F3F4F6', borderRadius: '12px', fontSize: '14px' }}>
              <strong>Detected:</strong> {results.rawCards.hand.join(', ')} | {results.rawCards.board.join(', ')}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}