# 확장프로그램을 zip 파일로 압축
Compress-Archive -Path manifest.json, content.js, background.js, images -DestinationPath PowerPaste.zip -Force

# Chrome 브라우저 경로 설정 (사용자의 Chrome 설치 경로에 따라 수정 필요)
$chromePath = "C:\Program Files\Google\Chrome\Application\chrome.exe"

# .crx 파일 생성
& $chromePath --pack-extension=./PowerPaste --pack-extension-key=./key.pem 