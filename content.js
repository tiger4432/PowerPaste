// PowerPaste - 엑셀 테이블을 HTML로 변환하여 웹페이지에 붙여넣기
// 개발자: 김경호
// 버전: 1.0.0

// CSS 속성 이름을 camelCase로 변환하는 함수
function toCamelCase(str) {
  return str.replace(/-([a-z])/g, function (g) {
    return g[1].toUpperCase();
  });
}

// 알림 애니메이션을 위한 CSS 스타일 추가
const style = document.createElement("style");
style.textContent = `
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(-20px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes fadeOut {
    from { opacity: 1; transform: translateY(0); }
    to { opacity: 0; transform: translateY(-20px); }
  }
`;
document.head.appendChild(style);

// 스타일을 인라인으로 변환하는 함수
function convertStylesToInline(element) {
  // 중요한 스타일 속성 목록
  const importantStyles = [
    "background-color",
    "color",
    "font-family",
    "font-size",
    "font-weight",
    "text-align",
    "vertical-align",
    "border",
    "border-top",
    "border-right",
    "border-bottom",
    "border-left",
    "padding",
    "padding-top",
    "padding-right",
    "padding-bottom",
    "padding-left",
    "margin",
    "margin-top",
    "margin-right",
    "margin-bottom",
    "margin-left",
    "width",
    "height",
    "min-width",
    "min-height",
    "max-width",
    "max-height",
    "display",
    "position",
    "top",
    "right",
    "bottom",
    "left",
    "float",
    "clear",
    "overflow",
    "overflow-x",
    "overflow-y",
    "white-space",
    "text-overflow",
    "text-decoration",
    "text-transform",
    "line-height",
    "letter-spacing",
    "word-spacing",
    "table-layout",
    "border-collapse",
    "border-spacing",
    "empty-cells",
    "caption-side",
  ];

  // 모든 요소의 스타일을 인라인으로 변환
  const allElements = element.querySelectorAll("*");
  allElements.forEach((el) => {
    const computedStyle = window.getComputedStyle(el);
    let inlineStyle = "";

    // 중요한 스타일 속성만 인라인으로 변환
    importantStyles.forEach((property) => {
      const value = computedStyle.getPropertyValue(property);

      // 기본값이 아닌 스타일만 인라인으로 변환
      if (
        value &&
        value !== "none" &&
        value !== "auto" &&
        value !== "normal" &&
        value !== "0px" &&
        value !== "0%" &&
        value !== "0"
      ) {
        inlineStyle += `${property}:${value};`;
      }
    });

    if (inlineStyle) {
      el.setAttribute("style", inlineStyle);
    }
  });

  // 모든 스타일 태그 제거
  const styleTags = element.querySelectorAll("style");
  styleTags.forEach((styleTag) => styleTag.remove());

  // 메타 태그 제거
  const metaTags = element.querySelectorAll("meta");
  metaTags.forEach((metaTag) => metaTag.remove());

  // link 태그 제거
  const linkTags = element.querySelectorAll("link");
  linkTags.forEach((linkTag) => linkTag.remove());

  // 모든 스타일이 인라인으로 변환된 후 클래스 제거
  const tableElements = element.querySelectorAll("td, th, tr, table");
  tableElements.forEach((el) => el.removeAttribute("class"));

  return element;
}

// 붙여넣기 이벤트를 다시 발생시키는 함수
function simulatePasteEvent(targetElement) {
  console.log("기본 붙여넣기 이벤트를 다시 발생시킵니다.");

  // 현재 포커스된 요소 저장
  const activeElement = document.activeElement;

  // 대상 요소에 포커스
  targetElement.focus();

  // 임시 이벤트 리스너 추가
  const handlePaste = (e) => {
    e.isSimulated = true;
    document.removeEventListener("paste", handlePaste, true);
  };
  document.addEventListener("paste", handlePaste, true);

  // execCommand를 사용하여 붙여넣기 실행
  document.execCommand("paste");

  // 원래 포커스된 요소로 돌아가기
  if (activeElement) {
    activeElement.focus();
  }
}

// 클립보드에서 HTML 데이터를 가져오는 함수
async function getClipboardHtml(clipboardData) {
  if (!clipboardData) {
    console.log("클립보드 데이터가 없습니다.");
    return null;
  }

  if (clipboardData.items) {
    const items = Array.from(clipboardData.items);
    for (const dataItem of items) {
      if (dataItem.type === "text/html") {
        try {
          const htmlContent = await new Promise((resolve) => {
            dataItem.getAsString((string) => resolve(string));
          });
          if (htmlContent && htmlContent.includes("<table")) {
            return htmlContent;
          }
        } catch (e) {
          console.error("HTML 데이터 가져오기 실패:", e);
        }
      }
    }
  } else {
    // 구형 브라우저 지원
    const htmlContent = clipboardData.getData("text/html");
    if (htmlContent && htmlContent.includes("<table")) {
      return htmlContent;
    }
  }
  return null;
}

