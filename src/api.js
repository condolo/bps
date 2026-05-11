const BASE = '/api';

async function req(method, path, body) {
  const res = await fetch(BASE + path, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : {},
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(err.error || 'Request failed');
  }
  return res.json();
}

export const api = {
  login: (email, pin) => req('POST', '/auth/login', { email, pin }),

  loadAll: () =>
    Promise.all([
      req('GET', '/students'),
      req('GET', '/users'),
      req('GET', '/logs'),
      req('GET', '/notifications'),
      req('GET', '/appeals'),
      req('GET', '/brand'),
    ]).then(([students, staff, logs, notifications, appeals, brand]) => ({
      students, staff, logs, notifications, appeals, brand,
    })),

  addStudent:      (s)           => req('POST',   '/students',           s),
  addStudentsBulk: (students)    => req('POST',   '/students/bulk',      { students }),
  deleteStudent:   (id)          => req('DELETE',  `/students/${id}`),

  addUser:   (u)  => req('POST',   '/users',   u),
  deleteUser: (id) => req('DELETE', `/users/${id}`),

  addLog:   (log, notifs) => req('POST', '/logs', { log, notifs }),

  markRead:      (id, uid)  => req('PATCH', `/notifications/${id}/read`, { uid }),

  submitAppeal:  (appeal, logId) => req('POST',  '/appeals',      { appeal, logId }),
  resolveAppeal: (id, data)      => req('PATCH', `/appeals/${id}`, data),
  parentNote:    (id, note)      => req('PATCH', `/appeals/${id}`, { parentNote: note }),

  getBrand:    ()      => req('GET', '/brand'),
  updateBrand: (brand) => req('PUT', '/brand', brand),
};
