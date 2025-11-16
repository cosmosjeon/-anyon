#!/bin/bash
# Anyon 코드를 AWS 서버로 배포하는 스크립트
# 사용법: 로컬에서 실행
#   ./deploy-to-server.sh [SSH_KEY_PATH]

set -e

# 설정
SERVER_IP="43.200.12.99"
SERVER_USER="ubuntu"
REMOTE_DIR="~/anyon"
SSH_KEY="${1:-~/.ssh/anyon-key.pem}"

echo "========================================="
echo "Anyon AWS 서버 배포"
echo "========================================="
echo "서버: $SERVER_IP"
echo "SSH 키: $SSH_KEY"
echo ""

# SSH 키 파일 확인
if [ ! -f "$SSH_KEY" ]; then
    echo "❌ 오류: SSH 키 파일을 찾을 수 없습니다: $SSH_KEY"
    echo ""
    echo "사용법: ./deploy-to-server.sh [SSH_KEY_PATH]"
    echo "예시: ./deploy-to-server.sh ~/.ssh/vibekanban-key.pem"
    exit 1
fi

# 1. 로컬 코드를 서버로 복사
echo "1. 코드를 서버로 전송 중..."
rsync -avz --delete \
    --exclude 'node_modules' \
    --exclude 'target' \
    --exclude 'frontend/dist' \
    --exclude 'frontend/node_modules' \
    --exclude '.git' \
    --exclude '.env*' \
    -e "ssh -i $SSH_KEY -o StrictHostKeyChecking=no" \
    ./ ${SERVER_USER}@${SERVER_IP}:${REMOTE_DIR}/

echo "✅ 코드 전송 완료!"
echo ""

# 2. .env.remote 템플릿 생성 안내
echo "========================================="
echo "⚠️  중요: 환경 변수 설정 필요"
echo "========================================="
echo ""
echo "서버에 접속하여 .env.remote 파일을 생성해야 합니다:"
echo ""
echo "ssh -i $SSH_KEY ${SERVER_USER}@${SERVER_IP}"
echo ""
echo "서버 접속 후 다음 명령어 실행:"
echo ""
echo "cd ~/anyon"
echo "nano .env.remote"
echo ""
echo "========================================="
echo "✅ 배포 완료!"
echo "========================================="
echo ""
echo "다음 단계:"
echo "1. SSH로 서버 접속"
echo "2. .env.remote 파일 생성 (템플릿은 env.remote.template 참고)"
echo "3. Docker 컨테이너 빌드 및 실행"
echo ""
