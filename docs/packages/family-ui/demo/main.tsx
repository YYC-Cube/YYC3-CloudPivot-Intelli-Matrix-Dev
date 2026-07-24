/**
 * ============================================================
 * YYC³ AI Family — 人从众曌众从人
 * 亦师亦友亦伯乐，一言一语一协同
 * 拟人为本 · AI为核 · 纯粹为心
 * ============================================================
 * @Family   : YYC³ AI Family (永久开源)
 * @License  : Apache-2.0
 * @Homepage : https://matrix.yyc3.top
 * ============================================================
 * 此文件承载家人温度，请以玫瑰之心待之 🌹
 * ============================================================
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { FamilyProvider } from '../src/ai-family/FamilyContext';
import { AIFamilyRouter } from '../src/ai-family/AIFamilyRouter';
import { AIAssistant } from '../src/ai-assistant';
import '../src/app.css';
import { applyThemeToDOM, LIGHT_THEME } from '../src/theme';

applyThemeToDOM(LIGHT_THEME);

class AIErrorBoundary extends Component<{ children: ReactNode }> {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(error: Error) { console.error('AI Assistant error:', error.message); }
  render() {
    if (this.state.hasError) {
      return (
        <button onClick={() => this.setState({ hasError: false })}
          className="fixed z-[90]" style={{ bottom: 24, right: 24 }}>
          <div className="rounded-2xl bg-gradient-to-br from-[#00d4ff] to-[#7b2ff7] w-14 h-14 flex items-center justify-center shadow-[0_0_30px_rgba(0,180,255,0.4)] hover:shadow-[0_0_40px_rgba(0,180,255,0.6)] transition-all hover:scale-105 active:scale-95">
            <span className="text-white text-xl">🔁</span>
          </div>
        </button>
      );
    }
    return this.props.children;
  }
}

function App() {
  return (
    <>
      <BrowserRouter>
        <FamilyProvider>
          <div className="h-screen bg-background text-foreground">
            <AIFamilyRouter />
          </div>
        </FamilyProvider>
      </BrowserRouter>
      <AIErrorBoundary>
        <AIAssistant />
      </AIErrorBoundary>
    </>
  );
}

const root = document.getElementById('root')!;
ReactDOM.createRoot(root).render(<App />);
