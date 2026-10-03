/**
 * Export JSON table data to a downloadable CSV file.
 * Handles proper escaping, commas, quotes, and date formatting.
 *
 * @param {string} filename - Desired filename (e.g. 'applications_export')
 * @param {Array<{key: string, label: string}>} columns - List of column mappings
 * @param {Array<object>} rows - The data array
 */
export function exportToCSV(filename, columns, rows) {
  if (!rows || rows.length === 0) {
    alert('No data available to export.');
    return;
  }

  const escapeCSV = (value) => {
    if (value === null || value === undefined) return '""';
    const str = String(value).replace(/"/g, '""');
    return `"${str}"`;
  };

  const headerRow = columns.map(col => escapeCSV(col.label)).join(',');
  const dataRows = rows.map(row => {
    return columns.map(col => {
      let val;
      if (typeof col.format === 'function') {
        val = col.format(row[col.key], row);
      } else {
        val = row[col.key];
      }
      return escapeCSV(val);
    }).join(',');
  });

  const csvContent = [headerRow, ...dataRows].join('\r\n');
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  const safeName = filename.endsWith('.csv') ? filename : `${filename}.csv`;
  link.setAttribute('href', url);
  link.setAttribute('download', safeName);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
