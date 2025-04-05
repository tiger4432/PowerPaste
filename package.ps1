# dist 폴더가 없으면 생성
if (-not (Test-Path -Path "dist")) {
    New-Item -ItemType Directory -Path "dist"
}

# 필요한 파일들을 dist 폴더로 복사
Copy-Item -Path "manifest.json" -Destination "dist"
Copy-Item -Path "content.js" -Destination "dist"
Copy-Item -Path "background.js" -Destination "dist"
Copy-Item -Path "icons" -Destination "dist" -Recurse

# dist 폴더로 이동
Set-Location -Path "dist"

# zip 파일 생성
Compress-Archive -Path * -DestinationPath "../PowerPaste.zip" -Force

# 원래 디렉토리로 돌아가기
Set-Location -Path ".."

Write-Host "패키징이 완료되었습니다. PowerPaste.zip 파일이 생성되었습니다."

# Chrome 브라우저 경로 설정
$chromePath = "C:\Program Files\Google\Chrome\Application\chrome.exe"

# 현재 디렉토리의 절대 경로 가져오기
$currentPath = Get-Location

# .crx 파일 생성
Write-Host "Chrome 확장 프로그램 패키징을 시작합니다..."
& $chromePath --pack-extension="$currentPath" --no-message-box

Write-Host "패키징이 완료되었습니다. PowerPaste.crx 파일이 생성되었습니다." 