# 🚀 Anyon AWS 배포 가이드

리브랜딩된 Anyon을 AWS 서버(43.200.12.99)에 배포하는 단계별 가이드입니다.

---

## 📋 현재 상태

✅ 리브랜딩 완료
- Vibe Kanban → Anyon
- BloopAI → Slit
- VK → AY (환경 변수)

✅ AWS EC2 인스턴스 생성 완료
- IP: 43.200.12.99 (탄력적 IP)

---

## 🎯 배포 단계

### 1단계: 서버 환경 설정

**서버에 SSH 접속:**

```bash
# SSH 키 파일 경로를 본인 것으로 변경
ssh -i ~/.ssh/your-key.pem ubuntu@43.200.12.99
```

**환경 설정 스크립트 실행:**

```bash
# 로컬에서 스크립트를 서버로 전송
scp -i ~/.ssh/your-key.pem setup-server.sh ubuntu@43.200.12.99:~/

# 서버에서 스크립트 실행
ssh -i ~/.ssh/your-key.pem ubuntu@43.200.12.99
chmod +x setup-server.sh
./setup-server.sh
```

스크립트가 완료되면 **터미널을 종료하고 다시 접속**하세요 (Docker 그룹 적용).

**또는 수동 설정:**

<details>
<summary>수동으로 설정하기 (클릭)</summary>

```bash
# 시스템 업데이트
sudo apt update && sudo apt upgrade -y

# Docker 설치
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt update
sudo apt install docker-ce docker-ce-cli containerd.io docker-compose-plugin -y
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -aG docker $USER

# Git 및 유틸리티 설치
sudo apt install git nano vim net-tools curl wget htop -y

# 재로그인
exit
# 다시 SSH 접속
```

</details>

---

### 2단계: 코드 배포

**옵션 A: 자동 배포 스크립트 사용 (권장)**

로컬 컴퓨터에서:

```bash
cd /Users/cosmos/Documents/dev/vibe-anyon/vibe-kanban

# 실행 권한 부여
chmod +x deploy-to-server.sh

# 배포 실행 (SSH 키 경로 지정)
./deploy-to-server.sh ~/.ssh/your-key.pem
```

**옵션 B: 수동 복사**

<details>
<summary>rsync로 수동 복사 (클릭)</summary>

```bash
# 로컬에서 실행
rsync -avz --delete \
    --exclude 'node_modules' \
    --exclude 'target' \
    --exclude 'frontend/dist' \
    --exclude 'frontend/node_modules' \
    --exclude '.git' \
    -e "ssh -i ~/.ssh/your-key.pem" \
    ./ ubuntu@43.200.12.99:~/anyon/
```

</details>

---

### 3단계: 환경 변수 설정

**서버에 SSH 접속:**

```bash
ssh -i ~/.ssh/your-key.pem ubuntu@43.200.12.99
```

**JWT 비밀키 생성:**

```bash
openssl rand -base64 48
```

출력값을 복사해두세요. 예시:
```
xK8jZp2+vL9mN4qR6sT8uV0wX3yA5bC7dE9fG1hI2jK4lM6nO8pQ0rS2tU4vW6xY
```

**환경 변수 파일 생성:**

```bash
cd ~/anyon
nano .env.remote
```

**파일 내용 (아래 내용을 복사하여 붙여넣고 값 수정):**

```env
# JWT 비밀키 (위에서 생성한 값)
VIBEKANBAN_REMOTE_JWT_SECRET=xK8jZp2+vL9mN4qR6sT8uV0wX3yA5bC7dE9fG1hI2jK4lM6nO8pQ0rS2tU4vW6xY

# 데이터베이스 (Docker Compose의 로컬 DB 사용)
SERVER_DATABASE_URL=postgresql://postgres:postgres@db:5432/vibekanban

# 서버 설정
SERVER_LISTEN_ADDR=0.0.0.0:8081
SERVER_ACTIVITY_CHANNEL=activity
SERVER_ACTIVITY_BROADCAST_SHARDS=16
SERVER_ACTIVITY_BROADCAST_CAPACITY=512

# 공개 URL
SERVER_PUBLIC_BASE_URL=http://43.200.12.99:3000

# GitHub OAuth (필수 - 아래에서 생성)
GITHUB_OAUTH_CLIENT_ID=YOUR_GITHUB_CLIENT_ID
GITHUB_OAUTH_CLIENT_SECRET=YOUR_GITHUB_CLIENT_SECRET

# 이메일 (선택사항)
LOOPS_EMAIL_API_KEY=dummy_key_for_now

# Vite 프론트엔드
VITE_APP_BASE_URL=http://43.200.12.99:3000
VITE_API_BASE_URL=http://43.200.12.99:3000
```

