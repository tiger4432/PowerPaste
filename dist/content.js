// PowerPaste - 엑셀 테이블을 HTML로 변환하여 웹페이지에 붙여넣기
// 개발자: 김경호
// 버전: 1.0.0

// CSS 속성 이름을 camelCase로 변환하는 함수
function toCamelCase(str) {
  return str.replace(/-([a-z])/g, function(g) { return g[1].toUpperCase(); });
}

// 알림 애니메이션을 위한 CSS 스타일 추가
const style = document.createElement('style');
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
    'background-color',
    'color',
    'font-family',
    'font-size',
    'font-weight',
    'text-align',
    'vertical-align',
    'border',
    'border-top',
    'border-right',
    'border-bottom',
    'border-left',
    'padding',
    'padding-top',
    'padding-right',
    'padding-bottom',
    'padding-left',
    'margin',
    'margin-top',
    'margin-right',
    'margin-bottom',
    'margin-left',
    'width',
    'height',
    'min-width',
    'min-height',
    'max-width',
    'max-height',
    'display',
    'position',
    'top',
    'right',
    'bottom',
    'left',
    'float',
    'clear',
    'overflow',
    'overflow-x',
    'overflow-y',
    'white-space',
    'text-overflow',
    'text-decoration',
    'text-transform',
    'line-height',
    'letter-spacing',
    'word-spacing',
    'table-layout',
    'border-collapse',
    'border-spacing',
    'empty-cells',
    'caption-side'
  ];

  // 모든 요소의 스타일을 인라인으로 변환
  const allElements = element.querySelectorAll('*');
  allElements.forEach(el => {
    const computedStyle = window.getComputedStyle(el);
    let inlineStyle = '';
    
    // 중요한 스타일 속성만 인라인으로 변환
    importantStyles.forEach(property => {
      const value = computedStyle.getPropertyValue(property);
      
      // 기본값이 아닌 스타일만 인라인으로 변환
      if (value && value !== 'none' && value !== 'auto' && value !== 'normal' && 
          value !== '0px' && value !== '0%' && value !== '0') {
        inlineStyle += `${property}:${value};`;
      }
    });
    
    if (inlineStyle) {
      el.setAttribute('style', inlineStyle);
    }
  });

  // 모든 스타일 태그 제거
  const styleTags = element.querySelectorAll('style');
  styleTags.forEach(styleTag => styleTag.remove());

  // 메타 태그 제거
  const metaTags = element.querySelectorAll('meta');
  metaTags.forEach(metaTag => metaTag.remove());

  // link 태그 제거
  const linkTags = element.querySelectorAll('link');
  linkTags.forEach(linkTag => linkTag.remove());

  // 모든 스타일이 인라인으로 변환된 후 클래스 제거
  const tableElements = element.querySelectorAll('td, th, tr, table');
  tableElements.forEach(el => el.removeAttribute('class'));

  return element;
}

