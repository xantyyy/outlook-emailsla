const { fetchBugReportsFromOutlook } = require('./graphService');
const { parseEmailToBug }            = require('../utils/emailParser'); // ✅ Single source of truth for parsing
const Bug = require('../models/bug');

class EmailMonitor {
  constructor(notificationService) {
    this.notificationService = notificationService;
    this.isMonitoring = false;
  }

  async checkForNewEmails() {
    try {
      const emails = await fetchBugReportsFromOutlook();
      if (!emails || emails.length === 0) return 0;

      let newBugsCount = 0;
      for (const email of emails) {
        const existingBug = await Bug.findOne({ emailId: email.id });
        if (existingBug) continue;

        // ✅ Use shared emailParser — severity/priority read from subject, not body text
        const bugData = parseEmailToBug(email);
        const bug = new Bug(bugData);
        await bug.save();
        
        newBugsCount++;
        
        if (this.notificationService) {
          this.notificationService.notifyNewBugFromOutlook(bug);
          console.log(`🚀 Real-time notification broadcasted for: ${bug.title}`);
        }
      }
      return newBugsCount;
    } catch (error) {
      console.error('❌ Error checking emails:', error.message);
      return 0;
    }
  }

  async parseEmailAndCreateBug(email) {
    try {
      // ✅ Use shared emailParser — same logic as manual sync
      const bugData = parseEmailToBug(email);
      const bug = new Bug(bugData);
      await bug.save();
      console.log(`✅ Bug created from email: ${bug.title}`);
      return bug;
    } catch (error) {
      console.error('Error creating bug from email:', error);
      return null;
    }
  }

  startMonitoring(intervalMinutes = 1) {
    if (this.isMonitoring) {
      console.log('⚠️ Email monitoring already running');
      return;
    }

    console.log(`📧 Starting email monitoring (every ${intervalMinutes} minute(s))`);
    this.isMonitoring = true;

    // Check immediately
    this.checkForNewEmails();

    // Then check at intervals
    this.monitoringInterval = setInterval(() => {
      this.checkForNewEmails();
    }, intervalMinutes * 60 * 1000);
  }

  stopMonitoring() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.isMonitoring = false;
      console.log('📧 Email monitoring stopped');
    }
  }

  getAuthenticatedClient() {
    // Your existing Microsoft Graph authentication logic
    // Return authenticated client
  }
}

module.exports = EmailMonitor;