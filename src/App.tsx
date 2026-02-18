import { useEffect, useReducer } from 'react';
import { gameReducer, initialState } from './state/reducer';
import { useTimer } from './hooks/useTimer';
import { Game } from './components/Game/Game';
import './App.css';

function App() {
  const [state, dispatch] = useReducer(gameReducer, initialState);
  useTimer(state.status, dispatch);

  // Dev-only: expose state and dispatch for Playwright e2e tests
  useEffect(() => {
    if (import.meta.env.DEV) {
      const w = window as unknown as Record<string, unknown>;
      w.__gameState = state;
      w.__dispatch = dispatch;
    }
  }, [state, dispatch]);

  return (
    <div className="app">
      <Game state={state} dispatch={dispatch} />
    </div>
  );
}

export default App;
