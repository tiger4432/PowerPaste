document.addEventListener("DOMContentLoaded", function () {
  const toggleSwitch = document.getElementById("powerPasteToggle");
  const statusText = document.getElementById("statusText");

  // 초기 상태 로드
  chrome.storage.local.get(["powerPasteEnabled"], function (result) {
    const isEnabled = result.powerPasteEnabled !== false; // 기본값은 true
    toggleSwitch.checked = isEnabled;
    updateStatusText(isEnabled);
  });

  // 토글 스위치 이벤트 리스너
  toggleSwitch.addEventListener("change", function () {
    const isEnabled = toggleSwitch.checked;
    chrome.storage.local.set({ powerPasteEnabled: isEnabled }, function () {
      updateStatusText(isEnabled);

      // 모든 탭에 상태 변경 알림
      chrome.tabs.query({}, function (tabs) {
        tabs.forEach((tab) => {
          try {
            chrome.tabs.sendMessage(tab.id, {
              action: "updatePowerPasteStatus",
              enabled: isEnabled,
            });
          } catch (error) {
            console.log(`탭 ${tab.id}에 메시지 전송 실패:`, error);
          }
        });
      });
    });
  });

  // 상태 텍스트 업데이트 함수
  function updateStatusText(isEnabled) {
    statusText.textContent = isEnabled ? "활성화됨" : "비활성화됨";
    statusText.style.color = isEnabled ? "#4CAF50" : "#f44336";
  }
});
