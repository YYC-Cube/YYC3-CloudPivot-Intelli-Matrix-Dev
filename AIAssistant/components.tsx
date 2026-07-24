/**
 * @file: components.tsx
 * @description: AIAssistant 子组件 + 自定义 Hooks
 */
import React, { useState, useRef, useEffect, useCallback } from "react";

// ============================================================
// AILogo - SVG 脑波图标
// ============================================================

export function AILogo({ size = 28, className = "" }: { size?: number; className?: string }) {
  return (
    <div className={`flex items-center justify-center ${className}`} style={{ width: size, height: size }}>
      <svg width={size * 0.7} height={size * 0.7} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "#ffffff" }}>
        <path d="M12 2a4 4 0 0 1 4 4v1a4 4 0 0 1-8 0V6a4 4 0 0 1 4-4z" fill="rgba(0,212,255,0.3)" />
        <path d="M8 14a4 4 0 0 0 8 0" fill="none" />
        <circle cx="12" cy="17" r="5" fill="rgba(0,212,255,0.15)" />
        <path d="M12 12v3" stroke="rgba(0,212,255,0.6)" />
        <path d="M10 13l2 2 2-2" stroke="rgba(0,212,255,0.6)" />
        <circle cx="18" cy="5" r="1" fill="#00d4ff" />
        <circle cx="20" cy="9" r="0.7" fill="#7b2ff7" />
        <circle cx="5" cy="7" r="0.7" fill="#00ff88" />
      </svg>
    </div>
  );
}

// ============================================================
// EmotionRipple - 情感涟漪动画 (Phase 2)
// ============================================================

export function EmotionRipple({ color, active }: { color: string; active: boolean }) {
  if (!active) return null;
  return (
    <span className="absolute -inset-1 rounded-2xl pointer-events-none" style={{ zIndex: 0 }}>
      <span className="absolute inset-0 rounded-2xl animate-ping opacity-30" style={{ background: color, animationDuration: "2s" }} />
      <span className="absolute inset-0 rounded-2xl animate-ping opacity-15" style={{ background: color, animationDuration: "2.5s", animationDelay: "0.3s" }} />
    </span>
  );
}

// ============================================================
// useSpeechRecognition - Web Speech API 语音识别 Hook
// ============================================================

export function useSpeechRecognition() {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [supported] = useState(() => typeof window !== "undefined" && ("webkitSpeechRecognition" in window || "SpeechRecognition" in window));
  const recognitionRef = useRef<any>(null);

  const startListening = useCallback(() => {
    if (!supported) return;
    const Recognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    const recog = new Recognition();
    recog.lang = "zh-CN";
    recog.continuous = false;
    recog.interimResults = false;
    recog.onresult = (event: any) => {
      setTranscript(event.results[0][0].transcript);
      setIsListening(false);
    };
    recog.onerror = () => setIsListening(false);
    recog.onend = () => setIsListening(false);
    recog.start();
    recognitionRef.current = recog;
    setIsListening(true);
  }, [supported]);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setIsListening(false);
  }, []);

  useEffect(() => {
    return () => { recognitionRef.current?.abort(); };
  }, []);

  return { isListening, transcript, supported, startListening, stopListening };
}
