// web/src/voice_control/autoVoiceHandler.js

const SpeechRecognition =
  window.SpeechRecognition || window.webkitSpeechRecognition || null;

let recognition = null;
let isListening = false;

/**
 * hands-free 음성 모드 시작
 *  onCommand: (text: string) => void
 */
export function startAutoVoice(onCommand) {
  if (!SpeechRecognition) {
    console.warn("이 브라우저는 Web Speech API를 지원하지 않습니다.");
    alert("이 브라우저는 음성 인식을 지원하지 않습니다 😢");
    return;
  }

  if (!recognition) {
    recognition = new SpeechRecognition();
    recognition.lang = "ko-KR";     // 필요하면 ja-JP 등으로 변경 가능
    recognition.continuous = true;  // 계속 듣기
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
  }

  recognition.onresult = (event) => {
    const result = event.results[event.results.length - 1][0].transcript.trim();
    console.log("🎙 인식 결과:", result);
    if (typeof onCommand === "function") {
      onCommand(result);
    }
  };

  recognition.onerror = (event) => {
    console.error("음성 인식 에러:", event.error);
  };

  recognition.onend = () => {
    console.log("음성 인식 종료");
    if (isListening) {
      console.log("음성 인식 재시작");
      try {
        recognition.start();
      } catch (e) {
        console.error("음성 인식 재시작 실패:", e);
      }
    }
  };

  if (!isListening) {
    isListening = true;
    try {
      recognition.start();
      console.log("음성 인식 시작");
    } catch (e) {
      console.error("음성 인식 시작 실패:", e);
    }
  }
}

export function stopAutoVoice() {
  if (recognition && isListening) {
    isListening = false;
    try {
      recognition.stop();
      console.log("음성 인식 정지");
    } catch (e) {
      console.error("음성 인식 정지 실패:", e);
    }
  }
}
