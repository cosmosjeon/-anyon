# AWS에서 Vibe Kanban 서비스 구축 완벽 가이드

> **목표:** Vibe Kanban을 AWS에 배포하여 나만의 협업 서비스 만들기

**예상 소요 시간:** 2~3시간
**예상 월 비용:** $20~50
**난이도:** 중급

---

## 📋 목차

1. [준비 사항](#1-준비-사항)
2. [AWS 계정 설정](#2-aws-계정-설정)
3. [VPC 및 네트워크 설정](#3-vpc-및-네트워크-설정)
4. [RDS PostgreSQL 데이터베이스 생성](#4-rds-postgresql-데이터베이스-생성)
5. [EC2 인스턴스 생성](#5-ec2-인스턴스-생성)
6. [서버 환경 설정](#6-서버-환경-설정)
7. [코드 배포](#7-코드-배포)
8. [도메인 및 SSL 설정](#8-도메인-및-ssl-설정)
9. [자동 배포 설정](#9-자동-배포-설정)
10. [모니터링 및 로깅](#10-모니터링-및-로깅)
11. [비용 최적화](#11-비용-최적화)
12. [문제 해결](#12-문제-해결)

---

## 1. 준비 사항

### ✅ 체크리스트

```
□ AWS 계정 (신용카드 필요)
□ GitHub 계정
□ 도메인 (선택사항, Route53에서 구매 가능)
□ 터미널 사용 기본 지식
□ SSH 키 쌍 생성 방법 숙지
```

### 💰 예상 비용 (서울 리전 기준)

| 서비스 | 스펙 | 월 비용 |
|--------|------|---------|
| EC2 (t3.small) | 2 vCPU, 2GB RAM | $15 |
| RDS (db.t3.micro) | 1 vCPU, 1GB RAM, 20GB | $15 |
| EBS (볼륨) | 30GB | $3 |
| 데이터 전송 | 100GB/월 | $9 |
| Route53 (도메인) | - | $0.50 |
| **총합** | | **~$42/월** |

**💡 Tip:** 프리 티어로 12개월 무료 사용 가능!

---

## 2. AWS 계정 설정

### A. AWS 계정 생성

1. **AWS 웹사이트 접속**
   - https://aws.amazon.com/ko/
   - "계정 생성" 클릭

2. **계정 정보 입력**
   ```
   이메일 주소: your-email@example.com
   계정 이름: MyVibeKanban
   비밀번호: (강력한 비밀번호)
   ```

3. **연락처 정보**
   - 개인 또는 비즈니스 선택
   - 전화번호, 주소 입력

4. **결제 정보**
   - 신용카드 등록
   - $1 임시 결제 (나중에 환불)

5. **본인 인증**
   - 전화번호로 인증 코드 수신
   - 코드 입력

6. **플랜 선택**
   - **"기본(무료)" 플랜 선택**

### B. MFA (다단계 인증) 설정 (중요!)

1. **IAM 콘솔 이동**
   - 서비스 → IAM
   - "내 보안 자격 증명"

2. **MFA 활성화**
   ```
   - "MFA 할당" 클릭
   - "가상 MFA 디바이스" 선택
   - Google Authenticator 앱으로 QR 스캔
   - 연속 2개의 MFA 코드 입력
   ```

### C. IAM 사용자 생성 (권장)

```bash
# Root 계정 대신 사용할 관리자 계정 만들기

1. IAM → 사용자 → "사용자 추가"
2. 사용자 이름: admin
3. AWS 액세스 유형: 프로그래밍 방식 액세스, AWS Management Console 액세스
4. 권한: AdministratorAccess 정책 연결
5. 태그: Name=AdminUser
6. 생성 완료 후 액세스 키 다운로드 (중요!)
```

---

## 3. VPC 및 네트워크 설정

### A. VPC 생성

1. **VPC 콘솔 이동**
   - 서비스 → VPC
   - 리전: **ap-northeast-2 (서울)** 선택

2. **VPC 생성**
   ```
   이름: vibekanban-vpc
   IPv4 CIDR: 10.0.0.0/16
   IPv6 CIDR: IPv6 CIDR 블록 없음
   테넌시: 기본값
   ```

### B. 서브넷 생성

**퍼블릭 서브넷 1 (가용 영역 A)**
```
이름: vibekanban-public-1a
VPC: vibekanban-vpc
가용 영역: ap-northeast-2a
IPv4 CIDR: 10.0.1.0/24
```

**퍼블릭 서브넷 2 (가용 영역 C)**
```
이름: vibekanban-public-1c
VPC: vibekanban-vpc
가용 영역: ap-northeast-2c
IPv4 CIDR: 10.0.2.0/24
```

**프라이빗 서브넷 1 (가용 영역 A)**
```
이름: vibekanban-private-1a
VPC: vibekanban-vpc
가용 영역: ap-northeast-2a
IPv4 CIDR: 10.0.11.0/24
```

**프라이빗 서브넷 2 (가용 영역 C)**
```
이름: vibekanban-private-1c
VPC: vibekanban-vpc
가용 영역: ap-northeast-2c
IPv4 CIDR: 10.0.12.0/24
```

### C. 인터넷 게이트웨이 생성

```
1. VPC → 인터넷 게이트웨이 → 생성
2. 이름: vibekanban-igw
3. 생성 후 VPC에 연결
4. VPC 선택: vibekanban-vpc
```

### D. 라우팅 테이블 설정

**퍼블릭 라우팅 테이블**
```
1. VPC → 라우팅 테이블 → 생성
2. 이름: vibekanban-public-rt
3. VPC: vibekanban-vpc
4. 라우팅 편집:
   - 대상: 0.0.0.0/0
   - 타겟: vibekanban-igw
5. 서브넷 연결:
   - vibekanban-public-1a
   - vibekanban-public-1c
```

---

## 4. RDS PostgreSQL 데이터베이스 생성

### A. 서브넷 그룹 생성

```
1. RDS → 서브넷 그룹 → 생성
2. 이름: vibekanban-db-subnet-group
3. VPC: vibekanban-vpc
4. 가용 영역: ap-northeast-2a, ap-northeast-2c
5. 서브넷:
   - vibekanban-private-1a (10.0.11.0/24)
   - vibekanban-private-1c (10.0.12.0/24)
```

### B. 보안 그룹 생성 (DB용)

```
1. EC2 → 보안 그룹 → 생성
2. 이름: vibekanban-db-sg
3. VPC: vibekanban-vpc
4. 인바운드 규칙:
   - 유형: PostgreSQL
   - 프로토콜: TCP
   - 포트: 5432
   - 소스: vibekanban-server-sg (EC2 보안 그룹, 나중에 생성)
```

### C. RDS 인스턴스 생성

1. **기본 설정**
   ```
   엔진: PostgreSQL
   버전: PostgreSQL 16.x
   템플릿: 프리 티어 (또는 개발/테스트)
   ```

2. **인스턴스 설정**
   ```
   DB 인스턴스 식별자: vibekanban-db
   마스터 사용자 이름: postgres
   마스터 암호: [강력한 비밀번호 생성]
   암호 확인: [동일한 비밀번호]
   ```

   ⚠️ **중요:** 비밀번호를 안전한 곳에 저장하세요!

3. **인스턴스 구성**
   ```
   DB 인스턴스 클래스: db.t3.micro (프리 티어)
   또는
   DB 인스턴스 클래스: db.t3.small (프로덕션)

   스토리지:
   - 스토리지 유형: 범용 SSD (gp3)
   - 할당된 스토리지: 20 GB
   - 스토리지 자동 조정: 활성화
   - 최대 스토리지: 100 GB
   ```

4. **연결**
   ```
   VPC: vibekanban-vpc
   서브넷 그룹: vibekanban-db-subnet-group
   퍼블릭 액세스: 아니요 (중요!)
   VPC 보안 그룹: vibekanban-db-sg
   가용 영역: ap-northeast-2a
   ```

5. **데이터베이스 옵션**
   ```
   초기 데이터베이스 이름: vibekanban
   포트: 5432
   DB 파라미터 그룹: default.postgres16
   ```

6. **백업**
   ```
   자동 백업: 활성화
   백업 보존 기간: 7일
   백업 기간: 02:00-03:00 (한국 시간)
   ```

7. **암호화**
   ```
   저장 시 암호화: 활성화
   마스터 키: (기본값) aws/rds
   ```

8. **생성!**
   - "데이터베이스 생성" 클릭
   - ⏱️ 5~10분 대기

### D. 데이터베이스 엔드포인트 확인

```
RDS → 데이터베이스 → vibekanban-db → 연결 & 보안

엔드포인트 예시:
vibekanban-db.c1a2b3c4d5e6.ap-northeast-2.rds.amazonaws.com

⚠️ 이 주소를 메모장에 복사해두세요!
```

---

## 5. EC2 인스턴스 생성

### A. 보안 그룹 생성 (서버용)

```
1. EC2 → 보안 그룹 → 생성
2. 이름: vibekanban-server-sg
3. VPC: vibekanban-vpc

4. 인바운드 규칙:

   규칙 1 - SSH
   - 유형: SSH
   - 프로토콜: TCP
   - 포트: 22
   - 소스: 내 IP (자동 감지)

   규칙 2 - HTTP
   - 유형: HTTP
   - 프로토콜: TCP
   - 포트: 80
   - 소스: 0.0.0.0/0

   규칙 3 - HTTPS
   - 유형: HTTPS
   - 프로토콜: TCP
   - 포트: 443
   - 소스: 0.0.0.0/0

   규칙 4 - 애플리케이션
   - 유형: 사용자 지정 TCP
   - 프로토콜: TCP
   - 포트: 3000
   - 소스: 0.0.0.0/0

5. 아웃바운드 규칙: 모든 트래픽 허용 (기본값)
```

### B. 키 페어 생성

```
1. EC2 → 키 페어 → 생성
2. 이름: vibekanban-key
3. 키 페어 유형: RSA
4. 프라이빗 키 파일 형식:
   - Mac/Linux: .pem
   - Windows: .ppk (PuTTY 사용)
5. "키 페어 생성" → 파일 다운로드
6. 파일 권한 설정 (Mac/Linux):
   chmod 400 ~/Downloads/vibekanban-key.pem
```

### C. EC2 인스턴스 시작

1. **AMI 선택**
   ```
   EC2 → 인스턴스 시작

   이름: vibekanban-server
   AMI: Ubuntu Server 22.04 LTS (HVM), SSD Volume Type
   아키텍처: 64비트 (x86)
   ```

2. **인스턴스 유형**
   ```
   프리 티어: t2.micro (1 vCPU, 1GB RAM)
   권장: t3.small (2 vCPU, 2GB RAM) - $15/월
   프로덕션: t3.medium (2 vCPU, 4GB RAM) - $30/월
   ```

3. **키 페어**
   ```
   키 페어: vibekanban-key
   ```

4. **네트워크 설정**
   ```
   VPC: vibekanban-vpc
   서브넷: vibekanban-public-1a
   퍼블릭 IP 자동 할당: 활성화
   보안 그룹: vibekanban-server-sg
   ```

5. **스토리지 구성**
   ```
   루트 볼륨:
   - 크기: 30 GB
   - 볼륨 유형: 범용 SSD (gp3)
   - 종료 시 삭제: 예
   ```

6. **고급 세부 정보**
   ```
   IAM 인스턴스 프로파일: (없음)
   사용자 데이터: (비워둠)
   ```

7. **인스턴스 시작!**
   - "인스턴스 시작" 클릭
   - ⏱️ 2분 정도 대기

### D. Elastic IP 할당 (고정 IP)

```
1. EC2 → 탄력적 IP → 주소 할당
2. "할당" 클릭
3. 할당된 IP 선택 → 작업 → 주소 연결
4. 인스턴스: vibekanban-server
5. "연결" 클릭

예시 IP: 43.201.123.45

⚠️ 이 IP를 메모장에 복사해두세요!
```

---

## 6. 서버 환경 설정

### A. SSH 접속

```bash
# Mac/Linux
ssh -i ~/Downloads/vibekanban-key.pem ubuntu@43.201.123.45

# Windows (PowerShell with OpenSSH)
ssh -i C:\Users\YourName\Downloads\vibekanban-key.pem ubuntu@43.201.123.45

# 또는 PuTTY 사용
```

**처음 접속 시:**
```
The authenticity of host... (yes/no)?
→ yes 입력
```

### B. 시스템 업데이트

```bash
# 패키지 목록 업데이트
sudo apt update

# 패키지 업그레이드
sudo apt upgrade -y

# 재부팅 (필요 시)
sudo reboot
# 1분 후 다시 SSH 접속
```

### C. Docker 설치

```bash
# Docker 공식 GPG 키 추가
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

# 설정 적용을 위해 재로그인
exit
# 다시 SSH 접속

# Docker 설치 확인
docker --version
docker compose version
```

**출력 예시:**
```
Docker version 24.0.7, build afdd53b
Docker Compose version v2.23.3
```

### D. Git 설치

```bash
sudo apt install git -y

git --version
# 출력: git version 2.34.1
```

### E. 유용한 도구 설치

```bash
# 텍스트 에디터
sudo apt install nano vim -y

# 네트워크 도구
sudo apt install net-tools curl wget -y

# 프로세스 관리
sudo apt install htop -y
```

---

## 7. 코드 배포

### A. 저장소 복제

```bash
# 홈 디렉토리로 이동
cd ~

# Vibe Kanban 복제
git clone https://github.com/BloopAI/vibe-kanban.git

# 디렉토리 이동
cd vibe-kanban
```

### B. 프로젝트 커스터마이징 (선택사항)

**브랜딩 변경:**

```bash
# 프로젝트 이름 변경
nano frontend/package.json
# "name": "my-kanban-service"

# 로고 교체
# frontend/public/ 디렉토리의 이미지 파일 교체

# README 수정
nano README.md
```

### C. OAuth 설정 (GitHub)

**1. GitHub OAuth 앱 생성**
- https://github.com/settings/developers
- "OAuth Apps" → "New OAuth App"

```
Application name: MyKanban Production
Homepage URL: http://43.201.123.45:3000
                또는
              https://yourdomain.com

Authorization callback URL:
  http://43.201.123.45:3000/oauth/callback
  또는
  https://yourdomain.com/oauth/callback
```

**2. Client ID & Secret 복사**
```
Client ID: Ov23liABC123XYZ
Client Secret: 1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t
```

### D. 환경 변수 설정

```bash
# .env.remote 파일 생성
cd ~/vibe-kanban
nano .env.remote
```

**파일 내용:**

```env
# JWT 비밀키 (아래 명령어로 생성)
VIBEKANBAN_REMOTE_JWT_SECRET=YOUR_JWT_SECRET_HERE

# 데이터베이스 연결 (RDS 엔드포인트 사용)
SERVER_DATABASE_URL=postgresql://postgres:YOUR_DB_PASSWORD@vibekanban-db.c1a2b3c4d5e6.ap-northeast-2.rds.amazonaws.com:5432/vibekanban

# 서버 설정
SERVER_LISTEN_ADDR=0.0.0.0:8081
SERVER_ACTIVITY_CHANNEL=activity
SERVER_ACTIVITY_BROADCAST_SHARDS=16
SERVER_ACTIVITY_BROADCAST_CAPACITY=512

# 공개 URL (Elastic IP 또는 도메인)
SERVER_PUBLIC_BASE_URL=http://43.201.123.45:3000

# GitHub OAuth
GITHUB_OAUTH_CLIENT_ID=Ov23liABC123XYZ
GITHUB_OAUTH_CLIENT_SECRET=1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t

# Google OAuth (선택사항)
# GOOGLE_OAUTH_CLIENT_ID=your_google_client_id
# GOOGLE_OAUTH_CLIENT_SECRET=your_google_client_secret

# 이메일 서비스 (Loops.so)
# 무료 계정: https://loops.so
LOOPS_EMAIL_API_KEY=dummy_key_for_now

# Vite 설정
VITE_APP_BASE_URL=http://43.201.123.45:3000
VITE_API_BASE_URL=http://43.201.123.45:3000
```

**JWT 비밀키 생성:**

```bash
# JWT 비밀키 생성
openssl rand -base64 48

# 출력 예시:
# xK8jZp2+vL9mN4qR6sT8uV0wX3yA5bC7dE9fG1hI2jK4lM6nO8pQ0rS2tU4vW6xY

# 이 값을 VIBEKANBAN_REMOTE_JWT_SECRET에 붙여넣기
```

**저장:**
```
Ctrl + O (저장)
Enter
Ctrl + X (나가기)
```

### E. Docker Compose로 실행

```bash
# remote 디렉토리로 이동
cd ~/vibe-kanban/crates/remote

# Docker 이미지 빌드 및 실행
docker compose --env-file ../../.env.remote up -d --build
```

**⏱️ 첫 실행은 10~15분 소요 (Rust 컴파일)**

### F. 실행 확인

```bash
# 컨테이너 상태 확인
docker compose ps

# 출력:
# NAME                    IMAGE                    STATUS
# remote-remote-server-1  remote-remote-server     Up 2 minutes
# remote-db-1             postgres:16-alpine       Up 2 minutes

# 로그 확인
docker compose --env-file ../../.env.remote logs -f remote-server

# 정상 실행 메시지:
# shared sync server listening addr=0.0.0.0:8081
```

**Ctrl + C로 로그 보기 종료**

### G. 서비스 테스트

```bash
# 로컬에서 테스트
curl http://localhost:3000/v1/health

# 외부에서 테스트 (다른 컴퓨터에서)
curl http://43.201.123.45:3000/v1/health

# 둘 다 "ok" 출력되면 성공!
```

**브라우저 테스트:**
```
http://43.201.123.45:3000/v1/health
→ "ok" 표시되어야 함
```

---

## 8. 도메인 및 SSL 설정

### A. 도메인 구매 (Route 53)

**옵션 1: Route 53에서 구매**

```
1. Route 53 → 도메인 → 도메인 등록
2. 도메인 검색: mykanban.com
3. 장바구니 추가 → 체크아웃
4. 연락처 정보 입력
5. 자동 갱신: 활성화
6. 구매 ($12/년)
```

**옵션 2: 외부 도메인 사용 (Namecheap, GoDaddy 등)**

```
1. 도메인 구매
2. DNS 설정을 Route 53으로 변경
```

### B. Route 53 호스팅 영역 설정

```
1. Route 53 → 호스팅 영역 → 생성
2. 도메인 이름: mykanban.com
3. 유형: 퍼블릭 호스팅 영역
4. 생성
```

**A 레코드 생성:**
```
1. 레코드 생성 클릭
2. 레코드 이름: (비워둠 - 루트 도메인)
3. 레코드 유형: A
4. 값: 43.201.123.45 (Elastic IP)
5. TTL: 300
6. 라우팅 정책: 단순 라우팅
7. 생성
```

**www 레코드 생성 (선택사항):**
```
1. 레코드 생성 클릭
2. 레코드 이름: www
3. 레코드 유형: CNAME
4. 값: mykanban.com
5. TTL: 300
6. 생성
```

### C. Nginx 설치 및 설정

```bash
# SSH로 서버 접속
ssh -i ~/Downloads/vibekanban-key.pem ubuntu@43.201.123.45

# Nginx 설치
sudo apt update
sudo apt install nginx -y

# Nginx 시작
sudo systemctl start nginx
sudo systemctl enable nginx
```

**Nginx 설정 파일 생성:**

```bash
sudo nano /etc/nginx/sites-available/vibekanban
```

**내용:**

```nginx
# HTTP 서버
server {
    listen 80;
    listen [::]:80;
    server_name mykanban.com www.mykanban.com;

    # 나중에 SSL 설정 후 HTTPS로 리다이렉트
    # return 301 https://$server_name$request_uri;

    # 임시로 HTTP 프록시
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;

        # WebSocket 지원
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';

        # 헤더 설정
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 86400;
    }
}
```

**설정 활성화:**

```bash
# 심볼릭 링크 생성
sudo ln -s /etc/nginx/sites-available/vibekanban /etc/nginx/sites-enabled/

# 기본 설정 삭제
sudo rm /etc/nginx/sites-enabled/default

# 설정 테스트
sudo nginx -t

# 출력:
# nginx: configuration file /etc/nginx/nginx.conf test is successful

# Nginx 재시작
sudo systemctl restart nginx
```

### D. SSL 인증서 설정 (Let's Encrypt)

```bash
# Certbot 설치
sudo apt install certbot python3-certbot-nginx -y

# SSL 인증서 발급
sudo certbot --nginx -d mykanban.com -d www.mykanban.com

# 프롬프트 응답:
# 이메일: your-email@example.com
# 약관 동의: Y
# 뉴스레터: N (선택)
# HTTPS 리다이렉트: 2 (모든 요청을 HTTPS로)
```

**자동 갱신 설정 확인:**

```bash
# 자동 갱신 테스트
sudo certbot renew --dry-run

# 출력:
# Congratulations, all simulated renewals succeeded
```

**Nginx 설정이 자동으로 업데이트됨:**

```nginx
# /etc/nginx/sites-available/vibekanban (자동 수정됨)

server {
    listen 80;
    server_name mykanban.com www.mykanban.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name mykanban.com www.mykanban.com;

    ssl_certificate /etc/letsencrypt/live/mykanban.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/mykanban.com/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 86400;
    }
}
```

### E. 도메인으로 테스트

```bash
# 브라우저에서 접속
https://mykanban.com/v1/health
→ "ok" 표시

# SSL 인증서 확인
# 브라우저 주소창의 자물쇠 아이콘 클릭
# "연결이 안전함" 표시되어야 함
```

### F. .env.remote 업데이트

```bash
cd ~/vibe-kanban
nano .env.remote

# SERVER_PUBLIC_BASE_URL 변경:
SERVER_PUBLIC_BASE_URL=https://mykanban.com
VITE_APP_BASE_URL=https://mykanban.com
VITE_API_BASE_URL=https://mykanban.com
```

**서비스 재시작:**

```bash
cd ~/vibe-kanban/crates/remote
docker compose --env-file ../../.env.remote down
docker compose --env-file ../../.env.remote up -d
```

---

## 9. 자동 배포 설정

### A. GitHub Actions 워크플로우 생성

**프로젝트 포크:**

```bash
# GitHub에서 fork
# https://github.com/BloopAI/vibe-kanban
# 오른쪽 상단 "Fork" 클릭
```

**배포 스크립트 생성:**

```bash
# 로컬 컴퓨터에서
cd ~/vibe-kanban
mkdir -p .github/workflows
nano .github/workflows/deploy-aws.yml
```

**내용:**

```yaml
name: Deploy to AWS

on:
  push:
    branches:
      - main
  workflow_dispatch:

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Deploy to EC2
        uses: appleboy/ssh-action@v1.0.0
        with:
          host: ${{ secrets.EC2_HOST }}
          username: ubuntu
          key: ${{ secrets.EC2_SSH_KEY }}
          script: |
            cd ~/vibe-kanban
            git pull origin main
            cd crates/remote
            docker compose --env-file ../../.env.remote down
            docker compose --env-file ../../.env.remote up -d --build
            docker compose ps
```

### B. GitHub Secrets 설정

```
1. GitHub 저장소 → Settings → Secrets and variables → Actions
2. "New repository secret" 클릭

Secret 1:
Name: EC2_HOST
Value: 43.201.123.45

Secret 2:
Name: EC2_SSH_KEY
Value: (vibekanban-key.pem 파일 내용 전체 복사)
```

**SSH 키 내용 복사:**

```bash
# Mac/Linux
cat ~/Downloads/vibekanban-key.pem

# Windows
type C:\Users\YourName\Downloads\vibekanban-key.pem

# 출력 전체를 복사 (-----BEGIN RSA PRIVATE KEY----- 부터
# -----END RSA PRIVATE KEY----- 까지)
```

### C. 자동 배포 테스트

```bash
# 코드 수정
echo "# My Kanban Service" > README.md

# 커밋 & 푸시
git add .
git commit -m "Test auto deployment"
git push origin main

# GitHub Actions 탭에서 배포 상태 확인
# https://github.com/your-username/vibe-kanban/actions
```

---

## 10. 모니터링 및 로깅

### A. CloudWatch 알람 설정

**1. CPU 사용률 알람**

```
1. CloudWatch → 알람 → 생성
2. 지표 선택:
   - EC2 → 인스턴스별 지표 → vibekanban-server
   - 지표: CPUUtilization
3. 조건:
   - 임계값: 80% (80 입력)
   - 데이터 포인트: 2/2
4. 알림:
   - 새 SNS 주제 생성
   - 이름: vibekanban-alerts
   - 이메일: your-email@example.com
5. 이름: vibekanban-high-cpu
6. 생성
```

**2. RDS 연결 알람**

```
지표: DatabaseConnections
임계값: 80
```

**3. 디스크 공간 알람**

```
지표: disk_used_percent (CloudWatch Agent 필요)
임계값: 80
```

### B. 로그 확인

**Docker 로그:**

```bash
# 실시간 로그
docker compose -f ~/vibe-kanban/crates/remote/docker-compose.yml \
  --env-file ~/vibe-kanban/.env.remote logs -f

# 최근 100줄
docker compose logs --tail=100 remote-server

# 특정 시간대
docker compose logs --since="2024-01-01T00:00:00"
```

**Nginx 로그:**

```bash
# 액세스 로그
sudo tail -f /var/log/nginx/access.log

# 에러 로그
sudo tail -f /var/log/nginx/error.log
```

### C. 백업 설정

**RDS 자동 백업 (이미 설정됨):**
- 보존 기간: 7일
- 백업 시간: 02:00-03:00

**수동 스냅샷 생성:**

```
1. RDS → 데이터베이스 → vibekanban-db
2. 작업 → 스냅샷 생성
3. 이름: vibekanban-db-snapshot-YYYYMMDD
4. 생성
```

**애플리케이션 데이터 백업 (선택사항):**

```bash
# 크론탭 설정
crontab -e

# 매일 3시에 백업
0 3 * * * docker exec remote-db-1 pg_dump -U postgres vibekanban | gzip > ~/backups/vibekanban-$(date +\%Y\%m\%d).sql.gz

# 백업 디렉토리 생성
mkdir -p ~/backups
```

---

## 11. 비용 최적화

### A. 예약 인스턴스 (1년 약정)

```
EC2 → 예약 인스턴스 → 구매

인스턴스 유형: t3.small
약정 기간: 1년
결제 옵션: 전체 선결제

할인: 최대 40%
월 $15 → $9
```

### B. 스팟 인스턴스 (개발/테스트)

```
테스트 서버를 스팟 인스턴스로:
- 비용: 일반 가격의 70% 할인
- 주의: 언제든 종료될 수 있음
```

### C. 사용하지 않는 리소스 정리

```bash
# EBS 스냅샷 삭제
EC2 → 스냅샷 → 오래된 스냅샷 삭제

# Elastic IP 해제 (사용 안 할 경우)
탄력적 IP → 미사용 IP → 릴리스

# CloudWatch 로그 보존 기간 설정
CloudWatch → 로그 그룹 → 보존 설정: 7일
```

### D. 비용 알림 설정

```
1. Billing → 예산 → 예산 생성
2. 유형: 비용 예산
3. 금액: $50/월
4. 알림: 실제 비용 > 80%
5. 이메일 알림 설정
```

---

## 12. 문제 해결

### ❗ 일반적인 문제들

#### 1. Docker 컨테이너가 시작 안 됨

```bash
# 로그 확인
docker compose logs remote-server

# 일반적 원인:
# - .env.remote 설정 오류
# - 데이터베이스 연결 실패
# - 포트 충돌

# 해결:
# .env.remote 파일 재확인
# RDS 보안 그룹 확인
# 포트 사용 확인
sudo netstat -tulpn | grep 3000
```

#### 2. RDS 연결 실패

```bash
# 보안 그룹 확인
EC2 → 보안 그룹 → vibekanban-db-sg
→ 인바운드 규칙에 vibekanban-server-sg 있는지 확인

# 연결 테스트
docker exec -it remote-remote-server-1 sh
nc -zv vibekanban-db.xxxxx.rds.amazonaws.com 5432

# DATABASE_URL 확인
cat ~/vibe-kanban/.env.remote | grep DATABASE_URL
```

#### 3. SSL 인증서 오류

```bash
# Certbot 갱신
sudo certbot renew

# Nginx 설정 재확인
sudo nginx -t
sudo systemctl restart nginx
```

#### 4. GitHub OAuth 로그인 안 됨

```
1. GitHub OAuth 설정 확인
   - Callback URL이 정확한지
   - 도메인이 일치하는지

2. .env.remote 확인
   - CLIENT_ID, CLIENT_SECRET 정확한지
   - SERVER_PUBLIC_BASE_URL이 맞는지

3. 서비스 재시작
   cd ~/vibe-kanban/crates/remote
   docker compose restart
```

#### 5. 메모리 부족

```bash
# 스왑 파일 생성 (4GB)
sudo fallocate -l 4G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# 영구 설정
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

# 확인
free -h
```

---

## 🎉 완료 체크리스트

```
✅ AWS 계정 생성 및 MFA 설정
✅ VPC 및 서브넷 구성
✅ RDS PostgreSQL 데이터베이스 생성
✅ EC2 인스턴스 생성 및 Elastic IP 할당
✅ Docker 및 필수 도구 설치
✅ Vibe Kanban 코드 배포
✅ OAuth 설정 (GitHub/Google)
✅ 도메인 연결 및 SSL 인증서 설정
✅ Nginx 리버스 프록시 구성
✅ 자동 배포 파이프라인 설정
✅ CloudWatch 모니터링 및 알람
✅ 백업 설정
✅ 비용 최적화
```

---

## 📚 추가 리소스

### 문서
- [AWS EC2 문서](https://docs.aws.amazon.com/ec2/)
- [RDS PostgreSQL 문서](https://docs.aws.amazon.com/rds/postgresql/)
- [Docker Compose 문서](https://docs.docker.com/compose/)
- [Nginx 문서](https://nginx.org/en/docs/)

### 커뮤니티
- [Vibe Kanban GitHub](https://github.com/BloopAI/vibe-kanban)
- [AWS 한국 사용자 그룹](https://www.facebook.com/groups/awskrug/)

### 도움말
- AWS 기술 지원: https://console.aws.amazon.com/support
- Let's Encrypt 커뮤니티: https://community.letsencrypt.org/

---

## 🔐 보안 권장 사항

1. **정기적인 업데이트**
   ```bash
   # 매주 실행
   sudo apt update && sudo apt upgrade -y
   ```

2. **SSH 보안 강화**
   ```bash
   # 비밀번호 로그인 비활성화
   sudo nano /etc/ssh/sshd_config
   # PasswordAuthentication no
   sudo systemctl restart sshd
   ```

3. **Fail2Ban 설치**
   ```bash
   sudo apt install fail2ban -y
   sudo systemctl enable fail2ban
   ```

4. **RDS 암호화 활성화** (이미 설정됨)
   - 저장 시 암호화: 활성화
   - 전송 중 암호화: SSL 연결

5. **정기 백업 확인**
   - RDS 스냅샷: 매일 확인
   - 데이터 백업: 주간 복원 테스트

---

**축하합니다! 🎊**

이제 AWS에서 완전히 작동하는 Vibe Kanban 서비스를 운영하고 있습니다!

**다음 단계:**
- 팀원 초대하기
- 프로젝트 생성하기
- 로컬 앱에서 `export VK_SHARED_API_BASE=https://mykanban.com` 설정
- 협업 시작!

**문제가 있나요?**
- 이 문서의 "문제 해결" 섹션 참고
- GitHub Issues에 질문 올리기
- AWS 지원팀 문의

**즐거운 개발 되세요! 🚀**