// 이미지를 처리하는 함수
async function processImages(item) {
  const images = item.querySelectorAll("img");
  for (const img of images) {
    const src = img.src;
    if (src.startsWith("file://")) {
      try {
        const response = await chrome.runtime.sendMessage({
          type: "convertImageToBase64",
          url: src,
        });

        if (response.success) {
          const uploadResponse = await uploadImageToConfluence(response.data);
          if (uploadResponse.success) {
            img.src = uploadResponse.url;
            img.setAttribute("data-src", uploadResponse.url);
            img.setAttribute("data-attachment-id", uploadResponse.attachmentId);
            img.setAttribute(
              "data-linked-resource-id",
              uploadResponse.attachmentId
            );
            img.setAttribute("data-linked-resource-type", "attachment");
            img.setAttribute("data-linked-resource-default-alias", "image.png");
            img.setAttribute("data-linked-resource-content-type", "image/png");
            img.setAttribute("data-linked-resource-container", "true");
            img.setAttribute("data-linked-resource-version", "1");
            img.setAttribute("data-base-url", window.location.origin);
          } else {
            img.src = response.data;
            img.setAttribute("data-src", response.data);
          }
        }
      } catch (e) {
        console.error("이미지 처리 중 오류:", e);
      }
    }
  }
}

// 내용을 삽입하는 함수
function insertContent(item, targetElement) {
  if (!targetElement || !targetElement.parentNode) {
    console.log("대상 요소를 찾을 수 없습니다. body에 직접 삽입합니다.");
    document.body.appendChild(item);
    return;
  }

  if (targetElement.nextSibling) {
    targetElement.parentNode.insertBefore(item, targetElement.nextSibling);
  } else {
    targetElement.parentNode.appendChild(item);
  }

  // 스타일을 인라인으로 변환
  setTimeout(() => {
    convertStylesToInline(item);
  }, 0);

  // 스크롤을 삽입된 위치로 이동
  item.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

// 알림을 표시하는 함수
function showNotification() {
  const notification = document.createElement("div");
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background-color: #4CAF50;
    color: white;
    padding: 15px 25px;
    border-radius: 4px;
    box-shadow: 0 2px 5px rgba(0,0,0,0.2);
    z-index: 9999;
    animation: fadeIn 0.3s ease-in-out;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
    cursor: pointer;
  `;
  notification.innerHTML = `
    <div style="font-size: 14px; font-weight: 500;">엑셀 테이블이 붙여넣기 되었습니다.</div>
    <div style="font-size: 11px; margin-top: 4px; opacity: 0.7; font-style: italic; display: flex; align-items: center; gap: 4px;">
      <span>by PowerPaste</span>
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="12" y1="16" x2="12" y2="12"></line>
        <line x1="12" y1="8" x2="12.01" y2="8"></line>
      </svg>
    </div>
  `;

  document.body.appendChild(notification);

  // 3초 후 알림 제거
  setTimeout(() => {
    notification.style.animation = "fadeOut 0.3s ease-in-out";
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

let isPowerPasteEnabled = true;
let indicatorElement = null;

// 초기 상태 로드
chrome.storage.local.get(["powerPasteEnabled"], function (result) {
  console.log("초기 상태 로드:", result);
  isPowerPasteEnabled = result.powerPasteEnabled !== false; // 기본값은 true
  console.log("초기 PowerPaste 상태:", isPowerPasteEnabled);
  updateIndicator();
});

// 메시지 리스너
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("메시지 수신:", message);

  if (message.action === "updatePowerPasteStatus") {
    console.log("PowerPaste 상태 업데이트 메시지 수신:", message.enabled);
    isPowerPasteEnabled = message.enabled;
    updateIndicator();
    console.log("PowerPaste 상태 업데이트 완료:", isPowerPasteEnabled);
    sendResponse({ success: true });
  }
  return true; // 비동기 응답을 위해 true 반환
});

// 상태 표시기 업데이트
function updateIndicator() {
  console.log("상태 표시기 업데이트 시작:", isPowerPasteEnabled);

  if (!indicatorElement) {
    indicatorElement = document.createElement("div");
    indicatorElement.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      height: 5px;
      z-index: 999999;
      transition: background-color 0.3s ease;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    `;
    document.body.appendChild(indicatorElement);
    console.log("상태 표시기 요소 생성 완료");
  }

  if (isPowerPasteEnabled) {
    indicatorElement.style.backgroundColor = "#2E7D32"; // 더 진한 초록색
    console.log("상태 표시기 색상 변경: 활성화");
  } else {
    indicatorElement.style.backgroundColor = "transparent";
    console.log("상태 표시기 색상 변경: 비활성화");
  }
}

