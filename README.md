# OZU TRADING

오주·혜령 두 계정용 개인 트레이딩 웹앱입니다. 모바일 화면을 우선으로 만들었으며 iPhone Safari에서 홈 화면에 추가해 앱처럼 사용할 수 있습니다.

## 지금 구현된 기능

- 오주/혜령 계정 선택 및 서버 비밀번호 로그인 (실제 인증 API 사용)
- 계정별 프로필 표시 이름과 사진 변경. 사진은 축소해 PostgreSQL에 저장되므로 로그인 화면에서도 유지됩니다.
- 계정별 업비트 API 키 등록·검증·암호화 저장 및 연결 해제
- 업비트 공개 실시간 시세 조회
- 두 계정의 잔고를 각각 조회하고, 지원되는 KRW 마켓 코인의 평가액 및 미실현 평가손익을 추정
- 등비 가격 간격과 저가 구간 고비중을 사용하는 피라미드 매수 계산, 10/5/3회 분할, 계정별 투자금, 나만 매수, 빠른 금액 추가, CSV 저장
- 주문 제출 전 검토 단계, 서버 실거래 잠금 확인
- 서버에 저장된 주문 기록 및 업비트 미체결 주문 조회
- 두 계정의 미체결 주문 전체 취소 요청
- 로그인한 사용자 본인 계정의 비상 전체 시장가 매도 엔드포인트. 요청 시 비밀번호 재확인이 필요하고, 서버 실거래 잠금이 켜져 있으면 실행되지 않습니다.
- HTTPS 세션 쿠키, 로그인 시도 제한, 보안 헤더, API 키 AES-256-GCM 암호화

## 반드시 알아둘 점

- `LIVE_TRADING_ENABLED=false`가 기본값입니다. 이 상태에서는 매수·비상 매도 API가 실제 주문을 보내지 않고 거부합니다. **앱을 배포했다고 실거래가 자동으로 준비되는 것은 아닙니다.**
- 실거래 활성화는 API 권한, IP 제한, 주문 단위·최소 주문 금액, 부분 체결, 요청 타임아웃, 중복 제출, 취소 실패를 테스트한 뒤에만 별도로 검토하세요.
- 전체 시장가 매도는 손실을 확정할 수 있고 체결 가격을 보장하지 않습니다. 이미 체결된 주문은 취소로 되돌릴 수 없습니다.
- 비상 매도는 현재 로그인한 사용자 계정만 대상으로 합니다. 미체결 주문에 묶인 코인 수량은 매도 가능 잔고에 포함되지 않으며, 앱이 지원하지 않는 KRW 마켓 종목은 건너뛸 수 있습니다.
- 잔고 평가액은 앱이 지원하는 KRW 마켓 시세를 이용합니다. 지원하지 않는 코인 또는 시세 조회 실패 자산은 평가액에서 제외될 수 있습니다. 미실현 손익은 평균 매수가 기준 추정치로, 수수료·실현 손익·세금은 반영하지 않습니다.
- 브라우저 기반 Face ID/패스키 로그인은 아직 구현되지 않았습니다. 현재 로그인과 비상 매도 재확인은 계정 비밀번호 방식입니다. UI에서 Face ID가 동작한다고 가장하지 않습니다.
- OKX 연동은 화면에 표시만 되어 있고 실제 API는 구현되어 있지 않습니다.
- 앱은 출금 API를 구현하지 않습니다. 업비트 API 키에는 출금 권한을 부여하지 마세요.
- `.env`, 비밀번호 원문, API 키, 세션/암호화 비밀값을 GitHub에 커밋하지 마세요.

## 요구 사항

- Node.js 20 이상
- PostgreSQL
- HTTPS가 적용되는 Node.js 서버 호스팅

## 로컬 실행

1. `npm install`
2. `.env.example`을 `.env`로 복사하고 값을 입력합니다.
3. 비밀값 생성: `node server/generate-secrets.js`
4. 각 계정의 비밀번호 해시 생성:
   - `node server/hash-password.js "오주가 사용할 긴 비밀번호"`
   - `node server/hash-password.js "혜령이 사용할 별도 긴 비밀번호"`
