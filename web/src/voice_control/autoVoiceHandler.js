// voice_control/autoVoiceHandler.js

let recognition = null;
let isListening = false;        // 지금 듣는 중인지
let shouldAutoRestart = false;  // onend에서 자동 재시작 할지
let latestCallback = null;      // 항상 최신 콜백 저장

// 🔹 콜백만 갈아끼우는 함수 (새로 추가)
export function updateVoiceCallback(onText) {
  latestCallback = onText;
}

export function startAutoVoice(onText) {
  // 최초 한 번 들어온 콜백도 저장
  latestCallback = onText;

  const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;

  if (!SpeechRecognition) {
    console.error('이 브라우저는 SpeechRecognition을 지원하지 않습니다.');
    return;
  }

  if (!recognition) {
    recognition = new SpeechRecognition();
    recognition.lang = 'ko-KR';
    recognition.interimResults = false;
    recognition.continuous = true;

    recognition.onstart = () => {
      isListening = true;
      console.log('음성 인식 시작');
    };

    recognition.onend = () => {
      console.log('음성 인식 종료');
      isListening = false;

      if (shouldAutoRestart) {
        try {
          recognition.start();
        } catch (e) {
          console.error('재시작 실패:', e);
        }
      }
    };

    recognition.onresult = (event) => {
      const lastIndex = event.results.length - 1;
      const transcript = event.results[lastIndex][0].transcript.trim();
      console.log('🎤 인식 텍스트:', transcript);

      if (typeof latestCallback === 'function') {
        latestCallback(transcript);
      }
    };

    recognition.onerror = (event) => {
      console.error('음성 인식 오류:', event.error);
    };
  }

  // 앞으로 onend에서 자동 재시작 허용
  shouldAutoRestart = true;

  // ⚠ 이미 듣는 중이면 그냥 조용히 리턴 (로그 안 찍게)
  if (isListening) {
    return;
  }

  try {
    recognition.start();
  } catch (e) {
    console.error('음성 인식 시작 실패:', e);
  }
}

export function stopAutoVoice() {
  shouldAutoRestart = false;

  if (recognition && isListening) {
    try {
      recognition.stop();
    } catch (e) {
      console.error('음성 인식 정지 실패:', e);
    }
  }
}
