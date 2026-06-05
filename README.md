# 📚 StudyMate AI

공부자료(텍스트 입력 또는 **PDF/PPTX/PPT 업로드**)를 넣으면 AI가 **시험 대비 요약 · 용어정리 · 예상문제 · 복습카드**를 만들어주는 개인용 학습 웹앱.

> **현재 버전 = 텍스트 입력 + 파일 업로드 기반 MVP** 입니다.
> **PC / 노트북 중심**으로 설계되었습니다. 모바일에서는 상하 구조로 자연스럽게 전환됩니다.

---

## 🧭 화면 흐름 (3단계)

```
[1] 메인(대시보드)          [2] 자료 화면                     [3] 학습 화면
 과목 선택 중심      →   /subjects/[id]            →    /subjects/[id]/study
 · 과목 목록 그리드      · 파일 업로드(드래그앤드롭)        · 좌우 50:50 분할
 · + 새 과목 만들기      · 업로드 목록 + 추출 상태          · 왼쪽: 공부자료 원본(추출 텍스트)
                        · 추출 완료 자료 "학습하기" →      · 오른쪽: AI 결과 탭(기본=요약)
```

- **1단계 메인**: 과목 목록과 "새 과목 만들기"만 보이는 단순한 선택 화면 (AI 결과를 바로 띄우지 않음)
- **2단계 자료 화면**: 파일 관리 중심. 파일별 추출 상태(업로드됨·추출 중·추출 완료·추출 실패)를 표시하고, **추출이 끝난 자료만** 학습 화면으로 넘어갈 수 있음
- **3단계 학습 화면**: 왼쪽 원본 자료 / 오른쪽 AI 학습 결과. 진입 시 **항상 "요약" 탭**이 기본 선택이며, 요약이 없으면 "요약 생성하기" CTA가 가장 크게 보임

---

## ✨ 현재 지원 기능

- **사이드바**: 서비스명 · 과목 목록 · 새 과목 만들기 (모든 화면 공통, 모바일은 드로어)
- **과목 관리**: 생성 / 선택 / 삭제, 시험일 D-day
- **자료 업로드(2단계)**:
  - PDF · PPTX · PPT 업로드 (버튼 + 드래그 앤 드롭, 다중 업로드)
  - 파일 카드: 파일명 / 형식 / 크기 / 업로드 시간 / 추출 상태 / 추출 텍스트 미리보기 / 삭제
  - 추출 완료 → "이 자료로 학습하기", 추출 전/실패 → 비활성화
  - "과목 전체로 학습하기"(추출 완료 자료 합침), 파일 없을 때 "직접 텍스트로 학습하기"
- **학습 화면(3단계)**:
  - **왼쪽** 공부자료 원본 — PDF 는 **pdf.js 로 원본을 그대로 렌더링**, PPTX/PPT 는 추출 텍스트를 슬라이드/단락 단위로 정리, 내부 스크롤
  - **오른쪽** AI 결과 — 탭 순서: **① 요약 ② 용어정리 ③ 문제 ④ 복습카드** (기본=요약)
  - **요약은 Markdown 학습노트** — 단순 개요가 아니라 강의자료의 단원·소제목·**페이지 번호(p.N)** 흐름을 따라 `#/##/###` 제목, 개념 비교 **표**, 암기 **체크리스트**, 시험 포인트 **blockquote** 로 정리 (PDF 는 페이지 단위 `[p.N]` 추출, 화면은 react-markdown 렌더링)
  - 생성 버튼 5종: 요약노트 · 용어정리 · 예상문제 · 플래시카드 · **전체 생성** (생성 중/완료/실패 표시, 연타 방지)
  - 문제 정답/해설은 기본 숨김 → **"정답 보기"** 클릭 시 표시
  - 플래시카드 클릭 시 앞/뒤 뒤집기 + 이전/다음 + 카드 목록
