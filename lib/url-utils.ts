import crypto from 'crypto'

/**
 * Normalize URL for consistent deduplication
 * Applies deterministic transformations before hashing
 */
export function normalizeUrl(url: string): string {
  try {
    const urlObj = new URL(url)
    
    // a) lowercase hostname
    urlObj.hostname = urlObj.hostname.toLowerCase()
    
    // b) remove trailing slashes (preserve root slash)
    urlObj.pathname = urlObj.pathname.replace(/\/+$/, '') || '/'
    
    // c) strip common tracking parameters
    const trackingParams = [
      'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content',
      'fbclid', 'gclid', 'ref', 'source', 'campaign', 'medium',
      '_ga', '_gid', 'mc_cid', 'mc_eid', // Google Analytics & MailChimp
      'msclkid', 'yclid', // Microsoft & Yahoo
    ]
    
    trackingParams.forEach(param => {
      urlObj.searchParams.delete(param)
    })
    
    // d) sort query parameters consistently
    urlObj.searchParams.sort()
    
    // e) keep path case as-is (safer for case-sensitive servers)
    
    return urlObj.toString()
  } catch (error) {
    // If URL parsing fails, return original (will likely fail validation later)
    return url
  }
}

/**
 * Generate URL hash for deduplication
 * Uses SHA-256 of normalized URL
 */
export function generateUrlHash(url: string): string {
  const normalizedUrl = normalizeUrl(url)
  return crypto.createHash('sha256').update(normalizedUrl).digest('hex')
}

/**
 * Validate URL format
 */
export function isValidUrl(url: string): boolean {
  try {
    const urlObj = new URL(url)
    return ['http:', 'https:'].includes(urlObj.protocol)
  } catch {
    return false
  }
}

/**
 * Extract domain from URL for display
 */
export function extractDomain(url: string): string {
  try {
    const urlObj = new URL(url)
    return urlObj.hostname
  } catch {
    return 'Unknown'
  }
}