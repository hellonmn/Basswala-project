const BASE = 'http://localhost:5000/api'
const tok = () => localStorage.getItem('bw_admin_token')
const h = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${tok()}` })
const r = (res) => res.json()

export const api = {
  // Auth
  login: (d) => fetch(`${BASE}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(d) }).then(r),

  // Dashboard
  dashboard: () => fetch(`${BASE}/admin/dashboard`, { headers: h() }).then(r),

  // Reports
  monthlyReport: (m, y) => fetch(`${BASE}/admin/reports/monthly?month=${m}&year=${y}`, { headers: h() }).then(r),
  yearlyReport: (y) => fetch(`${BASE}/admin/reports/yearly?year=${y}`, { headers: h() }).then(r),

  // Users
  getUsers: (p = '') => fetch(`${BASE}/admin/users${p}`, { headers: h() }).then(r),
  getUser: (id) => fetch(`${BASE}/admin/users/${id}`, { headers: h() }).then(r),
  updateUser: (id, d) => fetch(`${BASE}/admin/users/${id}`, { method: 'PUT', headers: h(), body: JSON.stringify(d) }).then(r),
  updateUserLocation: (id, d) => fetch(`${BASE}/admin/users/${id}/location`, { method: 'PUT', headers: h(), body: JSON.stringify(d) }).then(r),
  resetUserPassword: (id, p) => fetch(`${BASE}/admin/users/${id}/reset-password`, { method: 'PUT', headers: h(), body: JSON.stringify({ newPassword: p }) }).then(r),
  toggleUserStatus: (id) => fetch(`${BASE}/admin/users/${id}/toggle-status`, { method: 'PUT', headers: h() }).then(r),
  verifyUser: (id) => fetch(`${BASE}/admin/users/${id}/verify`, { method: 'PUT', headers: h() }).then(r),
  getUserBookings: (id, p = '') => fetch(`${BASE}/admin/users/${id}/bookings${p}`, { headers: h() }).then(r),
  deleteUser: (id) => fetch(`${BASE}/admin/users/${id}`, { method: 'DELETE', headers: h() }).then(r),

  // DJs
  getDJs: (p = '') => fetch(`${BASE}/admin/djs${p}`, { headers: h() }).then(r),
  getDJ: (id) => fetch(`${BASE}/admin/djs/${id}`, { headers: h() }).then(r),
  createDJ: (d) => fetch(`${BASE}/admin/djs`, { method: 'POST', headers: h(), body: JSON.stringify(d) }).then(r),
  updateDJ: (id, d) => fetch(`${BASE}/admin/djs/${id}`, { method: 'PUT', headers: h(), body: JSON.stringify(d) }).then(r),
  assignDJOwner: (id, userId) => fetch(`${BASE}/admin/djs/${id}/assign-owner`, { method: 'PUT', headers: h(), body: JSON.stringify({ userId }) }).then(r),
  toggleDJAvail: (id) => fetch(`${BASE}/admin/djs/${id}/availability`, { method: 'PUT', headers: h() }).then(r),
  getDJBookings: (id, p = '') => fetch(`${BASE}/admin/djs/${id}/bookings${p}`, { headers: h() }).then(r),
  deleteDJ: (id) => fetch(`${BASE}/admin/djs/${id}`, { method: 'DELETE', headers: h() }).then(r),

  // Bookings
  getBookings: (p = '') => fetch(`${BASE}/admin/bookings${p}`, { headers: h() }).then(r),
  getBooking: (id) => fetch(`${BASE}/admin/bookings/${id}`, { headers: h() }).then(r),
  updateBooking: (id, d) => fetch(`${BASE}/admin/bookings/${id}`, { method: 'PUT', headers: h(), body: JSON.stringify(d) }).then(r),
  updateBookingStatus: (id, s) => fetch(`${BASE}/admin/bookings/${id}/status`, { method: 'PUT', headers: h(), body: JSON.stringify({ status: s }) }).then(r),
  updateBookingPayment: (id, d) => fetch(`${BASE}/admin/bookings/${id}/payment`, { method: 'PUT', headers: h(), body: JSON.stringify(d) }).then(r),
  deleteBooking: (id) => fetch(`${BASE}/admin/bookings/${id}`, { method: 'DELETE', headers: h() }).then(r),
}