- **자동 저장**: 과목·추출 텍스트·AI 결과가 브라우저 **localStorage** 에 저장되어 새로고침 후에도 유지
  - 추출 텍스트/메타데이터는 **localStorage**, 업로드한 **원본 파일은 IndexedDB** 에 보관 → 학습 화면 왼쪽에서 **원본 PDF 를 pdf.js 로 렌더링**, 새로고침 후에도 유지 (PPTX/PPT 는 추출 텍스트로 표시)
- **학교 제공 AI API 호환**: OpenAI 공식 키뿐 아니라 OpenAI 호환 학교 게이트웨이(Base URL/모델 지정) 사용 가능

### 분석 기준 텍스트 결정 규칙
1. **파일이 선택**되어 있고 추출 텍스트가 있으면 → 그 파일
2. 추출 완료 파일이 있으면 → **과목 전체 파일** 텍스트 합침
3. 파일이 없으면 → **직접 입력한 텍스트**
4. 텍스트가 너무 짧으면(20자 미만) 생성 버튼 비활성화 + "분석할 텍스트가 부족합니다." 안내

### AI 생성 원칙
- 입력/업로드 자료의 추출 텍스트만 우선 근거로 사용, 자료에 없는 내용은 지어내지 않음
- 시험 대비 관점 · 한국어 · JSON 결과
- **JSON 파싱 실패 시에도 원문을 fallback 으로 보존**하여 화면이 깨지지 않음

---

## 🚀 실행 방법

```powershell
npm install        # 패키지 설치
npm run dev        # 개발 서버 → http://localhost:3000
```

프로덕션:

```powershell
npm run build
npm run start
```

> `.env.local` 을 만든 뒤 실행하세요. (키 없이 실행하면 생성 시 안내 메시지가 표시됩니다)

---

## 🔑 .env.local 설정 방법

프로젝트 루트에 `.env.local` 파일을 만들고 키를 넣습니다. (`.env.local.example` 참고)

### 1) 학교에서 제공한 AI API Key 사용 (예: factchat 게이트웨이)

```env
OPENAI_API_KEY=학교에서_받은_API키
OPENAI_BASE_URL=https://factchat-cloud.mindlogic.ai/v1/gateway
OPENAI_MODEL=gpt-5.5
```

- `OPENAI_API_KEY` **(필수)**
- `OPENAI_BASE_URL` (선택): 값이 있으면 그 서버로 요청, 없으면 공식 OpenAI API 사용
- `OPENAI_MODEL` (선택): 값이 있으면 **그 값을 우선 사용**, 없을 때만 기본값 `gpt-5.5` 사용

### 2) OpenAI 공식 키만 사용

```env
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxx
```

> 학교 API가 OpenAI 호환이라면 `OPENAI_BASE_URL` 과 `OPENAI_MODEL` 을 정확히 맞춰야 합니다.
> **401(인증) 또는 모델 관련 오류**가 나면 화면에 `OPENAI_API_KEY`, `OPENAI_BASE_URL`, `OPENAI_MODEL`(현재 모델명 포함) 값을 확인하라는 안내가 함께 표시됩니다.

---

## 🏫 학교 게이트웨이 API 사용 시 확인 항목

학교에서 받은 키가 `sk-` 로 시작하지 않거나 게이트웨이를 거친다면, 아래를 확인하세요.
**`OPENAI_BASE_URL` 을 설정하지 않으면 공식 OpenAI 로 요청이 가서 `401 Incorrect API key` 가 납니다.**

