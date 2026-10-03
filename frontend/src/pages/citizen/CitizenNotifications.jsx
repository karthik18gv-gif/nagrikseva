import { useState, useEffect } from 'react'
import { citizenAPI } from '../../services/api'
import PageHeader from '../../components/common/PageHeader'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import toast from 'react-hot-toast'
export default function CitizenNotifications() {
  const [notifications, setNotifications] = useState([]); const [loading, setLoading] = useState(true)
  const fetchNotifs = () => { citizenAPI.getNotifications().then(r => setNotifications(r.data.data.notifications||[])).catch(()=>{}).finally(()=>setLoading(false)) }
  useEffect(() => { fetchNotifs() }, [])
  const markAllRead = async () => { await citizenAPI.markAllNotificationsRead(); toast.success('All marked as read'); fetchNotifs() }
  const icons = { success:'✅', error:'❌', warning:'⚠️', info:'ℹ️' }
  return (
    <div>
      <PageHeader title="Notifications" subtitle="Stay updated on your application status" actions={<button onClick={markAllRead} className="btn-secondary text-sm py-2">Mark All Read</button>} />
      {loading ? <LoadingSpinner /> : notifications.length === 0 ? (
        <div className="text-center py-16"><div className="text-5xl mb-4">🔔</div><p className="text-slate-500">No notifications yet</p></div>
      ) : (
        <div className="space-y-3">
          {notifications.map(n => (
            <div key={n.id} className={`flex items-start gap-3 p-4 rounded-xl border transition-all ${n.is_read?'bg-white border-slate-100':'bg-blue-50 border-blue-200'}`}>
              <span className="text-xl flex-shrink-0">{icons[n.type]||'ℹ️'}</span>
              <div className="flex-1"><p className="font-semibold text-slate-800 text-sm">{n.title}</p><p className="text-slate-600 text-xs mt-0.5">{n.message}</p><p className="text-slate-400 text-xs mt-1">{new Date(n.created_at).toLocaleString('en-IN')}</p></div>
              {!n.is_read && <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1"></span>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
