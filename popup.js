document.addEventListener("DOMContentLoaded", function () {
  const toggleSwitch = document.getElementById("powerPasteToggle");
  const statusText = document.querySelector(".status");

  // 초기 상태 로드
  chrome.storage.local.get(["powerPasteEnabled"], function (result) {
    const isEnabled = result.powerPasteEnabled !== false; // 기본값은 true
    toggleSwitch.checked = isEnabled;
    updateStatus(isEnabled);
  });

  // 메시지 리스너 추가
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "updatePowerPasteStatus") {
      console.log("팝업에서 상태 업데이트 메시지 수신:", message.enabled);
      toggleSwitch.checked = message.enabled;
      updateStatus(message.enabled);
      sendResponse({ success: true });
    }
    return true;
  });

  // 토글 스위치 이벤트 리스너
  toggleSwitch.addEventListener("change", function () {
    const isEnabled = toggleSwitch.checked;

    // 상태 저장 및 즉시 업데이트
    chrome.storage.local.set({ powerPasteEnabled: isEnabled }, function () {
      updateStatus(isEnabled);

      // 모든 탭에 즉시 상태 변경 알림
      chrome.tabs.query({}, function (tabs) {
        tabs.forEach((tab) => {
          try {
            chrome.tabs.sendMessage(
              tab.id,
              {
                action: "updatePowerPasteStatus",
                enabled: isEnabled,
              },
              function (response) {
                if (chrome.runtime.lastError) {
                  console.log(
                    `탭 ${tab.id}에 메시지 전송 실패:`,
                    chrome.runtime.lastError
                  );
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

  function updateStatus(isEnabled) {
    if (isEnabled) {
      statusText.textContent = "PowerPaste 활성화";
      statusText.classList.add("active");
    } else {
      statusText.textContent = "PowerPaste 비활성화";
      statusText.classList.remove("active");
    }
  }
});