| 확인 항목 | 설명 |
|-----------|------|
| **Gateway / Base URL** | 게이트웨이 주소를 `OPENAI_BASE_URL` 에 정확히 입력 (예: `https://.../v1/gateway`). 끝에 `/chat/completions` 는 붙이지 말 것 — 코드가 자동으로 붙임 |
| **API Key** | 게이트웨이 전용 키 (공식 OpenAI 키와 다름) |
| **Model Name** | 게이트웨이가 지원하는 모델명을 `OPENAI_MODEL` 에 정확히 입력 |
| **인증 헤더 방식** | 기본은 `Authorization: Bearer <key>`. 게이트웨이가 `x-api-key` 를 쓰면 `lib/openai.ts` 의 `chatViaFetch` 헤더를 교체 |
| **요청 경로** | 최종 요청은 `BASE_URL` + `/chat/completions`. 게이트웨이 규격이 다르면 경로 확인 |
| **OpenAI SDK 호환 여부** | 호환되면 기본(`sdk`)으로 동작. 비호환이면 `.env.local` 에 `OPENAI_TRANSPORT=fetch` 를 넣어 fetch 방식으로 전환 |

- 인증 실패(401) 시 화면에는 **"AI API 인증에 실패했습니다. 학교 게이트웨이 주소, API Key, 모델명, 호출 방식을 확인해 주세요."** 가 표시됩니다.
- 서버 콘솔에는 디버깅용으로 **transport / baseURL 설정 여부 / model / API Key 앞 4글자**만 출력됩니다. (키 원문은 절대 로그에 남기지 않음)

---

## 🔒 API Key 주의사항

- **`.env.local` 은 절대 GitHub 에 올리지 마세요.** (`.gitignore` 에 포함되어 있음)
- **`NEXT_PUBLIC_` 접두사를 API Key 에 절대 사용하지 마세요.** (그 접두사는 브라우저에 노출됨)
- API Key 는 **서버에서만** 사용됩니다 → `app/api/generate/route.ts` → `lib/openai.ts`. 클라이언트 번들에 포함되지 않습니다.
- **`.env.local` 을 수정하면 개발 서버를 반드시 재시작**하세요. (Ctrl+C 후 `npm run dev`)
- 키가 노출되었다면 즉시 폐기하고 새로 발급하세요.

---

## 📁 파일 업로드 기능

| 형식 | 지원 | 비고 |
|------|------|------|
| **PDF** | ✅ | 서버에서 `unpdf`(pdf.js 기반)로 텍스트 추출. **스캔 이미지형 PDF**는 텍스트가 없어 추출이 안 될 수 있음(추출 시 안내 표시) |
| **PPTX** | ✅ | `JSZip` 으로 슬라이드 XML 을 풀어 **슬라이드 번호 기준**으로 텍스트 추출 |
| **PPT** | ⚠️ 제한적 | 구형 바이너리 형식이라 추출 실패 가능 → "PPTX로 변환 후 다시 업로드해 주세요" 안내 |

- 업로드 최대 크기: 20MB
- 추출은 `app/api/extract/route.ts`(서버, `runtime=nodejs`)에서 처리하며, 실패해도 서버가 죽지 않도록 try/catch 로 방어합니다.

---

## 📂 폴더 구조

```
src/
├─ app/
│  ├─ layout.tsx                     # SubjectsProvider + AppShell(사이드바)
│  ├─ page.tsx                       # [1] 메인 대시보드 (과목 선택)
│  ├─ subjects/[id]/page.tsx         # [2] 자료 화면 (업로드/추출)
│  ├─ subjects/[id]/study/page.tsx   # [3] 학습 화면 (좌우 분할)
│  └─ api/
│     ├─ extract/route.ts            # 파일 → 텍스트 추출 (PDF/PPTX/PPT)
│     └─ generate/route.ts           # AI 생성 (mode 분기, openaiModel 사용)
├─ components/
│  ├─ AppShell.tsx · Sidebar.tsx · Dashboard.tsx · SubjectCard.tsx
│  ├─ NewSubjectModal.tsx · GeneratePanel.tsx · ResultTabs.tsx
│  ├─ OriginalViewer.tsx             # 학습 화면 왼쪽: PDF 원본 미리보기 / 추출 텍스트
│  ├─ files/
│  │  ├─ Uploader.tsx                # 드래그앤드롭/클릭 업로드
│  │  └─ FileCard.tsx                # 파일 카드(상태/미리보기/액션/삭제)
│  └─ results/                       # Summary/Terms/Questions/Flashcard 뷰
├─ context/SubjectsContext.tsx       # 과목/파일 상태 전역 공유
├─ hooks/
│  ├─ useGenerate.ts                 # AI 생성 로직 + 상태/에러
│  └─ useFileUpload.ts               # 업로드 + 추출 오케스트레이션
├─ lib/
│  ├─ openai.ts                      # AI 호출 (서버 전용, baseURL/model/transport)
│  ├─ prompts.ts                     # ★ 모든 프롬프트 정의/조립 (아래 문서 참고)
│  ├─ extract.ts                     # 서버 텍스트 추출 (unpdf/JSZip)
│  ├─ files.ts                       # 클라 파일 헬퍼 (업로드/추출 호출/소스 결정)
│  ├─ fileBlobs.ts                   # 원본 파일 IndexedDB 저장/조회 (PDF 미리보기)
│  ├─ storage.ts                     # localStorage 영속화 (⚠️ Supabase 교체 지점)
│  ├─ generators.ts · format.ts · errors.ts
└─ types/study.ts                    # Subject/StudyFile/AIOutput/결과 타입
```

