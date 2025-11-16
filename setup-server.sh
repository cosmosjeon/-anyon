#!/bin/bash
# Anyon 서버 환경 설정 스크립트
# 사용법: EC2 서버에서 실행

set -e

echo "========================================="
echo "Anyon 서버 환경 설정 시작"
echo "========================================="

# 1. 시스템 업데이트
echo "1. 시스템 패키지 업데이트 중..."
sudo apt update
sudo apt upgrade -y

# 2. Docker 설치
echo "2. Docker 설치 중..."
if ! command -v docker &> /dev/null; then
    # Docker GPG 키 추가
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

    # Docker 저장소 추가
    echo \
      "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu \
      $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

    # Docker 설치
    sudo apt update
    sudo apt install docker-ce docker-ce-cli containerd.io docker-compose-plugin -y

    # Docker 서비스 시작
    sudo systemctl start docker
    sudo systemctl enable docker

    # 현재 사용자를 docker 그룹에 추가
    sudo usermod -aG docker $USER

    echo "Docker 설치 완료!"
    echo "⚠️  Docker 그룹 설정을 적용하려면 재로그인이 필요합니다."
else
    echo "Docker가 이미 설치되어 있습니다."
fi

# 3. Git 설치
echo "3. Git 설치 중..."
if ! command -v git &> /dev/null; then
    sudo apt install git -y
    echo "Git 설치 완료!"
else
    echo "Git이 이미 설치되어 있습니다."
fi

# 4. 유용한 도구 설치
echo "4. 유틸리티 설치 중..."
sudo apt install nano vim net-tools curl wget htop -y

# 버전 확인
echo ""
echo "========================================="
echo "설치된 버전 확인:"
echo "========================================="
docker --version
docker compose version
git --version

echo ""
echo "========================================="
echo "✅ 서버 환경 설정 완료!"
echo "========================================="
echo ""
echo "다음 단계:"
echo "1. 터미널을 종료하고 다시 접속하세요 (Docker 그룹 적용)"
echo "2. deploy-code.sh 스크립트를 실행하세요"
echo ""
