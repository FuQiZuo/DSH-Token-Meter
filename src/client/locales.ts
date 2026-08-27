/** Locale dictionaries for the Token Meter surface. */

export type TokenMeterLocaleKey = 'title' | 'current' | 'inRow' | 'outRow' | 'total'
  | 'hit' | 'miss' | 'all' | 'allIn' | 'allOut' | 'allHit' | 'allMiss'
  | 'live' | 'dc' | 'settingsTitle' | 'mode' | 'lang'
  | 'transparent' | 'textSize' | 'zh' | 'en' | 'small' | 'medium' | 'large' | 'noData'
  | 'disclaimerTitle' | 'disclaimer'

export const NS = 'token-meter'

export const zh: Record<TokenMeterLocaleKey, string> = {
  title: 'Token 计量表',
  current: '当前会话',
  inRow: '输入 token',
  outRow: '输出 token',
  hit: '命中缓存',
  miss: '未命中缓存',
  total: '当前会话总 token',
  all: '全部会话',
  allIn: '累计输入 token',
  allOut: '累计输出 token',
  allHit: '累计命中缓存',
  allMiss: '累计未命中缓存',
  live: '实时模式',
  dc: '延迟模式',
  settingsTitle: 'Token 计量表设置',
  mode: '统计模式',
  lang: '语言',
  transparent: '面板透明',
  textSize: '文本大小',
  zh: '中文',
  en: 'English',
  small: '小',
  medium: '中',
  large: '大',
  noData: '—',
  disclaimerTitle: '免责声明',
  disclaimer: '说明：实时显示的 token 基于本地分词器实时统计运算，会出现误差（尤其是包含思考链路的输入 token），在请求结束后返回用量时会进行自动校准。本地分词器计算的 token 用量仅供参考。',
}

export const en: Record<TokenMeterLocaleKey, string> = {
  title: 'Token Meter',
  current: 'Current session',
  inRow: 'Input tokens',
  outRow: 'Output tokens',
  hit: 'Cache hit',
  miss: 'Cache miss',
  total: 'Session total tokens',
  all: 'All sessions',
  allIn: 'Cumulative input tokens',
  allOut: 'Cumulative output tokens',
  allHit: 'Cumulative cache hit',
  allMiss: 'Cumulative cache miss',
  live: 'Live mode',
  dc: 'Deferred mode',
  settingsTitle: 'Token Meter settings',
  mode: 'Statistics mode',
  lang: 'Language',
  transparent: 'Panel transparency',
  textSize: 'Text size',
  zh: '中文',
  en: 'English',
  small: 'Small',
  medium: 'Medium',
  large: 'Large',
  noData: '—',
  disclaimerTitle: 'Disclaimer',
  disclaimer: 'Note: the tokens shown in real time are computed by the local tokeniser and will deviate from the real usage, especially for input tokens that include the reasoning chain. Usage is auto-calibrated once the request finishes. The local-tokeniser numbers are for reference only.',
}
