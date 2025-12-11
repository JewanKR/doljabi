/**
 * 🎙️ 음성 인식 자동 처리 핸들러
 * Web Speech API를 활용한 지속적인 음성 인식
 */

type VoiceCallback = (text: string) => void;

let recognition: SpeechRecognition | null = null;
let voiceCallback: VoiceCallback | null = null;
let isActive = false;

// Web Speech API 지원 여부 확인
const isSpeechRecognitionSupported = (): boolean => {
  return 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
};

/**
 * 음성 인식 시작
 */
export function startAutoVoice(callback: VoiceCallback): void {
  if (!isSpeechRecognitionSupported()) {
    console.warn('⚠️ 이 브라우저는 음성 인식을 지원하지 않습니다.');
    return;
  }

  if (isActive) {
    console.log('⚠️ 음성 인식이 이미 활성화되어 있습니다.');
    return;
  }

  voiceCallback = callback;

  // @ts-ignore
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  recognition = new SpeechRecognition();

  recognition.lang = 'ko-KR';
  recognition.continuous = true;
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;

  recognition.onresult = (event: SpeechRecognitionEvent) => {
    const results = event.results;
    const lastIndex = results.length - 1;
    const transcript = results[lastIndex][0].transcript.trim();
    
    console.log('🎙️ 음성 인식 결과:', transcript);
    
    if (voiceCallback && transcript) {
      voiceCallback(transcript);
    }
  };

  recognition.onstart = () => {
    isActive = true;
  };

  recognition.onend = () => {
    if (isActive && recognition) {
      setTimeout(() => {
        if (isActive && recognition) {
          try {
            recognition.start();
          } catch (error) {
            // 조용히 무시
          }
        }
      }, 100);
    }
  };

  recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
    if (event.error === 'no-speech' || event.error === 'aborted') {
      return;
    }
    if (event.error === 'not-allowed') {
      alert('마이크 권한이 거부되었습니다.');
      isActive = false;
    }
  };

  try {
    recognition.start();
    console.log('🎙️ 음성 인식 시작');
  } catch (error) {
    console.error('음성 인식 시작 오류:', error);
  }
}

/**
 * 음성 인식 정지
 */
export function stopAutoVoice(): void {
  if (!recognition) return;

  isActive = false;
  try {
    recognition.stop();
  } catch (error) {
    // 조용히 무시
  }
  recognition = null;
  voiceCallback = null;
}

/**
 * 음성 콜백 함수 업데이트
 */
export function updateVoiceCallback(callback: VoiceCallback): void {
  voiceCallback = callback;
}