저장: `Ctrl + O` → `Enter` → `Ctrl + X`

---

### 4단계: GitHub OAuth 앱 생성

1. **GitHub OAuth 설정 페이지 접속:**
   - https://github.com/settings/developers
   - "OAuth Apps" → "New OAuth App"

2. **앱 정보 입력:**
   ```
   Application name: Anyon Production
   Homepage URL: http://43.200.12.99:3000
   Authorization callback URL: http://43.200.12.99:3000/oauth/callback
   ```

3. **생성 후 Client ID와 Client Secret 복사**

4. **서버의 .env.remote 파일에 추가:**
   ```bash
   nano ~/anyon/.env.remote

   # GITHUB_OAUTH_CLIENT_ID와 GITHUB_OAUTH_CLIENT_SECRET 값 수정
   ```

---

### 5단계: Docker 빌드 및 실행

**서버에서 실행:**

```bash
cd ~/anyon/crates/remote

# Docker Compose로 빌드 및 실행
docker compose --env-file ../../.env.remote up -d --build
```

⏱️ **첫 빌드는 10~15분 소요됩니다 (Rust 컴파일)**

**빌드 진행 상황 확인:**

```bash
# 로그 실시간 확인
docker compose --env-file ../../.env.remote logs -f
```

`Ctrl + C`로 로그 보기 종료

---

### 6단계: 배포 확인

**컨테이너 상태 확인:**

```bash
cd ~/anyon/crates/remote
docker compose ps
```

예상 출력:
```
NAME                    STATUS
remote-remote-server-1  Up X minutes
remote-db-1             Up X minutes
```

**헬스체크:**

```bash
# 서버에서 테스트
curl http://localhost:3000/v1/health

# 로컬 컴퓨터에서 테스트
curl http://43.200.12.99:3000/v1/health
```

둘 다 `"ok"` 출력되면 성공! ✅

**브라우저 테스트:**
```
http://43.200.12.99:3000/v1/health
```

---

## 🎉 배포 완료!

### 다음 단계

**로컬 앱에서 서버 연결:**

```bash
# 로컬 터미널에서
export AY_SHARED_API_BASE=http://43.200.12.99:3000
npx anyon
```

**팀원과 공유:**

팀원들에게 다음 명령어 공유:
```bash
export AY_SHARED_API_BASE=http://43.200.12.99:3000
npx anyon
```

---

## 🔧 유용한 명령어

### 서비스 관리

```bash
# 서비스 중지
docker compose --env-file ../../.env.remote down

# 서비스 시작
docker compose --env-file ../../.env.remote up -d

# 서비스 재시작
docker compose --env-file ../../.env.remote restart

# 로그 확인
docker compose --env-file ../../.env.remote logs -f remote-server
```

### 코드 업데이트

로컬에서 코드 수정 후:

```bash
# 로컬에서 배포
./deploy-to-server.sh ~/.ssh/your-key.pem

# 서버에서 재빌드
ssh -i ~/.ssh/your-key.pem ubuntu@43.200.12.99
cd ~/anyon/crates/remote
docker compose --env-file ../../.env.remote up -d --build
```

---

## ⚠️ 문제 해결

### 컨테이너가 시작되지 않음

```bash
# 로그 확인
docker compose logs remote-server

# 일반적인 원인:
# 1. .env.remote 설정 오류
# 2. 포트 충돌
# 3. 메모리 부족
```

### 포트 확인

```bash
sudo netstat -tulpn | grep 3000
sudo netstat -tulpn | grep 8081
```

### 메모리 부족 시 스왑 생성

```bash
sudo fallocate -l 4G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

---

## 📞 지원

문제가 발생하면 다음을 확인하세요:

1. **.env.remote 파일 설정**
2. **GitHub OAuth 설정**
3. **포트 충돌 여부**
4. **Docker 로그**

---

**축하합니다! 🎊**

Anyon이 성공적으로 배포되었습니다!
