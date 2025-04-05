#!/bin/bash

# 확장프로그램을 zip 파일로 압축
zip -r PowerPaste.zip manifest.json content.js background.js images/

# .crx 파일 생성
google-chrome --pack-extension=./PowerPaste --pack-extension-key=./key.pem 