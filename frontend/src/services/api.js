import axios from 'axios'
const api = axios.create({ baseURL: 'http://localhost:5000/api', timeout: 30000 })
api.interceptors.request.use(config => {
  const token = localStorage.getItem('ns_token')
  if (token) config.headers.Authorization = 'Bearer ' + token
  return config
})
api.interceptors.response.use(res => res, err => {
  if (err.response?.status === 401) {
    ['ns_token','ns_user','ns_role'].forEach(k => localStorage.removeItem(k))
    window.location.href = '/'
  }
  return Promise.reject(err)
})
export default api

export const citizenAPI = {
  register: d => api.post('/citizen/register', d, { headers: { 'Content-Type': 'multipart/form-data' } }),
  login: d => api.post('/citizen/login', d),
  getProfile: () => api.get('/citizen/profile'),
  updateProfile: d => api.put('/citizen/profile', d, { headers: { 'Content-Type': 'multipart/form-data' } }),
  changePassword: d => api.put('/citizen/change-password', d),
  getDashboard: () => api.get('/citizen/dashboard'),
  getReports: () => api.get('/citizen/reports'),
  applyForCertificate: d => api.post('/citizen/applications', d, { headers: { 'Content-Type': 'multipart/form-data' } }),
  getApplications: p => api.get('/citizen/applications', { params: p }),
  getApplicationDetail: id => api.get('/citizen/applications/' + id),
  trackApplication: num => api.get('/citizen/applications/track/' + num),
  cancelApplication: id => api.put('/citizen/applications/' + id + '/cancel'),
  resubmitApplication: (id, d) => api.put('/citizen/applications/' + id + '/resubmit', d),
  downloadCertificate: id => api.get('/citizen/applications/' + id + '/download'),
  getNotifications: () => api.get('/citizen/notifications'),
  markNotificationRead: id => api.put('/citizen/notifications/' + id + '/read'),
  markAllNotificationsRead: () => api.put('/citizen/notifications/read-all'),
  raiseTicket: d => api.post('/citizen/support', d),
  getTickets: () => api.get('/citizen/support'),
}

export const employeeAPI = {
  login: d => api.post('/employee/login', d),
  getProfile: () => api.get('/employee/profile'),
  getDashboard: () => api.get('/employee/dashboard'),
  getReports: () => api.get('/employee/reports'),
  getApplications: p => api.get('/employee/applications', { params: p }),
  getApplicationDetail: id => api.get('/employee/applications/' + id),
  verifyApplication: (id, d) => api.put('/employee/applications/' + id + '/verify', d),
  returnApplication: (id, d) => api.put('/employee/applications/' + id + '/return', d),
  rejectApplication: (id, d) => api.put('/employee/applications/' + id + '/reject', d),
  getPensionApplications: () => api.get('/employee/pension'),
  applyForPension: d => api.post('/employee/pension', d),
  downloadPensionLetter: id => api.get('/employee/pension/' + id + '/download-letter'),
  getNotifications: () => api.get('/employee/notifications'),
}

export const officerAPI = {
  login: d => api.post('/officer/login', d),
  getProfile: () => api.get('/officer/profile'),
  getDashboard: () => api.get('/officer/dashboard'),
  getPendingApplications: p => api.get('/officer/applications/pending', { params: p }),
  getApplicationDetail: id => api.get('/officer/applications/' + id),
  approveApplication: (id, d) => api.put('/officer/applications/' + id + '/approve', d),
  rejectApplication: (id, d) => api.put('/officer/applications/' + id + '/reject', d),
  getPensionApplications: p => api.get('/officer/pension', { params: p }),
  approvePension: (id, d) => api.put('/officer/pension/' + id + '/approve', d),
  rejectPension: (id, d) => api.put('/officer/pension/' + id + '/reject', d),
  getReports: () => api.get('/officer/reports'),
  getNotifications: () => api.get('/officer/notifications'),
}

export const adminAPI = {
  login: d => api.post('/admin/login', d),
  getProfile: () => api.get('/admin/profile'),
  updateProfile: d => api.put('/admin/profile', d),
  changePassword: d => api.put('/admin/change-password', d),
  getDashboard: () => api.get('/admin/dashboard'),
  getReports: () => api.get('/admin/reports'),
  getCitizens: p => api.get('/admin/citizens', { params: p }),
  getCitizenDetail: id => api.get('/admin/citizens/' + id),
  toggleCitizenStatus: id => api.put('/admin/citizens/' + id + '/toggle'),
  getEmployees: p => api.get('/admin/employees', { params: p }),
  createEmployee: d => api.post('/admin/employees', d),
  updateEmployee: (id, d) => api.put('/admin/employees/' + id, d),
  deleteEmployee: id => api.delete('/admin/employees/' + id),
  getOfficers: p => api.get('/admin/officers', { params: p }),
  createOfficer: d => api.post('/admin/officers', d),
  updateOfficer: (id, d) => api.put('/admin/officers/' + id, d),
  deleteOfficer: id => api.delete('/admin/officers/' + id),
  getDepartments: p => api.get('/admin/departments', { params: p }),
  createDepartment: d => api.post('/admin/departments', d),
  updateDepartment: (id, d) => api.put('/admin/departments/' + id, d),
  deleteDepartment: id => api.delete('/admin/departments/' + id),
  getCertificateTypes: p => api.get('/admin/certificate-types', { params: p }),
  createCertificateType: d => api.post('/admin/certificate-types', d),
  updateCertificateType: (id, d) => api.put('/admin/certificate-types/' + id, d),
  deleteCertificateType: id => api.delete('/admin/certificate-types/' + id),
  getApplications: p => api.get('/admin/applications', { params: p }),
  getApplicationDetail: id => api.get('/admin/applications/' + id),
  updateApplicationStatus: (id, d) => api.put('/admin/applications/' + id + '/status', d),
  getPensionApplications: p => api.get('/admin/pension-applications', { params: p }),
  updatePensionStatus: (id, d) => api.put('/admin/pension-applications/' + id + '/status', d),
  getAnnouncements: () => api.get('/admin/announcements'),
  createAnnouncement: d => api.post('/admin/announcements', d),
  deleteAnnouncement: id => api.delete('/admin/announcements/' + id),
  getFAQs: () => api.get('/admin/faqs'),
  createFAQ: d => api.post('/admin/faqs', d),
  getAuditLogs: p => api.get('/admin/audit-logs', { params: p }),
  getSupportTickets: () => api.get('/admin/support-tickets'),
  resolveTicket: (id, d) => api.put('/admin/support-tickets/' + id + '/resolve', d),
}

export const publicAPI = {
  getCertificateTypes: () => api.get('/public/certificate-types'),
  getCertificateTypeDetail: id => api.get('/public/certificate-types/' + id),
  getAnnouncements: () => api.get('/public/announcements'),
  getFAQs: () => api.get('/public/faqs'),
  getStats: () => api.get('/public/stats'),
  getDepartments: () => api.get('/public/departments'),
  getStates: () => api.get('/public/states'),
  getDistrictsByState: sid => api.get('/public/states/' + sid + '/districts'),
  getTaluksByDistrict: did => api.get('/public/districts/' + did + '/taluks'),
  verifyCertificate: query => api.get('/public/verify-certificate/' + encodeURIComponent(query)),
  chat: (message, history) => api.post('/public/chat', { message, history }),
}