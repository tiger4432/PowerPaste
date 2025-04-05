// PowerPaste - 엑셀 테이블을 HTML로 변환하여 웹페이지에 붙여넣기
// 개발자: 김경호
// 버전: 1.0.0

// 백그라운드 스크립트
chrome.runtime.onInstalled.addListener(() => {
  console.log('PowerPaste 확장프로그램이 설치되었습니다.');
});

// 이미지 처리를 위한 메시지 리스너
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'convertImageToBase64') {
    fetch(request.url)
      .then(response => response.blob())
      .then(blob => {
        const reader = new FileReader();
        reader.onloadend = () => {
          sendResponse({ success: true, data: reader.result });
        };
        reader.onerror = () => {
          sendResponse({ success: false, error: 'Failed to read file' });
        };
        reader.readAsDataURL(blob);
      })
      .catch(error => {
        sendResponse({ success: false, error: error.message });
      });
    return true; // 비동기 응답을 위해 true 반환
  }
}); 