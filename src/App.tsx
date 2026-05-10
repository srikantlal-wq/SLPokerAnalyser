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
    if (manualHand.concat(manualBoard).includes(card)) return; // No duplicates

    if (target === 'hand' && manualHand.length < 2) {
      setManualHand([...manualHand, card]);
    } else if (target === 'board' && manualBoard.length < 5) {
      setManualBoard([...manualBoard, card]);
    }
  };

  const calculateRealOdds = (hand: string[], board: string[]) => {
    try {
      if (hand.length < 2) return 0;
      const hGroup = CardGroup.fromString(hand.join(''));
      const bGroup = board.length > 0 ? CardGroup.fromString(board.join('')) : undefined;
      const result = OddsCalculator.calculate([hGroup], bGroup);
      return Math.round(result.equities[0].getEquity());
    } catch (e) { return 0; }
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

      const solved = PokerSolver.Hand.solve([...finalData.hand, ...finalData.board]);
      setResults({
        hand: solved.descr,
        winProb: calculateRealOdds(finalData.hand, finalData.board),
        rawCards: finalData
      });
    } catch (error) {
      alert("Analysis failed. Check your API key or image size.");
    } finally { setLoading(false); }
  };

  return (
    <div style={{ backgroundColor: '#F3F4F6', minHeight: '100vh', padding: '20px', fontFamily: 'Inter, sans-serif' }}>
      <main style={{ maxWidth: '440px', margin: '0 auto', background: 'white', borderRadius: '28px', padding: '24px', boxShadow: '0 20px 40px rgba(0,0,0,0.08)' }}>
        
        <h1 style={{ fontWeight: '900', letterSpacing: '-1.5px', fontSize: '24px', marginBottom: '20px' }}>POKER VIBE 2.0</h1>

        {/* Tab Switcher */}
        <div style={{ display: 'flex', background: '#F3F4F6', borderRadius: '14px', padding: '4px', marginBottom: '24px' }}>
          {(['photo', 'manual'] as const).map((m) => (
            <button key={m} onClick={() => setMode(m)} style={{ 
              flex: 1, padding: '12px', border: 'none', borderRadius: '10px', cursor: 'pointer',
              background: mode === m ? 'white' : 'transparent', fontWeight: mode === m ? '700' : '400',
              boxShadow: mode === m ? '0 2px 8px rgba(0,0,0,0.05)' : 'none'
            }}>{m.toUpperCase()}</button>
          ))}
        </div>

        {mode === 'photo' ? (
          <div style={{ border: '2px dashed #E5E7EB', borderRadius: '20px', overflow: 'hidden', minHeight: '200px', position: 'relative' }}>
            <input type="file" accept="image/*" onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) { const r = new FileReader(); r.onloadend = () => setImage(r.result as string); r.readAsDataURL(f); }
            }} style={{ opacity: 0, position: 'absolute', width: '100%', height: '100%', cursor: 'pointer' }} />
            {image ? <img src={image} style={{ width: '100%' }} /> : <div style={{ padding: '80px 0', color: '#9CA3AF' }}>Tap to Snap Photo</div>}
          </div>
        ) : (
          <div>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
              <button onClick={() => setTarget('hand')} style={{ flex: 1, padding: '10px', borderRadius: '10px', border: '1px solid #EEE', background: target === 'hand' ? '#000' : '#FFF', color: target === 'hand' ? '#FFF' : '#000' }}>Hand ({manualHand.length}/2)</button>
              <button onClick={() => setTarget('board')} style={{ flex: 1, padding: '10px', borderRadius: '10px', border: '1px solid #EEE', background: target === 'board' ? '#000' : '#FFF', color: target === 'board' ? '#FFF' : '#000' }}>Board ({manualBoard.length}/5)</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
              {suits.map(s => ranks.map(r => (
                <button key={r+s.s} onClick={() => handleManualSelect(r, s.s)} style={{ 
                  padding: '10px 0', borderRadius: '8px', border: '1px solid #F3F4F6', background: 'white', fontWeight: '700', color: s.c, fontSize: '14px'
                }}>{r}{s.l}</button>
              )))}
            </div>
            <button onClick={() => {setManualHand([]); setManualBoard([]);}} style={{ width: '100%', marginTop: '10px', border: 'none', background: 'none', color: '#EF4444', fontWeight: '600' }}>Reset Selection</button>
          </div>
        )}

        <button onClick={analyzeHand} disabled={loading} style={{ 
          width: '100%', padding: '20px', background: 'black', color: 'white', borderRadius: '16px', marginTop: '24px', fontWeight: '800', border: 'none', cursor: 'pointer', opacity: loading ? 0.7 : 1
        }}>{loading ? 'WORKING...' : 'CALCULATE EQUITY'}</button>

        {results.hand && (
          <div style={{ marginTop: '24px', borderTop: '2px solid #F3F4F6', paddingTop: '20px', textAlign: 'left' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <div><span style={{ fontSize: '11px', color: '#9CA3AF', fontWeight: '800' }}>STRENGTH</span><p style={{ fontSize: '18px', fontWeight: '700' }}>{results.hand}</p></div>
              <div style={{ textAlign: 'right' }}><span style={{ fontSize: '11px', color: '#9CA3AF', fontWeight: '800' }}>WIN CHANCE</span><p style={{ fontSize: '32px', fontWeight: '900', color: results.winProb > 50 ? '#10B981' : '#F59E0B' }}>{results.winProb}%</p></div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}