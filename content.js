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
        // 색상 속성인 경우 CSS 변수 매칭 시도
        if (property === "background-color" || property === "color") {
          const hexColor = value.startsWith("rgb") ? rgbToHex(value) : value;
          if (hexColor && hexColor.startsWith("#")) {
            const nearestVar = findNearestColorVariable(hexColor);
            if (nearestVar) {
              inlineStyle += `${property}:var(${nearestVar});`;
            } else {
              inlineStyle += `${property}:${value};`;
            }
          } else {
            inlineStyle += `${property}:${value};`;
          }
        } else {
          inlineStyle += `${property}:${value};`;
        }
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
      transition: background-color 0.2s ease;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    `;
    document.body.appendChild(indicatorElement);
    console.log("상태 표시기 요소 생성 완료");
  }

  // 즉시 색상 변경
  indicatorElement.style.backgroundColor = isPowerPasteEnabled
    ? "#2E7D32"
    : "transparent";
  console.log(
    "상태 표시기 색상 변경:",
    isPowerPasteEnabled ? "활성화" : "비활성화"
  );
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

// URL 변경 감지 및 iframe paste 이벤트 등록
function setupURLChangeDetection() {
  console.log("URL 변경 감지 설정 시작");

  // 현재 URL 저장
  let currentURL = window.location.href;

  // history.pushState와 popstate 이벤트 감시
  const originalPushState = history.pushState;
  history.pushState = function () {
    originalPushState.apply(this, arguments);
    handleURLChange();
  };

  window.addEventListener("popstate", handleURLChange);

  // DOM 변경 감시 (iframe 추가/제거)
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node.tagName === "IFRAME") {
          console.log("새로운 iframe 감지됨");
          addPasteHandlerToIframe(node);
        } else if (node.querySelectorAll) {
          node.querySelectorAll("iframe").forEach(addPasteHandlerToIframe);
        }
      });
    });
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });

  // URL 변경 처리 함수
  function handleURLChange() {
    const newURL = window.location.href;
    if (newURL !== currentURL) {
      console.log("URL 변경 감지:", newURL);
      currentURL = newURL;

      // 모든 iframe에 paste 이벤트 핸들러 재등록
      document.querySelectorAll("iframe").forEach(addPasteHandlerToIframe);
    }
  }

  // 초기 iframe paste 이벤트 등록
  document.querySelectorAll("iframe").forEach(addPasteHandlerToIframe);
}

// iframe에 paste 이벤트 핸들러 추가
function addPasteHandlerToIframe(iframe) {
  try {
    const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
    iframeDoc.addEventListener("paste", pasteHandler, true);
    console.log("iframe에 paste 이벤트 핸들러 등록됨");
  } catch (e) {
    console.error("iframe에 paste 이벤트 핸들러 등록 실패:", e);
  }
}

// 초기 설정 실행
setupURLChangeDetection();

// 색상 유사도 계산 함수
function getColorDistance(color1, color2) {
  const r1 = parseInt(color1.slice(1, 3), 16);
  const g1 = parseInt(color1.slice(3, 5), 16);
  const b1 = parseInt(color1.slice(5, 7), 16);

  const r2 = parseInt(color2.slice(1, 3), 16);
  const g2 = parseInt(color2.slice(3, 5), 16);
  const b2 = parseInt(color2.slice(5, 7), 16);

  return Math.sqrt(
    Math.pow(r2 - r1, 2) + Math.pow(g2 - g1, 2) + Math.pow(b2 - b1, 2)
  );
}

// 가장 가까운 CSS 변수 색상 찾기
function findNearestColorVariable(hexColor) {
  const style = getComputedStyle(document.documentElement);
  const cssVars = Array.from(style).filter((prop) => prop.startsWith("--"));

  let nearestVar = null;
  let minDistance = Infinity;

  cssVars.forEach((cssVar) => {
    const varValue = style.getPropertyValue(cssVar).trim();
    if (varValue.startsWith("#")) {
      const distance = getColorDistance(hexColor, varValue);
      if (distance < minDistance) {
        minDistance = distance;
        nearestVar = cssVar;
      }
    }
  });

  return nearestVar;
}

// RGB 색상을 HEX로 변환
function rgbToHex(rgb) {
  const match = rgb.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
  if (!match) return null;

  const r = parseInt(match[1]);
  const g = parseInt(match[2]);
  const b = parseInt(match[3]);

  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

function processTable(table) {
  console.log("테이블 처리 시작");

  // 테이블 스타일 설정
  const tableStyle = {
    borderCollapse: "collapse",
    width: "100%",
    margin: "10px 0",
    fontFamily: "Arial, sans-serif",
    fontSize: "14px",
  };

  // 스타일 객체를 동결하여 변경 방지
  Object.freeze(tableStyle);

  // 테이블에 스타일 적용
  Object.assign(table.style, tableStyle);

  // 모든 셀에 스타일 적용
  const cells = table.getElementsByTagName("td");
  const cellStyle = {
    border: "1px solid #ddd",
    padding: "8px",
    textAlign: "left",
  };

  // 셀 스타일 객체도 동결
  Object.freeze(cellStyle);

  Array.from(cells).forEach((cell) => {
    // 기존 스타일 백업
    const originalStyle = cell.getAttribute("style");

    // 셀에 스타일 적용
    Object.assign(cell.style, cellStyle);

    // 배경색 처리
    const bgColor = cell.style.backgroundColor;
    if (bgColor) {
      const hexColor = bgColor.startsWith("rgb") ? rgbToHex(bgColor) : bgColor;
      if (hexColor) {
        const nearestVar = findNearestColorVariable(hexColor);
        if (nearestVar) {
          cell.style.backgroundColor = `var(${nearestVar})`;
        }
      }
    }

    // 텍스트 색상 처리
    const textColor = cell.style.color;
    if (textColor) {
      const hexColor = textColor.startsWith("rgb")
        ? rgbToHex(textColor)
        : textColor;
      if (hexColor) {
        const nearestVar = findNearestColorVariable(hexColor);
        if (nearestVar) {
          cell.style.color = `var(${nearestVar})`;
        }
      }
    }

    // data-mce-style 속성 제거
    cell.removeAttribute("data-mce-style");

    // 스타일 변경 감지 및 방지
    const styleObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (
          mutation.type === "attributes" &&
          mutation.attributeName === "data-mce-style"
        ) {
          cell.removeAttribute("data-mce-style");
          if (originalStyle) {
            cell.setAttribute("style", originalStyle);
          }
        }
      });
    });

    // 셀의 속성 변경 감시
    styleObserver.observe(cell, {
      attributes: true,
      attributeFilter: ["data-mce-style", "style"],
    });
  });

  console.log("테이블 처리 완료");
  return table;
}
