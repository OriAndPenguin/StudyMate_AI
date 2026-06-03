# 📚 StudyMate AI

공부자료(텍스트 입력 또는 **PDF/PPTX/PPT 업로드**)를 넣으면 AI가 **시험 대비 요약 · 용어정리 · 예상문제 · 복습카드**를 만들어주는 개인용 학습 웹앱.

> **현재 버전 = 텍스트 입력 + 파일 업로드 기반 MVP** 입니다.
> **PC / 노트북 중심**으로 설계되었습니다 — 과목 상세 화면은 **좌우 분할(왼쪽 공부자료 35% · 오른쪽 AI 결과 65%)** 학습 워크스페이스이며, 모바일에서는 상하 구조로 전환됩니다.

---

## ✨ 현재 지원 기능

- **데스크톱 대시보드**: 좌측 사이드바(서비스명 · 과목 목록 · 새 과목) + 우측 콘텐츠
- **대시보드 홈**: 전체 과목 / 요약노트 / 생성된 문제 / 플래시카드 수 + 최근 수정 과목
- **과목 관리**: 생성 / 선택 / 삭제, 시험일 D-day
- **공부자료 영역(왼쪽 패널)**:
  - PDF · PPTX · PPT 업로드 (버튼 + 드래그 앤 드롭, 다중 업로드)
  - 파일 카드: 파일명 / 형식 / 크기 / 업로드 시간 / 추출 상태(업로드됨·추출 중·추출 완료·추출 실패) / 추출 텍스트 미리보기 / 삭제
  - 파일 클릭 시 선택(강조), 파일 없을 때 빈 상태 안내
  - 파일 없이 쓰는 **직접 텍스트 입력** 폴백
- **AI 학습 결과 영역(오른쪽 패널)**:
  - 분석 기준 표시(선택 파일 / 과목 전체 / 직접 입력)
  - 생성 버튼 5종: 요약노트 · 용어정리 · 예상문제 · 플래시카드 · **전체 생성** (생성 중/완료/실패 상태 표시, 연타 방지)
  - 결과 가로 탭: 요약노트 · 용어정리 · 문제풀이 · 복습카드 (카드형 학습 노트)
  - 문제 정답/해설은 기본 숨김 → **"정답 보기"** 클릭 시 표시
  - 플래시카드 클릭 시 앞/뒤 뒤집기 + 이전/다음 + 카드 목록
- **자동 저장**: 과목·추출 텍스트·AI 결과가 브라우저 **localStorage** 에 저장되어 새로고침 후에도 유지
  - ⚠️ 업로드한 **원본 바이너리 파일은 저장하지 않습니다** (추출 텍스트 + 메타데이터만 보관)
- **학교 제공 AI API 호환**: OpenAI 공식 키뿐 아니라 OpenAI 호환 학교 API(Base URL/모델 지정) 사용 가능

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

### 1) 학교에서 제공한 AI API Key 사용

```env
OPENAI_API_KEY=학교에서_받은_API키
OPENAI_BASE_URL=학교에서_제공한_Base_URL_있는_경우만_입력
OPENAI_MODEL=학교에서_안내한_모델명
```

- `OPENAI_API_KEY` **(필수)**
- `OPENAI_BASE_URL` (선택): 값이 있으면 그 서버로 요청, 없으면 공식 OpenAI API 사용
- `OPENAI_MODEL` (선택): 값이 있으면 해당 모델, 없으면 기본값 `gpt-4o-mini`

### 2) OpenAI 공식 키만 사용

```env
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxx
```

> 학교 API가 OpenAI 호환이라면 `OPENAI_BASE_URL` 과 `OPENAI_MODEL` 을 정확히 맞춰야 합니다.
> 모델/주소가 잘못되면 오류 메시지에 "OPENAI_BASE_URL 또는 OPENAI_MODEL 설정을 확인하세요" 안내가 함께 표시됩니다.

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
│  ├─ layout.tsx                # SubjectsProvider + AppShell(사이드바)
│  ├─ page.tsx                  # 대시보드
│  ├─ subjects/[id]/page.tsx    # 과목 상세 (좌우 분할)
│  └─ api/
│     ├─ extract/route.ts       # 파일 → 텍스트 추출 (PDF/PPTX/PPT)
│     └─ generate/route.ts      # AI 생성 (kind/mode, JSON fallback)
├─ components/
│  ├─ AppShell.tsx · Sidebar.tsx · Dashboard.tsx · SubjectCard.tsx
│  ├─ NewSubjectModal.tsx · GeneratePanel.tsx · ResultTabs.tsx
│  ├─ files/
│  │  ├─ FileUploadPanel.tsx    # 왼쪽 패널: 업로드/드래그앤드롭/목록/직접입력
│  │  └─ FileCard.tsx           # 파일 카드(상태/미리보기/삭제)
│  └─ results/                  # Summary/Terms/Questions/Flashcard 뷰
├─ context/SubjectsContext.tsx  # 과목/파일 상태 전역 공유
├─ hooks/useGenerate.ts         # AI 생성 로직 + 상태/에러
├─ lib/
│  ├─ openai.ts                 # AI 호출 (서버 전용, baseURL/model 유연)
│  ├─ prompts.ts                # 프롬프트 + JSON 스키마
│  ├─ extract.ts                # 서버 텍스트 추출 (unpdf/JSZip)
│  ├─ files.ts                  # 클라 파일 헬퍼 (업로드/추출 호출/소스 결정)
│  ├─ storage.ts                # localStorage 영속화 (⚠️ Supabase 교체 지점)
│  ├─ generators.ts · format.ts · errors.ts
└─ types/study.ts               # Subject/StudyFile/AIOutput/결과 타입
```

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
