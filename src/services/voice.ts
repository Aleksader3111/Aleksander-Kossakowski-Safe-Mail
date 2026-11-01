// Web Speech Recognition & Synthesis for Jarvis

export interface SpeechRecognitionListener {
  onResult: (transcript: string, isFinal: boolean) => void;
  onError: (error: string) => void;
  onEnd: () => void;
}

export class JarvisSpeechService {
  private recognition: any = null;
  private isListening: boolean = false;

  constructor() {
    if (typeof window !== 'undefined') {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        this.recognition = new SpeechRecognition();
        this.recognition.continuous = true;
        this.recognition.interimResults = true;
        this.recognition.lang = 'pl-PL';
      }
    }
  }

  isSpeechSupported(): boolean {
    return this.recognition !== null;
  }

  isSupported(): boolean {
    return typeof window !== 'undefined' && (('SpeechRecognition' in window) || ('webkitSpeechRecognition' in window));
  }

  start(listener: SpeechRecognitionListener) {
    this.startListening(listener);
  }

  stop() {
    this.stopListening();
  }

  startListening(listener: SpeechRecognitionListener) {
    if (!this.recognition) {
      listener.onError('Twoja przeglądarka nie obsługuje interfejsu Web Speech Recognition. Możesz wpisać polecenie tekstowo.');
      return;
    }

    if (this.isListening) {
      this.stopListening();
    }

    this.recognition.onresult = (event: any) => {
      let finalTranscript = '';
      let interimTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }

      const text = finalTranscript || interimTranscript;
      if (text) {
        listener.onResult(text.trim(), !!finalTranscript);
      }
    };

    this.recognition.onerror = (event: any) => {
      console.warn('Speech recognition error:', event.error);
      listener.onError(event.error === 'not-allowed' ? 'Odmówiono dostępu do mikrofonu.' : `Błąd rozpoznawania: ${event.error}`);
    };

    this.recognition.onend = () => {
      this.isListening = false;
      listener.onEnd();
    };

    try {
      this.recognition.start();
      this.isListening = true;
    } catch (err: any) {
      listener.onError(`Nie udało się uruchomić mikrofonu: ${err.message}`);
    }
  }

  stopListening() {
    if (this.recognition && this.isListening) {
      try {
        this.recognition.stop();
      } catch {}
      this.isListening = false;
    }
  }

  getListeningStatus(): boolean {
    return this.isListening;
  }
}

// Voice Synthesis (TTS) with Polish male preference
export class JarvisVoiceSynthesizer {
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private selectedVoice: SpeechSynthesisVoice | null = null;

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.loadVoices();
      window.speechSynthesis.onvoiceschanged = () => this.loadVoices();
    }
  }

  private loadVoices() {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    const voices = window.speechSynthesis.getVoices();
    // Find Polish voice, preferring male
    const plVoices = voices.filter(v => v.lang.startsWith('pl'));
    const malePl = plVoices.find(v => /male|męski|paul|marek|jan|adam/i.test(v.name));
    this.selectedVoice = malePl || plVoices[0] || null;
  }

  isSupported(): boolean {
    return typeof window !== 'undefined' && 'speechSynthesis' in window;
  }

  speak(text: string, rate: number = 1.0, pitch: number = 0.95): Promise<void> {
    return new Promise((resolve) => {
      if (!this.isSupported()) {
        resolve();
        return;
      }

      this.stop();

      // Clean markdown or technical tags for smooth speaking
      const cleanText = text
        .replace(/[*_#`[\]()]/g, '')
        .replace(/https?:\/\/\S+/g, 'link')
        .replace(/P0|P1|P2|P3|P4/g, (match) => {
          if (match === 'P0') return 'priorytet zero krytyczny';
          if (match === 'P1') return 'priorytet jeden pilny';
          if (match === 'P2') return 'priorytet dwa ważny';
          return 'priorytet ' + match;
        })
        .slice(0, 300); // Keep speech concise as requested in prompt

      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.lang = 'pl-PL';
      utterance.rate = rate;
      utterance.pitch = pitch;

      if (!this.selectedVoice) {
        this.loadVoices();
      }
      if (this.selectedVoice) {
        utterance.voice = this.selectedVoice;
      }

      utterance.onend = () => {
        this.currentUtterance = null;
        resolve();
      };

      utterance.onerror = () => {
        this.currentUtterance = null;
        resolve();
      };

      this.currentUtterance = utterance;
      window.speechSynthesis.speak(utterance);
    });
  }

  stop() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      this.currentUtterance = null;
    }
  }

  isSpeaking(): boolean {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return false;
    return window.speechSynthesis.speaking;
  }

  testVoice(rate: number = 1.0): Promise<void> {
    return this.speak('Dzień dobry. Jestem Jarvis, Twój osobisty asystent poczty elektronicznej.', rate);
  }
}

export const speechService = new JarvisSpeechService();
export const voiceSynthesizer = new JarvisVoiceSynthesizer();
