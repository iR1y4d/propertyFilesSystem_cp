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
