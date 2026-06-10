// Download blob/arraybuffer response as file
export const downloadBlob = async (data, filename) => {
  // Determine correct MIME type
  const mimeType = filename.endsWith('.pdf')
    ? 'application/pdf'
    : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

  // Create a proper Blob with the correct MIME type from the arraybuffer
  const fileBlob = new Blob([data], { type: mimeType });

  // Try native "Save As" dialog first (Chrome/Edge)
  try {
    if (window.showSaveFilePicker) {
      const handle = await window.showSaveFilePicker({
        suggestedName: filename,
        types: [
          {
            description: filename.endsWith('.pdf') ? 'PDF File' : 'Excel File',
            accept: { [mimeType]: [filename.endsWith('.pdf') ? '.pdf' : '.xlsx'] },
          },
        ],
      });
      const writable = await handle.createWritable();
      await writable.write(fileBlob);
      await writable.close();
      return;
    }
  } catch (error) {
    if (error.name === 'AbortError') return; // User cancelled the dialog
    console.error('File System Access API failed, falling back to default download', error);
  }

  // Fallback: auto download
  const url = window.URL.createObjectURL(fileBlob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
};

// Format date for display (Arabic)
export const formatDate = (dateStr) => {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('ar-SA-u-nu-latn', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

// Print a PDF blob directly in the browser via a hidden iframe
export const printPdfBlob = (data) => {
  const blob = new Blob([data], { type: 'application/pdf' });
  const blobUrl = URL.createObjectURL(blob);

  const iframe = document.createElement('iframe');
  iframe.style.position = 'absolute';
  iframe.style.top = '-9999px';
  iframe.style.left = '-9999px';
  iframe.style.width = '800px';
  iframe.style.height = '600px';
  iframe.style.border = 'none';
  iframe.src = blobUrl;

  document.body.appendChild(iframe);

  const triggerPrint = () => {
    try {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
    } catch (e) {
      console.error('Failed to trigger inline print, opening in new tab', e);
      window.open(blobUrl, '_blank');
    }

    // Defer cleanup by 5 minutes so the print dialog doesn't close prematurely
    setTimeout(() => {
      try {
        document.body.removeChild(iframe);
        URL.revokeObjectURL(blobUrl);
      } catch (err) {
        // ignore if already cleaned up
      }
    }, 300000);
  };

  let loaded = false;
  iframe.onload = () => {
    if (!loaded) {
      loaded = true;
      triggerPrint();
    }
  };

  // Fallback timeout in case onload doesn't trigger for PDF plugin
  setTimeout(() => {
    if (!loaded) {
      loaded = true;
      triggerPrint();
    }
  }, 1000);
};

