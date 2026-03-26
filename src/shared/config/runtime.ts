const mswFlag = (import.meta.env.PUBLIC_ENABLE_MSW ?? "").trim().toLowerCase();

// 기본값은 실제 API 호출이다. 데모/목업이 필요할 때만 명시적으로 켠다.
export const isMswEnabled = mswFlag === "true";
