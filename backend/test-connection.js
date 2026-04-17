require('dotenv').config();
const { fetchBugReportsFromOutlook } = require('./services/graphService');

async function testSync() {
  console.log('='.repeat(60));
  console.log('🧪 Testing Bug Report Email Sync');
  console.log('='.repeat(60));
  
  try {
    const emails = await fetchBugReportsFromOutlook();
    
    console.log('\n✅ SUCCESS!');
    console.log(`Found ${emails.length} bug report emails\n`);
    
    if (emails.length > 0) {
      console.log('Bug Reports:');
      console.log('='.repeat(60));
      emails.forEach((email, index) => {
        console.log(`\n${index + 1}. ${email.subject}`);
        console.log(`   From: ${email.from.emailAddress.name} <${email.from.emailAddress.address}>`);
        console.log(`   Date: ${new Date(email.receivedDateTime).toLocaleString()}`);
        console.log(`   Preview: ${email.bodyPreview.substring(0, 100)}...`);
      });
    } else {
      console.log('\n⚠️  No bug report emails found.');
      console.log('Make sure you have sent an email with "[BUG REPORT]" in the subject to:');
      console.log('   ' + process.env.ADMIN_EMAIL);
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ Email sync is working! You can now test the full system.');
    console.log('='.repeat(60));
    
  } catch (error) {
    console.log('\n' + '='.repeat(60));
    console.error('❌ TEST FAILED!');
    console.log('='.repeat(60));
    console.error('\nError:', error.message);
    console.error('\nFull error:', error);
  }
}

testSync();