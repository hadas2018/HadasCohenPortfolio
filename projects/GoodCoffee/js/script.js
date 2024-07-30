document.getElementById('downloadBtn').addEventListener('click', function(event) {
    if (!confirm('לשמור קובץ zip?')) {
     event.preventDefault();
  }
});