// 초기 상태 표시기 생성
updateIndicator();

async function pasteHandler(event) {
  // PowerPaste가 비활성화된 경우 기본 이벤트 실행
  if (!isPowerPasteEnabled) {
    return;
  }

  console.log("=== 붙여넣기 이벤트 시작 ===");

  if (event.defaultPrevented) {
    console.log("이벤트가 이미 처리되었습니다.");
    return;
  }

  event.preventDefault();
  event.stopPropagation();

  const clipboardData = event.clipboardData || window.clipboardData;
  if (!clipboardData) {
    console.log("클립보드 데이터가 없습니다.");
    return;
  }

  const htmlContent = await getClipboardHtml(clipboardData);
  if (!htmlContent) {
    console.log("엑셀 데이터가 아닙니다.");
    return;
  }

  const item = document.createElement("div");
  item.innerHTML = htmlContent;

  await processImages(item);
  insertContent(item, event.target);
  showNotification();

  console.log("=== 붙여넣기 이벤트 완료 ===");
}

// Add paste event listener to the document
document.addEventListener("paste", pasteHandler, true); // capture phase에서 처리

// Function to add paste event listener to iframe
function addPasteHandlerToIframe(iframe) {
  try {
    const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
    iframeDoc.addEventListener("paste", pasteHandler, true); // capture phase에서 처리
  } catch (e) {
    console.error("Error adding paste handler to iframe:", e);
  }
}

// Add paste event listener to all existing iframes
document.querySelectorAll("iframe").forEach(addPasteHandlerToIframe);

// Observe DOM changes to add paste handler to dynamically added iframes
const observer = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    mutation.addedNodes.forEach((node) => {
      if (node.tagName === "IFRAME") {
        addPasteHandlerToIframe(node);
      } else if (node.querySelectorAll) {
        node.querySelectorAll("iframe").forEach(addPasteHandlerToIframe);
      }
    });
  });
});

// Start observing the document with the configured parameters
observer.observe(document.body, {
  childList: true,
  subtree: true,
});

// 컨플루언스에 이미지 업로드하는 함수
async function uploadImageToConfluence(base64Data) {
  try {
    // 현재 페이지의 컨플루언스 API 엔드포인트 찾기
    const pageId = getConfluencePageId();
    if (!pageId) {
      return {
        success: false,
        error: "컨플루언스 페이지 ID를 찾을 수 없습니다.",
      };
    }

    // base64 데이터에서 실제 이미지 데이터 추출
    const imageData = base64Data.split(",")[1];
    const binaryData = atob(imageData);
    const arrayBuffer = new ArrayBuffer(binaryData.length);
    const uint8Array = new Uint8Array(arrayBuffer);
    for (let i = 0; i < binaryData.length; i++) {
      uint8Array[i] = binaryData.charCodeAt(i);
    }
    const blob = new Blob([arrayBuffer], { type: "image/png" });

    // FormData 생성
    const formData = new FormData();
    formData.append("file", blob, "image.png");

    // 컨플루언스 API 호출
    const response = await fetch(
      `/rest/api/content/${pageId}/child/attachment`,
      {
        method: "POST",
        headers: {
          "X-Atlassian-Token": "no-check",
        },
        body: formData,
      }
    );

    if (response.ok) {
      const data = await response.json();
      // 컨플루언스의 blob URL 생성
      const blobUrl = URL.createObjectURL(blob);
      return {
        success: true,
        url: blobUrl,
        attachmentId: data.results[0].id,
      };
    } else {
      return {
        success: false,
        error: `이미지 업로드 실패: ${response.status}`,
      };
    }
  } catch (e) {
    return {
      success: false,
      error: `이미지 업로드 중 오류: ${e.message}`,
    };
  }
}

// 컨플루언스 페이지 ID를 가져오는 함수
function getConfluencePageId() {
  // 현재 URL에서 페이지 ID 추출
  const match = window.location.pathname.match(/\/pages\/(\d+)/);
  return match ? match[1] : null;
}
