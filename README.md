# front

Vite + React + TypeScript 기반 프론트엔드입니다.

## 실행 (현재 디렉토리 기준)

아래 명령은 모두 이 폴더(`front`)에서 실행합니다.

```powershell
cd .\front
```

이미 `front` 폴더에 들어와 있다면 위 `cd`는 생략해도 됩니다.

### 1) 의존성 설치

```powershell
npm ci
```

처음 세팅이거나 `package-lock.json`이 없는 경우:

```powershell
npm install
```

### 2) 환경변수 설정

`.env.example`을 참고해서 `.env`를 만듭니다.

```dotenv
VITE_API_BASE_URL=http://localhost:8000
```

- `VITE_API_BASE_URL`: API 요청을 보낼 백엔드 Base URL
  - 미설정 시 코드에서 기본값 `http://localhost:8000`을 사용합니다. (`src/shared/api/client.ts`)

### 3) 개발 서버 실행

```powershell
npm run dev
```

Vite 기본 설정이면 보통 `http://localhost:5173`에서 열립니다. (포트가 이미 사용 중이면 다른 포트로 뜰 수 있습니다.)

## 빌드/배포 확인

### Production 빌드

```powershell
npm run build
```

- 결과물은 `dist/`에 생성됩니다.

### 빌드 결과 로컬 프리뷰

```powershell
npm run preview
```

## 기타 스크립트

### Lint

```powershell
npm run lint
```

## 트러블슈팅

- API 호출이 실패할 때:
  - 백엔드가 실행 중인지 확인하고, 프론트의 `VITE_API_BASE_URL`이 올바른지 확인합니다.
  - 개발 중이라면 브라우저 콘솔/네트워크 탭에서 요청 URL이 기대한 값으로 나가는지 확인합니다.
- `npm ci`가 실패할 때:
  - `package-lock.json`과 `node`/`npm` 버전 차이로 실패할 수 있습니다. 이 경우 `npm install`을 시도해 보세요.