async function pasteHandler(event) {
  console.log('=== 붙여넣기 이벤트 시작 ===');
  
  // 이벤트가 이미 처리되었는지 확인
  if (event.defaultPrevented) {
    console.log('이벤트가 이미 처리되었습니다.');
    return;
  }
  
  let clipboardData = event.clipboardData || window.clipboardData;
  if (!clipboardData) {
    console.log('클립보드 데이터가 없습니다.');
    return;
  }

  console.log('클립보드 데이터:', clipboardData);

  // 엑셀에서 복사한 데이터인지 확인
  let isExcelData = false;
  let detectedHtmlContent = "";  // HTML 내용을 저장할 변수 추가

  if (clipboardData.items) {
    console.log('클립보드 항목:', clipboardData.items);
    const items = Array.from(clipboardData.items);
    for (const dataItem of items) {
      console.log('클립보드 항목 타입:', dataItem.type);
      if (dataItem.type === "text/html") {
        try {
          const htmlContent = await new Promise((resolve) => {
            dataItem.getAsString((string) => resolve(string));
          });
          console.log('HTML 내용:', htmlContent);
          
          // 엑셀에서 복사한 데이터는 일반적으로 table 태그를 포함
          if (htmlContent && htmlContent.includes('<table')) {
            console.log('엑셀 데이터 감지됨');
            isExcelData = true;
            detectedHtmlContent = htmlContent;  // HTML 내용 저장
            break;
          }
        } catch (e) {
          console.error('HTML 데이터 가져오기 실패:', e);
        }
      }
    }
  } else {
    // 구형 브라우저 지원
    const htmlContent = clipboardData.getData("text/html");
    console.log('구형 브라우저 HTML 내용:', htmlContent);
    if (htmlContent && htmlContent.includes('<table')) {
      console.log('엑셀 데이터 감지됨 (구형 브라우저)');
      isExcelData = true;
      detectedHtmlContent = htmlContent;  // HTML 내용 저장
    }
  }

  // 엑셀 데이터가 아닌 경우 기본 붙여넣기 이벤트 실행
  if (!isExcelData) {
    console.log('엑셀 데이터가 아닙니다. 기본 붙여넣기 실행');
    return;
  }

  console.log('엑셀 데이터 처리 시작');
  const item = document.createElement("div");

  // 저장된 HTML 내용이 있는 경우 사용
  if (detectedHtmlContent) {
    console.log('감지된 HTML 내용 사용:', detectedHtmlContent);
    item.innerHTML = detectedHtmlContent;
  } else {
    console.log('HTML 내용이 없습니다. 대체 방법 시도');
    try {
      const htmlContent = clipboardData.getData("text/html");
      console.log('대체 방법으로 가져온 HTML:', htmlContent);
      if (htmlContent) {
        item.innerHTML = htmlContent;
      } else {
        console.log('모든 방법으로 HTML 내용을 가져오는데 실패했습니다.');
        return;
      }
    } catch (e) {
      console.error('대체 방법으로 HTML 가져오기 실패:', e);
      return;
    }
  }

  // 이미지 처리
  console.log('이미지 처리 시작');
  const images = item.querySelectorAll("img");
  console.log('발견된 이미지 수:', images.length);

  // Process each image
  for (let i = 0; i < images.length; i++) {
    const img = images[i];
    const src = img.src;
    console.log('이미지 처리:', src);

    // Check if image is from file:// protocol
    if (src.startsWith('file://')) {
      console.log('file:// 프로토콜 이미지 처리');
      try {
        // Background script를 통해 이미지 처리
        const response = await chrome.runtime.sendMessage({
          type: 'convertImageToBase64',
          url: src
        });

        if (response.success) {
          console.log('이미지 변환 성공');
          img.src = response.data;
        } else {
          console.error("이미지 처리 실패:", response.error);
        }
      } catch (e) {
        console.error("이미지 처리 중 오류:", e);
      }
    } else {
      console.log('클립보드 이미지 처리');
      // Check if there's a corresponding image file in clipboard items
      if (clipboardData.items) {
        const items = Array.from(clipboardData.items);
        for (const dataItem of items) {
          if (dataItem.type.startsWith("image/")) {
            try {
              // Get image as blob
              const blob = dataItem.getAsFile();
              if (blob) {
                console.log('이미지 blob 처리');
                // Convert to base64
                const reader = new FileReader();
                await new Promise((resolve) => {
                  reader.onloadend = function () {
                    img.src = reader.result; // Replace with base64 data
                    resolve();
                  };
                  reader.readAsDataURL(blob);
                });
                break;
              }
            } catch (e) {
              console.error("이미지 처리 중 오류:", e);
            }
          }
        }
      }
    }
  }

  // 이미지 처리 후 내용 삽입 부분을 수정
  try {
    console.log('내용 삽입 시작');
    // 이벤트가 발생한 요소 찾기
    const targetElement = event.target;
    console.log('대상 요소:', targetElement);
    
    // iframe 내부에서 발생한 경우 처리
    let targetDocument;
    if (targetElement.tagName === 'IFRAME') {
      console.log('iframe 내부에서 발생');
      targetDocument = targetElement.contentDocument || targetElement.contentWindow.document;
    } else if (targetElement.ownerDocument !== document) {
      console.log('다른 문서에서 발생');
      targetDocument = targetElement.ownerDocument;
    } else {
      console.log('현재 문서에서 발생');
      targetDocument = document;
    }

    // 현재 요소의 다음 위치에 삽입
    if (targetElement && targetElement.parentNode) {
      console.log('대상 요소의 부모 노드에 삽입');
      if (targetElement.nextSibling) {
        console.log('다음 형제 요소 앞에 삽입');
        targetElement.parentNode.insertBefore(item, targetElement.nextSibling);
      } else {
        console.log('부모 요소의 마지막 자식으로 삽입');
        targetElement.parentNode.appendChild(item);
      }
      
      // 요소가 DOM에 삽입된 후 스타일을 인라인으로 변환
      setTimeout(() => {
        console.log('스타일 인라인 변환 시작');
        convertStylesToInline(item);
        console.log('스타일 인라인 변환 완료');
      }, 0);
      
      // 스크롤을 삽입된 위치로 이동
      item.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    } else {
      console.log('body에 직접 삽입');
      // 대상 요소를 찾을 수 없는 경우 body에 추가
      targetDocument.body.appendChild(item);
      
      // 요소가 DOM에 삽입된 후 스타일을 인라인으로 변환
      setTimeout(() => {
        console.log('스타일 인라인 변환 시작');
        convertStylesToInline(item);
        console.log('스타일 인라인 변환 완료');
      }, 0);
    }

    // 알림 표시
    console.log('알림 표시');
    const notification = document.createElement('div');
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
    `;
    notification.innerHTML = `
      <div>엑셀 테이블이 붙여넣기 되었습니다.</div>
      <div style="font-size: 12px; margin-top: 5px; opacity: 0.8;">PowerPaste by 김경호</div>
    `;
    document.body.appendChild(notification);

    // 3초 후 알림 제거
    setTimeout(() => {
      notification.style.animation = 'fadeOut 0.3s ease-in-out';
      setTimeout(() => notification.remove(), 300);
    }, 3000);

  } catch (e) {
    console.error("내용 삽입 중 오류:", e);
    return; // 실패 시 기본 동작 허용
  }

  // 기본 붙여넣기 동작 방지
  event.preventDefault();
  event.stopPropagation();
  console.log('=== 붙여넣기 이벤트 완료 ===');
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
  subtree: true
}); 