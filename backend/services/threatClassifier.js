import {
  SCAM_KEYWORDS,
  SUSPICIOUS_TLDS,
  URL_SHORTENERS,
  SUSPICIOUS_URL_KEYWORDS,
  RISK_WEIGHTS
} from '../config/constants.js';

/**
 * Classifies the risk level based on the numerical score.
 * @param {number} score - Risk score between 0 and 100.
 * @returns {string} - Classification category.
 */
export const getClassification = (score) => {
  if (score >= 85) return 'Critical';
  if (score >= 70) return 'High';
  if (score >= 40) return 'Medium';
  return 'Low';
};

/**
 * Analyzes text for scam signatures and returns a risk assessment.
 * @param {string} text - Input text content.
 * @returns {object} - Analysis results.
 */
export const classifyText = (text = '') => {
  const cleanText = text.toLowerCase();
  const matchedKeywords = [];
  let score = 0;

  SCAM_KEYWORDS.forEach((keyword) => {
    if (cleanText.includes(keyword)) {
      matchedKeywords.push(keyword);
      score += RISK_WEIGHTS.KEYWORD_MATCH;
    }
  });

  // Cap score at 100
  score = Math.min(score, 100);
  const classification = getClassification(score);

  let recommendation = 'No immediate action required. The text appears standard, but remain cautious about sharing sensitive data.';
  if (classification === 'Critical') {
    recommendation = 'DO NOT respond, click any link, or share any personal credentials/OTP. Immediately block the sender and report to national cyber crime authorities.';
  } else if (classification === 'High') {
    recommendation = 'Treat this message as extremely suspicious. It exhibits signatures of financial or identity theft scams. Verify the claims through official channels only.';
  } else if (classification === 'Medium') {
    recommendation = 'Exercise caution. The message contains pressure tactics or keywords common in lottery and banking scams. Avoid sharing any details.';
  }

  return {
    riskScore: score,
    classification,
    matchedKeywords,
    evidence: matchedKeywords.length > 0 
      ? `Found ${matchedKeywords.length} flagged scam keywords: [${matchedKeywords.join(', ')}].`
      : 'No scam keywords detected in the text.',
    recommendation
  };
};

/**
 * Analyzes a URL for security threats, phishing patterns, and reputation.
 * @param {string} urlString - Target URL.
 * @returns {object} - Analysis results.
 */
export const classifyUrl = (urlString = '') => {
  let score = 0;
  const reasons = [];
  let isShortened = false;
  let isSuspiciousTld = false;
  let isInsecure = false;

  try {
    // Ensure protocol exists for URL parsing
    let formattedUrl = urlString.trim();
    if (!/^https?:\/\//i.test(formattedUrl)) {
      formattedUrl = 'http://' + formattedUrl;
    }

    const parsed = new URL(formattedUrl);
    const hostname = parsed.hostname.toLowerCase();
    const pathname = parsed.pathname.toLowerCase();

    // 1. Check protocol
    if (parsed.protocol === 'http:') {
      score += RISK_WEIGHTS.INSECURE_PROTOCOL;
      reasons.push('Insecure connection protocol (HTTP instead of HTTPS)');
      isInsecure = true;
    }

    // 2. Check if host is an IP address
    const ipPattern = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/;
    if (ipPattern.test(hostname)) {
      score += RISK_WEIGHTS.IP_URL;
      reasons.push('Host uses a raw IP address instead of a domain name');
    }

    // 3. Check for url shorteners
    const shortenedMatch = URL_SHORTENERS.find(short => hostname === short || hostname.endsWith('.' + short));
    if (shortenedMatch) {
      score += RISK_WEIGHTS.SHORTENED_URL;
      reasons.push(`URL uses a known link shortener service (${shortenedMatch})`);
      isShortened = true;
    }

    // 4. Check for suspicious TLDs
    const tldMatch = SUSPICIOUS_TLDS.find(tld => hostname.endsWith(tld));
    if (tldMatch) {
      score += RISK_WEIGHTS.SUSPICIOUS_TLD;
      reasons.push(`Domain uses a high-risk scam/spam Top-Level Domain (${tldMatch})`);
      isSuspiciousTld = true;
    }

    // 5. Check for multiple subdomains
    const subdomainsCount = hostname.split('.').length - 2; // exclude domain and TLD
    if (subdomainsCount >= 2) {
      score += RISK_WEIGHTS.MULTIPLE_SUBDOMAINS;
      reasons.push(`Excessive number of subdomains (${subdomainsCount}) designed to impersonate brands`);
    }

    // 6. Check for long URL
    if (urlString.length > 75) {
      score += RISK_WEIGHTS.LONG_URL;
      reasons.push(`Excessive URL length (${urlString.length} characters) commonly used to hide subdomains`);
    }

    // 7. Check for suspicious keywords in host or path
    const matchedKeywords = [];
    SUSPICIOUS_URL_KEYWORDS.forEach(keyword => {
      if (hostname.includes(keyword) || pathname.includes(keyword)) {
        matchedKeywords.push(keyword);
      }
    });

    if (matchedKeywords.length > 0) {
      score += RISK_WEIGHTS.SUSPICIOUS_URL_KEYWORD * matchedKeywords.length;
      reasons.push(`Found scam keywords in the URL pathway: [${matchedKeywords.join(', ')}]`);
    }

    // Cap score at 100
    score = Math.min(score, 100);
    const classification = getClassification(score);

    let recommendation = 'The URL looks relatively safe, but ensure the domain name matches the expected destination before submitting any forms.';
    if (classification === 'Critical' || classification === 'High') {
      recommendation = 'DO NOT open this link or input credentials on this website. The domain exhibits clear signatures of phishing portals or malicious redirect chains.';
    } else if (classification === 'Medium') {
      recommendation = 'Open with extreme caution. Check the SSL certificate and look for brand misspellings in the URL bar.';
    }

    return {
      riskScore: score,
      classification,
      reasons,
      isSuspiciousTld,
      isShortened,
      isInsecure,
      recommendation
    };
  } catch (error) {
    // If URL is invalid, treat as suspicious
    return {
      riskScore: 60,
      classification: 'Medium',
      reasons: ['Malformed or invalid URL path: ' + urlString],
      isSuspiciousTld: false,
      isShortened: false,
      isInsecure: true,
      recommendation: 'Do not click this URL as it is malformed and could trigger dangerous redirect scripts.'
    };
  }
};
