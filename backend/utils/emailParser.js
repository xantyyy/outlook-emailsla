/**
 * Parse Outlook email to Bug model format
 * Email subject format: [BUG REPORT] [SEVERITY] - Title
 * Example: [BUG REPORT] [HIGH] – Promo Code Can Be Applied to All Packages Without Restriction
 * 
 * ✅ UPDATED: Now uses uniqueBody to get ONLY the first email content, not the entire thread
 */

function parseEmailToBug(email) {
  const subject = email.subject;
  
  // ✅ PRIORITY: Use uniqueBody first (original email only), fallback to body or bodyPreview
  let body = '';
  if (email.uniqueBody?.content) {
    body = email.uniqueBody.content;
    console.log('📧 Using uniqueBody (first email only)');
  } else if (email.body?.content) {
    body = email.body.content;
    console.log('⚠️ uniqueBody not available, using full body (may include thread)');
  } else if (email.bodyPreview) {
    body = email.bodyPreview;
    console.log('⚠️ Using bodyPreview as fallback');
  }
  
  // Extract severity from subject
  let severity = 'Medium';
  if (subject.includes('[CRITICAL]')) severity = 'Critical';
  else if (subject.includes('[HIGH]')) severity = 'High';
  else if (subject.includes('[MEDIUM]')) severity = 'Medium';
  else if (subject.includes('[LOW]')) severity = 'Low';
  
  // Extract title (remove [BUG REPORT] and [SEVERITY] tags)
  let title = subject
    .replace(/\[BUG REPORT\]/gi, '')
    .replace(/\[CRITICAL\]/gi, '')
    .replace(/\[HIGH\]/gi, '')
    .replace(/\[MEDIUM\]/gi, '')
    .replace(/\[LOW\]/gi, '')
    .replace(/—/g, '-') // Replace em dash with regular dash
    .replace(/–/g, '-') // Replace en dash
    .trim();
  
  // Remove leading dash if exists
  if (title.startsWith('-')) {
    title = title.substring(1).trim();
  }
  
  // Clean HTML from body
  const description = cleanHtmlFromBody(body);
  
  // Map severity to priority
  const priorityMap = {
    'Critical': 'Urgent',
    'High': 'High',
    'Medium': 'Normal',
    'Low': 'Low'
  };
  
  return {
    emailId: email.id, // Store email ID for tracking
    title: title,
    description: description,
    severity: severity,
    priority: priorityMap[severity] || 'Normal',
    status: 'Open',
    category: extractCategory(body),
    reportedBy: {
      name: email.from?.emailAddress?.name || 'Unknown',
      email: email.from?.emailAddress?.address || '',
      role: 'User'
    },
    stepsToReproduce: extractSection(body, 'Steps to Reproduce'),
    expectedBehavior: extractSection(body, 'Expected Behavior'),
    actualBehavior: extractSection(body, 'Actual Behavior'),
    environment: extractEnvironment(body),
    tags: extractTags(subject, body),
    receivedDateTime: email.receivedDateTime
  };
}

function cleanHtmlFromBody(htmlContent) {
  if (!htmlContent) return '';
  
  // Remove HTML tags
  let text = htmlContent.replace(/<[^>]*>/g, ' ');
  
  // Replace HTML entities
  text = text
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
  
  // ✅ Remove common email reply indicators
  text = text
    .replace(/On .+ wrote:/gi, '')  // Remove "On [date] [person] wrote:"
    .replace(/From:.+?Sent:.+?To:.+?Subject:.+/gi, '')  // Remove email headers
    .replace(/_{2,}/g, '')  // Remove multiple underscores
    .replace(/-{2,} Original Message -{2,}/gi, '')  // Remove "-- Original Message --"
    .replace(/>{1,}.*/g, '')  // Remove quoted lines starting with >
  
  // Clean up multiple spaces and newlines
  text = text
    .replace(/\s+/g, ' ')
    .trim();
  
  return text;
}

function extractSection(body, sectionName) {
  const regex = new RegExp(`${sectionName}:?\\s*(.+?)(?=\\n\\n|$)`, 'is');
  const match = body.match(regex);
  return match ? match[1].trim() : '';
}

function extractCategory(body) {
  const categories = ['Frontend', 'Backend', 'Database', 'API', 'UI/UX', 'Performance', 'Security'];
  const bodyLower = body.toLowerCase();
  
  for (const category of categories) {
    if (bodyLower.includes(category.toLowerCase())) {
      return category;
    }
  }
  
  return 'Other';
}

function extractEnvironment(body) {
  return {
    browser: extractField(body, 'Browser'),
    os: extractField(body, 'OS|Operating System'),
    deviceType: extractField(body, 'Device'),
    screenResolution: extractField(body, 'Resolution|Screen')
  };
}

function extractField(body, fieldPattern) {
  const regex = new RegExp(`(?:${fieldPattern}):?\\s*([^\\n]+)`, 'i');
  const match = body.match(regex);
  return match ? match[1].trim() : '';
}

function extractTags(subject, body) {
  const tags = [];
  
  // Add severity as tag
  if (subject.includes('[CRITICAL]')) tags.push('critical');
  if (subject.includes('[HIGH]')) tags.push('high-priority');
  
  // Extract common keywords
  const keywords = ['crash', 'error', 'bug', 'issue', 'problem', 'urgent'];
  const text = (subject + ' ' + body).toLowerCase();
  
  keywords.forEach(keyword => {
    if (text.includes(keyword) && !tags.includes(keyword)) {
      tags.push(keyword);
    }
  });
  
  return tags;
}

module.exports = {
  parseEmailToBug,
  cleanHtmlFromBody
};