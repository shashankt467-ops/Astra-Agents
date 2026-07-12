export const SCAM_KEYWORDS = [
  'lottery',
  'prize',
  'claim',
  'otp',
  'click here',
  'bank',
  'kyc',
  'verify',
  'congratulations',
  'gift',
  'award',
  'winner',
  'urgent',
  'account blocked',
  'suspended'
];

export const SUSPICIOUS_TLDS = [
  '.xyz',
  '.top',
  '.club',
  '.info',
  '.loan',
  '.click',
  '.biz',
  '.download',
  '.work',
  '.support',
  '.online',
  '.tech'
];

export const URL_SHORTENERS = [
  'bit.ly',
  'tinyurl.com',
  't.co',
  'ow.ly',
  'rebrand.ly',
  'is.gd',
  'buff.ly',
  'adf.ly'
];

export const SUSPICIOUS_URL_KEYWORDS = [
  'login',
  'secure',
  'bank',
  'verify',
  'update',
  'claim',
  'prize',
  'free',
  'signin',
  'account',
  'support',
  'wallet',
  'refund'
];

export const RISK_WEIGHTS = {
  KEYWORD_MATCH: 15,
  IP_URL: 50,
  INSECURE_PROTOCOL: 15,
  SHORTENED_URL: 30,
  SUSPICIOUS_TLD: 25,
  SUSPICIOUS_URL_KEYWORD: 15,
  MULTIPLE_SUBDOMAINS: 20,
  LONG_URL: 10
};
