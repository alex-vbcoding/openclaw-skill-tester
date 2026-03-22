// File upload handling
const fileInput = document.getElementById('fileInput');
const resultDiv = document.getElementById('result');

fileInput.addEventListener('change', async (e) => {
  const files = Array.from(e.target.files);
  
  if (files.length === 0) {
    return;
  }

  resultDiv.innerHTML = '<p style="color:#667eea;">⏳ Testing skill... This may take a minute.</p>';

  const formData = new FormData();
  
  // Add all files from the directory
  files.forEach(file => {
    formData.append('files', file, file.webkitRelativePath || file.name);
  });

  try {
    const response = await fetch('/api/test-upload', {
      method: 'POST',
      body: formData
    });

    const result = await response.json();

    if (response.ok) {
      displayResult(result);
    } else {
      resultDiv.innerHTML = `<p style="color:#e53e3e;">❌ Error: ${result.error}</p>`;
    }
  } catch (error) {
    resultDiv.innerHTML = `<p style="color:#e53e3e;">❌ Network error: ${error.message}</p>`;
  }
});

function displayResult(result) {
  const scoreClass = result.score >= 90 ? 'high' : result.score >= 70 ? 'med' : 'low';
  const statusBadge = result.passed ? 
    '<span class="badge pass">PASSED</span>' : 
    '<span class="badge fail">FAILED</span>';

  let html = `
    <div style="background:white;padding:20px;border-radius:8px;border:2px solid ${result.passed ? '#38a169' : '#e53e3e'};">
      <h3 style="margin-bottom:15px;">${result.skillName}</h3>
      <div style="display:flex;gap:20px;align-items:center;margin-bottom:20px;">
        <div>
          <div style="font-size:2rem;" class="score ${scoreClass}">${result.score}/100</div>
          <div style="color:#666;font-size:0.9rem;">Quality Score</div>
        </div>
        <div>${statusBadge}</div>
      </div>
      
      <h4 style="margin:20px 0 10px;">Test Results (${result.tests.filter(t => t.passed).length}/${result.tests.length} passed)</h4>
      <div style="max-height:300px;overflow-y:auto;">
        ${result.tests.map(test => `
          <div style="padding:8px;border-bottom:1px solid #eee;">
            ${test.passed ? '✅' : '❌'} ${test.name}: ${test.message}
          </div>
        `).join('')}
      </div>

      ${result.warnings.length > 0 ? `
        <h4 style="margin:20px 0 10px;color:#d69e2e;">⚠️ Warnings (${result.warnings.length})</h4>
        <ul style="color:#666;font-size:0.9rem;">
          ${result.warnings.map(w => `<li>${w}</li>`).join('')}
        </ul>
      ` : ''}
    </div>
  `;

  resultDiv.innerHTML = html;
  
  // Reload page to show updated rankings
  setTimeout(() => location.reload(), 3000);
}