5. 생성한 Base64 32바이트 키를 `ENCRYPTION_KEY`, 충분히 긴 랜덤 값을 `SESSION_SECRET`에 설정하고, 각 해시를 `OZU_PASSWORD_HASH`, `HYERYEONG_PASSWORD_HASH`에 설정합니다.
6. `DATABASE_URL`에 PostgreSQL 연결 문자열을 설정합니다.
7. `npm start`
8. `http://localhost:3000/api/health`와 `http://localhost:3000/api/profiles`가 응답하는지 확인합니다.

프로필 테이블은 서버 시작 시 자동으로 생성됩니다. `db/schema.sql`은 참고용 전체 스키마입니다.

## Render 배포

1. 프로젝트의 파일과 폴더가 GitHub 저장소 루트에 있어야 합니다. 특히 `package.json`, `public/index.html`, `server/`, `db/`, `render.yaml`이 루트 아래에 있어야 합니다.
2. Render에서 **New → Blueprint**를 선택하고 저장소를 연결합니다. `render.yaml`에는 Node 웹 서비스와 PostgreSQL 데이터베이스 설정이 포함되어 있습니다.
3. Render 환경변수에서 `ENCRYPTION_KEY`, `OZU_PASSWORD_HASH`, `HYERYEONG_PASSWORD_HASH`를 직접 입력합니다. `SESSION_SECRET`은 Blueprint 설정에 따라 생성됩니다.
4. `ENCRYPTION_KEY`는 `node server/generate-secrets.js`의 Base64 32바이트 키를 사용합니다. API 키가 저장된 뒤 이 값을 변경하면 기존 키를 복호화하지 못할 수 있으므로 안전하게 백업하세요.
5. 첫 배포 후 `/api/health`가 `{ "ok": true, ... }`를 반환하는지 확인합니다. 이어서 각 계정에 로그인하고 프로필 저장과 공개 시세 조회를 테스트합니다.
6. 각 사용자는 본인 계정으로 로그인해 본인의 업비트 API 키를 등록합니다. 업비트 키는 잔고 조회와 거래에 필요한 권한만 허용하고 출금 권한은 부여하지 않습니다.

`render.yaml`의 서버와 DB 요금제는 호스팅 비용이 발생할 수 있습니다. 배포 전에 Render 대시보드에서 현재 요금 및 인스턴스 정책을 확인하세요.

## 주요 API

- `GET /api/health` — 서버 상태와 실거래 잠금 상태
- `GET /api/profiles` — 로그인 선택 화면용 프로필 사진/표시 이름
- `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me` — 로그인/세션
- `PUT /api/profile` — 로그인 사용자 프로필 업데이트
- `GET /api/credentials/status`, `POST /api/credentials/upbit`, `DELETE /api/credentials/upbit` — 업비트 키 연결 관리
- `GET /api/market/prices` — 공개 시세
- `GET /api/upbit/accounts`, `GET /api/upbit/all-balances` — 계정별 잔고
- `GET /api/upbit/open-orders`, `POST /api/orders/cancel-open` — 미체결 주문 조회/취소 요청
- `GET /api/orders/history` — 서버 주문 기록
- `POST /api/pyramid/orders` — 피라미드 지정가 주문; 기본 설정에서 잠금
- `POST /api/emergency/market-sell` — 현재 로그인 사용자의 비상 시장가 매도; 기본 설정에서 잠금 및 비밀번호 재확인

## 검사

```bash
npm run check
```

이 명령은 핵심 서버 JS 파일의 문법을 검사합니다. 프런트엔드도 배포 전에 iPhone Safari와 데스크톱 브라우저에서 로그인, 프로필 사진 업로드, 키 연결, 시세/잔고, 계산기, 미체결 주문 조회를 각각 테스트하세요.
