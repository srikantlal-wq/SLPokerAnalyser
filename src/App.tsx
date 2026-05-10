import { useState } from 'react';
import * as PokerSolver from 'pokersolver';
import { CardGroup, OddsCalculator } from 'poker-odds-calculator';

type InputMode = 'photo' | 'manual';

export default function App() {
  const [mode, setMode] = useState<InputMode>('photo');
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState({ hand: '', winProb: 0, rawCards: { hand: [] as string[], board: [] as string[] } });

  // Manual Input State
  const [manualHand, setManualHand] = useState<string[]>([]);
  const [manualBoard, setManualBoard] = useState<string[]>([]);
  const [target, setTarget] = useState<'hand' | 'board'>('hand');

  const ranks = ['A', 'K', 'Q', 'J', 'T', '9', '8', '7', '6', '5', '4', '3', '2'];
  const suits = [
    { s: 's', l: '♠', c: '#111827' }, // Black
    { s: 'h', l: '♥', c: '#EF4444' }, // Red
    { s: 'd', l: '♦', c: '#3B82F6' }, // Blue
    { s: 'c', l: '♣', c: '#10B981' }  // Green
  ];

  const handleManualSelect = (rank: string, suit: string) => {
    const card = `${rank}${suit}`;
    // Prevent duplicates across hand and board
    if (manualHand.includes(card) || manualBoard.includes(card)) return;

    if (target === 'hand' && manualHand.length < 2) {
      setManualHand([...manualHand, card]);
    } else if (target === 'board' && manualBoard.length < 5) {
      setManualBoard([...manualBoard, card]);
    }
  };

  const calculateRealOdds = (hand: string[], board: string[]) => {
    try {
      if (hand.length < 2) return 0;

      // 1. Setup Deck & Shuffle for Ghost Hand
      const allRanks = ['A', 'K', 'Q', 'J', 'T', '9', '8', '7', '6', '5', '4', '3', '2'];
      const allSuits = ['s', 'h', 'd', 'c'];
      const fullDeck = allRanks.flatMap(r => allSuits.map(s => `${r}${s}`));
      const takenCards = [...hand, ...board];
      const remainingDeck = fullDeck
        .filter(c => !takenCards.includes(c))
        .sort(() => Math.random() - 0.5);

      // 2. Prepare Groups
      const playerGroup = CardGroup.fromString(hand.join(''));
      const ghostHand = [remainingDeck[0], remainingDeck[1]];
      const opponentGroup = CardGroup.fromString(ghostHand.join(''));
      const boardGroup = board.length > 0 ? CardGroup.fromString(board.join('')) : undefined;

      // 3. Run Monte Carlo Simulation with 1000 iterations for stability
      const result = OddsCalculator.calculate([playerGroup, opponentGroup], boardGroup, undefined, 1000);
      
      // We take equity of Player 1 (Index 0)
      return Math.round(result.equities[0].getEquity());
    } catch (e) { 
      console.error(e);
      return 0; 
    }
  };

  const analyzeHand = async () => {
    setLoading(true);
    try {
      let finalData;
      if (mode === 'photo') {
        if (!image) throw new Error("No image");
        const res = await fetch('/api/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image }),
        });
        finalData = await res.json();
      } else {
        finalData = { hand: manualHand, board: manualBoard };
      }

      const probability = calculateRealOdds(finalData.hand, finalData.board);
      const solved = PokerSolver.Hand.solve([...finalData.hand, ...finalData.board]);

      setResults({
        hand: solved.descr,
        winProb: probability,
        rawCards: finalData
      });
    } catch (error) {
      alert("Check your Gemini API Key or Image Size!");
    } finally { setLoading(false); }
  };

  return (
    <div style={{ backgroundColor: '#F9FAFB', minHeight: '100vh', padding: '20px', fontFamily: 'Inter, sans-serif' }}>
      <main style={{ maxWidth: '440px', margin: '0 auto', background: 'white', borderRadius: '32px', padding: '28px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.1)' }}>
        
        {/* Branding Header */}
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '24px' }}>
          <div style={{ width: '36px', height: '36px', background: '#000', borderRadius: '8px', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900', marginRight: '12px' }}>SL</div>
          <h1 style={{ fontWeight: '900', letterSpacing: '-1px', fontSize: '22px', margin: 0 }}>POKER VIBE 3.2</h1>
        </div>

        {/* Mode Switcher */}
        <div style={{ display: 'flex', background: '#F3F4F6', borderRadius: '16px', padding: '4px', marginBottom: '24px' }}>
          {(['photo', 'manual'] as const).map((m) => (
            <button key={m} onClick={() => setMode(m)} style={{ 
              flex: 1, padding: '12px', border: 'none', borderRadius: '12px', cursor: 'pointer',
              background: mode === m ? 'white' : 'transparent', fontWeight: mode === m ? '700' : '500',
              boxShadow: mode === m ? '0 4px 6px -1px rgba(0,0,0,0.1)' : 'none',
              transition: 'all 0.2s'
            }}>{m.toUpperCase()}</button>
          ))}
        </div>

        {mode === 'photo' ? (
          <div style={{ border: '2px dashed #E5E7EB', borderRadius: '24px', overflow: 'hidden', minHeight: '220px', position: 'relative', background: '#FAFAFA' }}>
            <input type="file" accept="image/*" onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) { const r = new FileReader(); r.onloadend = () => setImage(r.result as string); r.readAsDataURL(f); }
            }} style={{ opacity: 0, position: 'absolute', width: '100%', height: '100%', cursor: 'pointer', zIndex: 2 }} />
            {image ? <img src={image} alt="uploaded" style={{ width: '100%', display: 'block' }} /> : <div style={{ padding: '90px 0', color: '#9CA3AF', textAlign: 'center', fontWeight: '500' }}>Tap to Snap Photo</div>}
          </div>
        ) : (
          <div>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
              <button onClick={() => setTarget('hand')} style={{ flex: 1, padding: '12px', borderRadius: '12px', border: '1px solid #EEE', background: target === 'hand' ? '#000' : '#FFF', color: target === 'hand' ? '#FFF' : '#000', fontWeight: '700', transition: '0.2s' }}>Hand ({manualHand.length}/2)</button>
              <button onClick={() => setTarget('board')} style={{ flex: 1, padding: '12px', borderRadius: '12px', border: '1px solid #EEE', background: target === 'board' ? '#000' : '#FFF', color: target === 'board' ? '#FFF' : '#000', fontWeight: '700', transition: '0.2s' }}>Board ({manualBoard.length}/5)</button>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
              {suits.map(s => ranks.map(r => {
                const code = `${r}${s.s}`;
                const isSelected = manualHand.includes(code) || manualBoard.includes(code);
                return (
                  <button key={code} onClick={() => handleManualSelect(r, s.s)} style={{ 
                    padding: '12px 0', borderRadius: '10px', border: '1px solid #F3F4F6', 
                    background: isSelected ? '#F3F4F6' : 'white', 
                    color: isSelected ? '#D1D5DB' : s.c,
                    fontWeight: '800', fontSize: '14px', cursor: isSelected ? 'default' : 'pointer',
                    transition: '0.2s', opacity: isSelected ? 0.6 : 1,
                    boxShadow: isSelected ? 'none' : '0 1px 2px rgba(0,0,0,0.05)'
                  }}>{r}{s.l}</button>
                );
              }))}
            </div>
            <button onClick={() => {setManualHand([]); setManualBoard([]);}} style={{ width: '100%', marginTop: '15px', border: 'none', background: 'none', color: '#EF4444', fontWeight: '700', cursor: 'pointer' }}>Clear All</button>
          </div>
        )}

        <button onClick={analyzeHand} disabled={loading} style={{ 
          width: '100%', padding: '20px', background: 'black', color: 'white', borderRadius: '18px', marginTop: '28px', fontWeight: '800', border: 'none', cursor: 'pointer', transition: 'transform 0.1s', fontSize: '16px'
        }}>{loading ? 'CALCULATING...' : 'GET WIN PROBABILITY'}</button>

        {results.hand && (
          <div style={{ marginTop: '32px', borderTop: '1px solid #F3F4F6', paddingTop: '24px', textAlign: 'left' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
              <div>
                <span style={{ fontSize: '12px', color: '#9CA3AF', fontWeight: '800', textTransform: 'uppercase' }}>Current Strength</span>
                <p style={{ fontSize: '20px', fontWeight: '800', margin: '4px 0 0 0' }}>{results.hand}</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '12px', color: '#9CA3AF', fontWeight: '800', textTransform: 'uppercase' }}>Win Chance</span>
                <p style={{ 
                  fontSize: '38px', fontWeight: '900', margin: '0', 
                  color: results.winProb > 70 ? '#10B981' : results.winProb > 40 ? '#F59E0B' : '#EF4444' 
                }}>{results.winProb}%</p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}