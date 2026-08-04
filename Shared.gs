function readRegisteredStudents_() {
  const sheet = getSheet_(); // Uses the existing registration function in Code.gs
  const values = sheet.getDataRange().getDisplayValues();
  if (values.length < 2) return [];

  const headers = values[0].map(h => String(h).trim().toLowerCase());
  const idCol = headers.indexOf('participant id');
  const firstCol = headers.indexOf('child first name');
  const lastCol = headers.indexOf('child last name');

  if (firstCol === -1 || lastCol === -1) throw new Error('Child name columns were not found in Registrations.');

  const students = [];
  for (let r = 1; r < values.length; r++) {
    const firstName = String(values[r][firstCol] || '').trim();
    const lastName = String(values[r][lastCol] || '').trim();
    if (!firstName && !lastName) continue;

    let id = idCol >= 0 ? String(values[r][idCol] || '').trim() : '';
    if (!id) id = 'EGP-' + String(r).padStart(3,'0');

    students.push({id, firstName, lastName});
  }
  return students;
}

function normalizeDate_(value) {
  if (value instanceof Date && !isNaN(value)) {
    return Utilities.formatDate(value, SETTINGS.TIME_ZONE, 'yyyy-MM-dd');
  }
  const text = String(value || '').trim();
  const match = text.match(/^\d{4}-\d{2}-\d{2}/);
  return match ? match[0] : text;
}