---

## 🧩 AI 프롬프트 구조

**모든 프롬프트는 [`src/lib/prompts.ts`](src/lib/prompts.ts) 한 파일에서만 정의·조립합니다.**
API 라우트나 다른 파일에 프롬프트를 직접 작성하지 않습니다.

| 항목 | 위치 |
|------|------|
| **요약노트** 프롬프트 | `lib/prompts.ts` → `buildSummaryPrompt()` |
| **용어정리** 프롬프트 | `lib/prompts.ts` → `buildTermsPrompt()` |
| **예상문제** 프롬프트 | `lib/prompts.ts` → `buildQuestionsPrompt()` |
| **복습카드** 프롬프트 | `lib/prompts.ts` → `buildFlashcardsPrompt()` |
| **system message** | `lib/prompts.ts` → `buildSystemPrompt()` |
| **system + user 조립** | `lib/openai.ts` 의 `callModel()` 이 `buildSystemPrompt()` + `buildUserPrompt(kind, …)` 를 합쳐 모델에 전달 |
| **mode 분기** | `app/api/generate/route.ts` 가 `mode`(=`kind`)별로 `lib/openai.ts` 생성기를 호출 → 생성기가 위 프롬프트 빌더 사용 |
| **route 내 직접 작성?** | ❌ 없음 (라우트는 검증 + 분기만, 프롬프트는 전부 `lib/prompts.ts`) |

**호출 경로**: `route.ts` (mode 분기) → `lib/openai.ts` (system+user 조립 / AI 호출) → `lib/prompts.ts` (프롬프트 본문)

**프롬프트 원칙** (`buildSystemPrompt()` 에 명시):
업로드/입력 자료를 최우선 근거로 사용 · 자료에 없는 내용은 지어내지 않음 · 확인되지 않는 항목은 **"자료에서 확인되지 않음"** 으로 표시 · 시험 대비 관점 · 한국어 · JSON 응답 · (파싱 실패 시 `lib/openai.ts` 가 원문 fallback 처리해 화면이 깨지지 않음)

---

## 🧭 향후 추가할 기능

1. **Supabase 구글 로그인** — `Subject.ownerId` 채우고 RLS 적용
2. **Supabase DB 저장** — `lib/storage.ts` 를 Supabase 구현으로 교체 (UI 무변경)
3. **Supabase Storage 원본 파일 저장** — `StudyFile` 에 원본 파일 참조 추가
4. **친구 공유 링크** — `Subject.sharedWith` + 공유 토큰 라우트
5. **OCR 기반 스캔 PDF 분석** — 이미지형 PDF에서 텍스트 추출

---

## 🛠 기술 스택

Next.js 14 (App Router) · React 18 · TypeScript · Tailwind CSS · OpenAI(호환) API · unpdf · JSZip
