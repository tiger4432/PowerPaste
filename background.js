// PowerPaste - 엑셀 테이블을 HTML로 변환하여 웹페이지에 붙여넣기
// 개발자: 김경호
// 버전: 1.0.0

// 백그라운드 스크립트
chrome.runtime.onInstalled.addListener(() => {
  console.log("PowerPaste 확장프로그램이 설치되었습니다.");
  chrome.storage.local.get(["powerPasteEnabled"], function (result) {
    if (result.powerPasteEnabled === undefined) {
      chrome.storage.local.set({ powerPasteEnabled: true });
    }
  });
});

// 이미지 처리를 위한 메시지 리스너
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === "convertImageToBase64") {
    fetch(request.url)
      .then((response) => response.blob())
      .then((blob) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          sendResponse({ success: true, data: reader.result });
        };
        reader.onerror = () => {
          sendResponse({ success: false, error: "Failed to read file" });
        };
        reader.readAsDataURL(blob);
      })
      .catch((error) => {
        sendResponse({ success: false, error: error.message });
      });
    return true; // 비동기 응답을 위해 true 반환
  }
});

// 단축키 이벤트 리스너
chrome.commands.onCommand.addListener((command) => {
  if (command === "toggle-powerpaste") {
    console.log("PowerPaste 토글 명령 받음");

    // 현재 상태 가져오기
    chrome.storage.local.get(["powerPasteEnabled"], function (result) {
      const newState = !(result.powerPasteEnabled !== false); // 기본값은 true
      console.log("새로운 PowerPaste 상태:", newState);

      // 상태 저장 및 즉시 업데이트
      chrome.storage.local.set({ powerPasteEnabled: newState }, function () {
        console.log("PowerPaste 상태 저장 완료");

        // 팝업에 상태 변경 알림
        chrome.runtime.sendMessage({
          action: "updatePowerPasteStatus",
          enabled: newState,
        });

        // 모든 탭에 상태 변경 알림
        chrome.tabs.query({}, function (tabs) {
          console.log("발견된 탭 수:", tabs.length);

          tabs.forEach((tab) => {
            console.log(`탭 ${tab.id}에 메시지 전송 시도`);
            try {
              chrome.tabs.sendMessage(
                tab.id,
                {
                  action: "updatePowerPasteStatus",
                  enabled: newState,
                },
                function (response) {
                  if (chrome.runtime.lastError) {
                    console.log(
                      `탭 ${tab.id}에 메시지 전송 실패:`,
                      chrome.runtime.lastError
                    );
                  } else {
                    console.log(`탭 ${tab.id}에 메시지 전송 성공`);
                  }
                }
              );
            } catch (error) {
              console.log(`탭 ${tab.id}에 메시지 전송 실패:`, error);
            }
          });
        });
      });
    });
  }
});
