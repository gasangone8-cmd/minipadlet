# MINIPADLET

Next.js, Supabase, Vercel 기반의 단일 개인 메모 보드입니다. 섹션·컬럼·카테고리 없이 메모 카드만 자유롭게 쌓입니다.

## 로컬 실행

1. Supabase SQL Editor에서 `schema.sql`을 실행합니다.
2. `.env.local.example`을 `.env.local`로 복사하고 값을 채웁니다.
3. `ADMIN_PASSWORD`에 관리자 로그인에서 사용할 비밀번호를 평문으로 입력합니다. 예: `ADMIN_PASSWORD=admin1234`
4. `ADMIN_SESSION_SECRET`에는 관리자 비밀번호와 다른 길고 무작위인 문자열을 넣습니다. 아래 명령으로 생성할 수 있습니다.

```bash
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

5. 의존성을 설치하고 개발 서버를 실행합니다.

```bash
npm ci
npm run dev
```

## Vercel 배포

이 저장소의 기준 프로젝트는 루트 폴더입니다. Vercel Root Directory는 루트(`.`), Framework Preset은 Next.js, Build Command는 `npm run build`를 사용합니다. `padlet/`은 전달된 중복 프로젝트이며 루트 빌드에서는 제외됩니다. 양쪽의 앱 소스에는 같은 수정을 적용했습니다.

기존 레거시 연결 형식을 유지합니다. `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`에는 프로젝트 URL과 레거시 anon JWT, `SUPABASE_SERVICE_ROLE_KEY`에는 레거시 service_role JWT를 입력하세요. `ADMIN_PASSWORD`는 기존처럼 평문이며 해시값으로 바꾸지 않습니다.

GitHub 저장소를 Vercel에 연결한 뒤 Project Settings → Environment Variables에 `.env.local.example`의 다섯 값을 등록하고 배포합니다. `SUPABASE_SERVICE_ROLE_KEY`, `ADMIN_PASSWORD`, `ADMIN_SESSION_SECRET`은 Secret 유형으로 등록하고 절대 `NEXT_PUBLIC_` 접두사를 붙이지 마세요. 예시의 `admin1234`는 로컬 확인용이므로 실제 배포 전에는 충분히 긴 비밀번호로 바꾸세요.

## 보안 구조

- 브라우저는 공개 URL/anon key로 메모 목록만 조회합니다.
- 메모 생성 시 4자리 비밀번호 해시는 서버 API에서 bcrypt로 만듭니다.
- 일반 삭제는 서버에서 해시를 비교한 뒤 service role로 수행합니다.
- 관리자 비밀번호는 서버 전용 환경 변수에서만 읽고, 관리자 인증과 삭제는 HttpOnly 세션 쿠키를 검증하는 서버 API에서만 수행합니다.
- `schema.sql`은 명시적 `GRANT`와 RLS 정책을 함께 적용합니다.
- 공개 조회는 `id,title,content,created_at` 컬럼으로 제한하여 삭제 비밀번호 해시 노출을 막습니다. 기존 DB에도 수정된 `schema.sql`을 다시 실행하세요. 이 스크립트는 메모를 삭제하지 않습니다.
- 관리자 세션은 서버에서 8시간 만료를 검증합니다. 관리자 비밀번호 또는 세션 secret을 바꾸면 기존 세션이 무효화됩니다. 로그아웃은 현재 브라우저 쿠키를 제거합니다.

## 배포 전 확인

```bash
npm run lint
node scripts/check-security.cjs
npm run build
```

배포 후 메모 작성 → 새로고침 → 검색 → 틀린 비밀번호로 삭제 거부 → 올바른 비밀번호로 삭제 → 관리자 로그인/강제 삭제/로그아웃을 확인하세요. 전체 삭제는 검증용 메모만 있는 보드에서 확인하세요.

환경변수를 변경하면 Vercel에서 재배포해야 합니다. 공개 보드이므로 방문자는 누구나 메모를 읽고 작성할 수 있습니다.
