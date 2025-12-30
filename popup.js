document.getElementById('collect-btn').addEventListener('click', async () => {
  const button = document.getElementById('collect-btn');
  const resultsDiv = document.getElementById('results');
  const copyBtn = document.getElementById('copy-btn');
  const statusDiv = document.getElementById('status');
  
  button.disabled = true;
  button.textContent = 'Collecting...';
  resultsDiv.style.display = 'none';
  copyBtn.style.display = 'none';
  statusDiv.style.display = 'none';
  
  try {
    const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
    
    const results = await browser.tabs.executeScript(tab.id, {
      code: `
        (function() {
          const emailRegex = /\\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Z|a-z]{2,}\\b/g;
          const pageText = document.body.innerText;
          const emails = pageText.match(emailRegex) || [];
          
          // Also check for mailto links
          const mailtoLinks = Array.from(document.querySelectorAll('a[href^="mailto:"]'))
            .map(a => a.href.replace('mailto:', '').split('?')[0]);
          
          // Combine and deduplicate
          const allEmails = [...new Set([...emails, ...mailtoLinks])];
          
          return allEmails.sort();
        })();
      `
    });
    
    const emails = results[0];
    
    if (emails.length === 0) {
      statusDiv.textContent = 'No email addresses found on this page.';
      statusDiv.className = 'info';
      statusDiv.style.display = 'block';
    } else {
      resultsDiv.innerHTML = `<strong>Found ${emails.length} email(s):</strong><br>` +
        emails.map(email => `<div class="email-item">${email}</div>`).join('');
      resultsDiv.style.display = 'block';
      copyBtn.style.display = 'block';
      
      // Store emails for copying
      copyBtn.dataset.emails = emails.join('\n');
    }
  } catch (error) {
    statusDiv.textContent = 'Error: ' + error.message;
    statusDiv.className = 'info';
    statusDiv.style.display = 'block';
  }
  
  button.disabled = false;
  button.textContent = 'Collect Emails from Page';
});

document.getElementById('copy-btn').addEventListener('click', () => {
  const emails = document.getElementById('copy-btn').dataset.emails;
  const statusDiv = document.getElementById('status');
  
  navigator.clipboard.writeText(emails).then(() => {
    statusDiv.textContent = 'Copied to clipboard!';
    statusDiv.className = 'success';
    statusDiv.style.display = 'block';
    
    setTimeout(() => {
      statusDiv.style.display = 'none';
    }, 2000);
  });
});
