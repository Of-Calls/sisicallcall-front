import type {
  BackendSummary,
  CallStatus,
  ResponsePath,
  TranscriptSpeaker,
} from "@/features/calls/callsTypes"

export function formatDuration(seconds: number | null | undefined) {
  if (typeof seconds !== "number" || !Number.isFinite(seconds)) {
    return "집계 중"
  }

  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60

  if (minutes === 0) {
    return `${remainingSeconds}초`
  }

  return `${minutes}분 ${remainingSeconds}초`
}

export function formatDateTime(value: string | null | undefined) {
  if (!value) {
    return "시간 정보 없음"
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }

  return date.toLocaleString("ko-KR")
}

export function formatDateTimeShort(value: string | null | undefined) {
  if (!value) {
    return "시간 정보 없음"
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }

  const yyyy = date.getFullYear()
  const mm = String(date.getMonth() + 1).padStart(2, "0")
  const dd = String(date.getDate()).padStart(2, "0")
  const hh = String(date.getHours()).padStart(2, "0")
  const mi = String(date.getMinutes()).padStart(2, "0")
  return `${yyyy}.${mm}.${dd} ${hh}:${mi}`
}

export function formatCaller(value: string | null | undefined) {
  if (!value) {
    return "번호 없음"
  }
  const digits = value.replace(/\D/g, "")
  if (digits.length === 11 && digits.startsWith("010")) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`
  }
  if (digits.length === 10 && digits.startsWith("02")) {
    return `${digits.slice(0, 2)}-${digits.slice(2, 6)}-${digits.slice(6)}`
  }
  return value
}

export function getCallStatusLabel(status: CallStatus | string | undefined) {
  switch (status) {
    case "in_progress":
      return "진행 중"
    case "completed":
      return "완료"
    case "abandoned":
      return "이탈"
    case "error":
      return "오류"
    default:
      return "상태 확인 중"
  }
}

export function getCallStatusClassName(status: CallStatus | string | undefined) {
  switch (status) {
    case "completed":
      return "bg-emerald-100 text-emerald-700 border-emerald-200"
    case "in_progress":
      return "bg-blue-100 text-blue-700 border-blue-200"
    case "abandoned":
      return "bg-amber-100 text-amber-700 border-amber-200"
    case "error":
      return "bg-red-100 text-red-700 border-red-200"
    default:
      return "bg-slate-100 text-slate-700 border-slate-200"
  }
}

export function getResponsePathLabel(
  responsePath: ResponsePath | null | undefined,
) {
  switch (responsePath) {
    case "cache":
      return "캐시"
    case "faq":
      return "FAQ"
    case "task":
      return "업무 처리"
    case "auth":
      return "인증"
    case "escalation":
      return "상담원 연결"
    default:
      return "일반 응답"
  }
}

export function getSpeakerLabel(
  speaker: TranscriptSpeaker | string | undefined,
) {
  return speaker === "customer" ? "고객" : "AI 에이전트"
}

export function getEmotionLabel(
  emotion: BackendSummary["summary"]["customer_emotion"],
) {
  switch (emotion) {
    case "positive":
      return "긍정"
    case "neutral":
      return "중립"
    case "negative":
      return "부정"
    case "angry":
      return "분노"
    default:
      return "정보 없음"
  }
}

export function getResolutionStatusLabel(
  status: BackendSummary["summary"]["resolution_status"],
) {
  switch (status) {
    case "resolved":
      return "해결"
    case "escalated":
      return "상담원 연결"
    case "abandoned":
      return "이탈"
    default:
      return "정보 없음"
  }
}
