import React, { useState, useMemo, useEffect } from 'react';
import {
  LayoutDashboard,
  Files,
  Armchair,
  CreditCard,
  HeartPulse,
  Siren,
  Search,
  Bell,
  Plane,
  History,
  User,
  Users,
  CheckCircle2,
  ShieldCheck,
  Clock,
  Loader2,
  LogOut,
  Plus,
  Trash2
} from 'lucide-react';
import { format, addDays, differenceInDays, isPast, parseISO } from 'date-fns';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import SecureField from '../components/SecureField';
import StatusBadge from '../components/StatusBadge';
import Modal from '../components/Modal';

export default function Dashboard() {
  const { user: currentUser, logout } = useAuth();
  const [data, setData] = useState({
    users: [],
    docs: [],
    assets: [],
    bills: [],
    health: [],
    emergency: { contacts: [], insurance: '' }
  });
  const [loading, setLoading] = useState(true);
  const [activeUser, setActiveUser] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSOSOpen, setSOSOpen] = useState(false);
  const [isQuickAddOpen, setQuickAddOpen] = useState(false);
  const [travelMode, setTravelMode] = useState(false);
  const [addType, setAddType] = useState(null); // 'doc', 'asset', 'bill', 'health'

  // Form States
  const [formData, setFormData] = useState({});

  const fetchData = () => {
    api.get('/data')
      .then(res => {
        setData(res.data);
        if (!activeUser && res.data.users.length > 0) {
            // Try to set activeUser to the current logged in user if exists in list
            const me = res.data.users.find(u => u.id === currentUser._id);
            setActiveUser(me || res.data.users[0]);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to fetch data:", err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDelete = async (type, id) => {
      if (!window.confirm('Are you sure you want to delete this item?')) return;
      try {
          await api.delete(`/${type}/${id}`);
          fetchData();
      } catch (err) {
          alert('Failed to delete');
      }
  };

  const handleAddSubmit = async (e) => {
      e.preventDefault();
      try {
          // Add userId to formData based on activeUser or current User
          // If activeUser is 'family' or a user, we should probably let the user select?
          // For now, let's assume it belongs to the 'activeUser' selected in the dashboard or the logged in user.
          // The backend expects 'userId'.

          const payload = { ...formData };
          if (activeUser) {
              payload.userId = activeUser.id === 'family' ? 'family' : activeUser.id;
          } else {
              payload.userId = currentUser._id;
          }

          let endpoint = '';
          if (addType === 'doc') endpoint = '/documents';
          if (addType === 'asset') endpoint = '/assets';
          if (addType === 'bill') endpoint = '/bills';
          if (addType === 'health') endpoint = '/health';

          await api.post(endpoint, payload);
          setQuickAddOpen(false);
          setAddType(null);
          setFormData({});
          fetchData();
      } catch (err) {
          alert('Failed to add item: ' + err.message);
      }
  };

  const filteredDocs = useMemo(() => {
    if (!activeUser) return [];
    let docs = data.docs.filter(d =>
      (d.userId === activeUser.id || activeUser.id === 'family' || d.userId === 'family') &&
      (d.title.toLowerCase().includes(searchQuery.toLowerCase()) || d.type.toLowerCase().includes(searchQuery.toLowerCase()))
    );
    if (travelMode) {
      docs = docs.filter(d => d.tags && d.tags.includes('travel'));
    }
    return docs;
  }, [data.docs, activeUser, searchQuery, travelMode]);

  const filteredAssets = useMemo(() => {
    return data.assets.filter(a => a.title.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [data.assets, searchQuery]);

  const filteredBills = useMemo(() => {
    return data.bills.filter(b => b.title.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [data.bills, searchQuery]);

  const urgentItems = useMemo(() => {
    const today = new Date();
    const alerts = [];

    data.bills.forEach(b => {
      const days = differenceInDays(parseISO(b.dueDate), today);
      if (b.status === 'pending' && days <= 5) {
        alerts.push({ type: 'bill', title: b.title, msg: `Due in ${days} days`, days });
      }
    });

    data.assets.forEach(a => {
      if (a.warrantyExpiry) {
        const days = differenceInDays(parseISO(a.warrantyExpiry), today);
        if (days <= 45 && days > 0) {
            alerts.push({ type: 'warranty', title: a.title, msg: `Warranty expires in ${days} days`, days });
        }
      }
    });

    return alerts.sort((a, b) => a.days - b.days);
  }, [data.bills, data.assets]);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-stone-50 text-stone-400 gap-3">
        <Loader2 className="animate-spin" /> Loading Hearth...
      </div>
    );
  }

  const renderDashboard = () => (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
      <div className="bg-gradient-to-br from-stone-50 to-white p-6 rounded-2xl border border-stone-100 shadow-sm">
        <h2 className="text-2xl font-serif text-stone-800 mb-1">Good Morning, {currentUser?.name}.</h2>
        <p className="text-stone-500 mb-6">Here is your family briefing for today.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {urgentItems.length > 0 ? urgentItems.map((item, i) => (
            <div key={i} className="flex items-start gap-3 bg-white p-4 rounded-xl border border-stone-100 shadow-sm hover:shadow-md transition-shadow">
              <div className={`p-2 rounded-full ${item.type === 'bill' ? 'bg-rose-50 text-rose-600' : 'bg-amber-50 text-amber-600'}`}>
                {item.type === 'bill' ? <CreditCard size={18} /> : <ShieldCheck size={18} />}
              </div>
              <div>
                <h4 className="font-medium text-stone-800 text-sm">{item.title}</h4>
                <p className="text-xs text-stone-500">{item.msg}</p>
              </div>
            </div>
          )) : (
            <div className="col-span-3 flex items-center gap-3 bg-emerald-50/50 p-4 rounded-xl border border-emerald-100">
              <CheckCircle2 className="text-emerald-600" size={20} />
              <span className="text-emerald-800 text-sm">Everything is running smoothly. No urgent alerts.</span>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-stone-100 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-semibold text-stone-700">Storage Breakdown</h3>
            <span className="text-xs text-stone-400">Total: 15.2 GB used</span>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-8">
            <div className="relative w-32 h-32 rounded-full flex items-center justify-center bg-[conic-gradient(var(--tw-gradient-stops))] from-teal-500 via-rose-400 to-amber-300">
              <div className="absolute inset-2 bg-white rounded-full flex flex-col items-center justify-center">
                <span className="text-2xl font-bold text-stone-700">42%</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-x-8 gap-y-3 w-full">
              {[
                { label: 'Documents', color: 'bg-teal-500', val: '5.4 GB' },
                { label: 'Health Records', color: 'bg-rose-400', val: '3.1 GB' },
                { label: 'Finance', color: 'bg-amber-300', val: '2.8 GB' },
                { label: 'Archive', color: 'bg-stone-300', val: '3.9 GB' }
              ].map((s, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${s.color}`} />
                  <div className="flex flex-col">
                    <span className="text-xs font-medium text-stone-600">{s.label}</span>
                    <span className="text-xs text-stone-400">{s.val}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-stone-100 shadow-sm flex flex-col justify-center gap-3">
          <h3 className="font-semibold text-stone-700 mb-2">Quick Actions</h3>
          <button onClick={() => { setQuickAddOpen(true); setAddType('doc'); }} className="w-full text-left px-4 py-3 rounded-xl bg-stone-50 hover:bg-stone-100 transition-colors flex items-center gap-3 text-sm text-stone-600 font-medium group">
            <div className="bg-white p-1.5 rounded-lg shadow-sm group-hover:scale-110 transition-transform"><Files size={16} className="text-teal-600" /></div>
            Upload Document
          </button>
          <button onClick={() => { setQuickAddOpen(true); setAddType('bill'); }} className="w-full text-left px-4 py-3 rounded-xl bg-stone-50 hover:bg-stone-100 transition-colors flex items-center gap-3 text-sm text-stone-600 font-medium group">
            <div className="bg-white p-1.5 rounded-lg shadow-sm group-hover:scale-110 transition-transform"><CreditCard size={16} className="text-rose-500" /></div>
            Log Expense
          </button>
          <button onClick={() => { setQuickAddOpen(true); setAddType('asset'); }} className="w-full text-left px-4 py-3 rounded-xl bg-stone-50 hover:bg-stone-100 transition-colors flex items-center gap-3 text-sm text-stone-600 font-medium group">
            <div className="bg-white p-1.5 rounded-lg shadow-sm group-hover:scale-110 transition-transform"><Armchair size={16} className="text-amber-500" /></div>
            Add Asset
          </button>
        </div>
      </div>
    </div>
  );

  const renderVault = () => (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-serif text-stone-800">
            {activeUser?.id === 'family' ? 'Family Archive' : `${activeUser?.name}'s Vault`}
          </h2>
          <p className="text-stone-500 text-sm mt-1">
            {filteredDocs.length} documents stored securely.
          </p>
        </div>
        <button
          onClick={() => setTravelMode(!travelMode)}
          className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${travelMode ? 'bg-sky-500 text-white shadow-lg shadow-sky-200 ring-2 ring-offset-2 ring-sky-500' : 'bg-white border border-stone-200 text-stone-600 hover:bg-stone-50'}`}
        >
          <Plane size={16} />
          Travel Mode {travelMode ? 'On' : 'Off'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredDocs.map(doc => {
          const isExpired = doc.expiry && isPast(parseISO(doc.expiry));
          const daysLeft = doc.expiry ? differenceInDays(parseISO(doc.expiry), new Date()) : 999;

          return (
            <div key={doc.id} className="group bg-white rounded-xl border border-stone-200 p-5 hover:border-teal-500/50 hover:shadow-lg hover:shadow-teal-500/5 transition-all relative overflow-hidden">
              {daysLeft < 45 && !isExpired && (
                <div className="absolute top-0 right-0 bg-amber-100 text-amber-700 text-[10px] font-bold px-2 py-1 rounded-bl-lg">EXPIRING SOON</div>
              )}
              {isExpired && (
                <div className="absolute top-0 right-0 bg-rose-100 text-rose-700 text-[10px] font-bold px-2 py-1 rounded-bl-lg">EXPIRED</div>
              )}

              <div className="flex justify-between items-start mb-4">
                <div className="p-2 bg-stone-50 rounded-lg text-stone-400 group-hover:text-teal-600 transition-colors">
                  <Files size={20} />
                </div>
                <div className="flex gap-1">
                   {doc.tags.map(t => <span key={t} className="text-[10px] uppercase tracking-wider text-stone-400 bg-stone-50 px-1.5 py-0.5 rounded-md">{t}</span>)}
                </div>
                <button onClick={() => handleDelete('documents', doc.id)} className="text-stone-300 hover:text-rose-500"><Trash2 size={14}/></button>
              </div>

              <h3 className="font-medium text-stone-800">{doc.title}</h3>
              <p className="text-xs text-stone-500 mb-4">{doc.type}</p>

              {doc.secure && <div className="mb-3"><SecureField value={doc.number} /></div>}

              <div className="flex flex-col gap-1 text-xs text-stone-500 pt-3 border-t border-stone-100">
                {doc.expiry && (
                   <div className="flex items-center gap-1.5">
                     <Clock size={12} />
                     <span>Expires: <span className={isExpired ? 'text-rose-600 font-medium' : ''}>{format(parseISO(doc.expiry), 'MMM dd, yyyy')}</span></span>
                   </div>
                )}
                <div className="flex items-center gap-1.5">
                  <MapPin size={12} />
                  <span>{doc.location}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderAssets = () => (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-serif text-stone-800">Asset Lifecycle</h2>
          <p className="text-stone-500 text-sm mt-1">Tracking {filteredAssets.length} devices and appliances.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {filteredAssets.map(asset => {
           const daysLeft = asset.warrantyExpiry ? differenceInDays(parseISO(asset.warrantyExpiry), new Date()) : 999;

           return (
            <div key={asset.id} className="bg-white rounded-xl border border-stone-200 p-6 flex flex-col lg:flex-row gap-6">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                   <div className="flex items-center gap-3">
                     <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg"><Armchair size={20} /></div>
                     <h3 className="font-semibold text-stone-800 text-lg">{asset.title}</h3>
                   </div>
                   <div className="flex items-center gap-2">
                     <StatusBadge type={daysLeft < 0 ? 'neutral' : daysLeft < 45 ? 'warning' : 'success'} text={daysLeft < 0 ? 'Warranty Expired' : `Warranty: ${daysLeft} days left`} />
                     <button onClick={() => handleDelete('assets', asset.id)} className="text-stone-300 hover:text-rose-500 ml-2"><Trash2 size={16}/></button>
                   </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div className="bg-stone-50 p-3 rounded-lg">
                    <span className="block text-xs text-stone-400 mb-1">Purchase Date</span>
                    <span className="font-mono text-sm text-stone-700">{asset.purchaseDate}</span>
                  </div>
                  <div className="bg-stone-50 p-3 rounded-lg">
                     <span className="block text-xs text-stone-400 mb-1">Next Service</span>
                     <span className="font-mono text-sm text-stone-700">
                        {asset.serviceInterval > 0 ? format(addDays(new Date(), 45), 'yyyy-MM-dd') : 'N/A'}
                     </span>
                  </div>
                </div>
              </div>

              <div className="lg:w-1/3 lg:border-l lg:border-stone-100 lg:pl-6">
                 <h4 className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-3 flex items-center gap-2"><History size={12}/> Service Log</h4>
                 <div className="space-y-4 relative">
                    <div className="absolute left-1.5 top-1 bottom-0 w-px bg-stone-200"></div>
                    {asset.serviceHistory.length > 0 ? asset.serviceHistory.map((log, i) => (
                      <div key={i} className="relative pl-6">
                        <div className="absolute left-0 top-1.5 w-3 h-3 bg-stone-100 border-2 border-teal-500 rounded-full"></div>
                        <p className="text-sm font-medium text-stone-700">{log.note}</p>
                        <p className="text-xs text-stone-400">{log.date}</p>
                      </div>
                    )) : <p className="text-xs text-stone-400 italic pl-6">No service history recorded.</p>}
                 </div>
              </div>
            </div>
           );
        })}
      </div>
    </div>
  );

  const renderFinance = () => (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-serif text-stone-800">Financial Control</h2>
        <div className="flex gap-2">
            <button className="px-3 py-1.5 text-xs font-medium bg-stone-800 text-white rounded-lg">Bills</button>
            <button className="px-3 py-1.5 text-xs font-medium text-stone-500 hover:bg-stone-100 rounded-lg">Subscriptions</button>
        </div>
      </div>

      <div className="bg-white border border-stone-200 rounded-xl overflow-hidden shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-stone-50 text-stone-500 border-b border-stone-200">
            <tr>
              <th className="px-6 py-4 font-medium">Description</th>
              <th className="px-6 py-4 font-medium">Amount</th>
              <th className="px-6 py-4 font-medium">Due Date</th>
              <th className="px-6 py-4 font-medium">Status</th>
              <th className="px-6 py-4 font-medium">Assigned To</th>
              <th className="px-6 py-4 font-medium"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {filteredBills.map(bill => (
              <tr key={bill.id} className="hover:bg-stone-50/50 transition-colors">
                <td className="px-6 py-4 font-medium text-stone-800">{bill.title}</td>
                <td className="px-6 py-4 font-mono">₹{bill.amount.toLocaleString()}</td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                     <span className={isPast(parseISO(bill.dueDate)) && bill.status === 'pending' ? 'text-rose-600 font-medium' : 'text-stone-600'}>{bill.dueDate}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <StatusBadge
                    type={bill.status === 'paid' ? 'success' : isPast(parseISO(bill.dueDate)) ? 'danger' : 'warning'}
                    text={bill.status === 'paid' ? 'Paid' : isPast(parseISO(bill.dueDate)) ? 'Overdue' : 'Pending'}
                  />
                </td>
                <td className="px-6 py-4">
                  {bill.user === 'family' ? (
                     <span className="inline-flex items-center gap-1 text-xs text-stone-500 bg-stone-100 px-2 py-1 rounded-md"><Users size={10} /> Household</span>
                  ) : (
                     <span className="inline-flex items-center gap-1 text-xs text-stone-500 bg-stone-100 px-2 py-1 rounded-md"><User size={10} /> {data.users.find(u => u.id === bill.user)?.name || 'Personal'}</span>
                  )}
                </td>
                <td className="px-6 py-4 text-right">
                    <button onClick={() => handleDelete('bills', bill.id)} className="text-stone-300 hover:text-rose-500"><Trash2 size={16}/></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderWellness = () => (
    <div className="space-y-6 animate-in fade-in duration-300">
       <div className="flex justify-between items-center">
        <h2 className="text-2xl font-serif text-stone-800">Wellness Hub</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
         <div className="col-span-1 md:col-span-2 grid grid-cols-2 sm:grid-cols-4 gap-4">
            {data.health.filter(h => h.type === 'Blood Group').map(bg => {
               const user = data.users.find(u => u.id === bg.userId);
               return (
                  <div key={bg.id} className="bg-rose-50 border border-rose-100 p-4 rounded-xl flex items-center justify-between">
                     <div>
                        <p className="text-xs text-rose-400 font-medium uppercase">{user?.name || 'Unknown'}</p>
                        <p className="text-2xl font-bold text-rose-600">{bg.value}</p>
                     </div>
                     <HeartPulse className="text-rose-300" />
                  </div>
               )
            })}
         </div>

         <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-sm">
            <h3 className="font-semibold text-stone-700 mb-4 flex items-center gap-2"><ShieldCheck size={18} className="text-teal-600"/> Vaccinations</h3>
            <div className="space-y-3">
               {data.health.filter(h => h.type === 'Vaccination').map(vac => (
                 <div key={vac.id} className="flex justify-between items-center p-3 bg-stone-50 rounded-lg">
                    <div>
                      <p className="font-medium text-stone-800 text-sm">{vac.value}</p>
                      <p className="text-xs text-stone-400">Last: {vac.date}</p>
                    </div>
                    <div className="text-right">
                       <p className="text-xs font-medium text-teal-600">Next Due</p>
                       <p className="text-xs text-stone-600">{vac.nextDue}</p>
                    </div>
                    <button onClick={() => handleDelete('health', vac.id)} className="text-stone-300 hover:text-rose-500 ml-2"><Trash2 size={14}/></button>
                 </div>
               ))}
            </div>
         </div>

         <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-sm">
            <h3 className="font-semibold text-stone-700 mb-4 flex items-center gap-2"><Files size={18} className="text-amber-500"/> Active Prescriptions</h3>
            <div className="space-y-3">
               {data.health.filter(h => h.type === 'Prescription').map(rx => (
                 <div key={rx.id} className="p-3 bg-stone-50 rounded-lg border-l-4 border-amber-400 flex justify-between">
                    <div>
                        <p className="font-medium text-stone-800 text-sm">{rx.title}</p>
                        <p className="text-xs text-stone-600 mt-1">{rx.dosage}</p>
                        <p className="text-[10px] text-stone-400 mt-2 italic">{rx.notes}</p>
                    </div>
                    <button onClick={() => handleDelete('health', rx.id)} className="text-stone-300 hover:text-rose-500 ml-2 h-fit"><Trash2 size={14}/></button>
                 </div>
               ))}
            </div>
         </div>
      </div>
    </div>
  );

  // Add Form Render
  const renderAddForm = () => {
    switch (addType) {
        case 'doc':
            return (
                <div className="space-y-3">
                    <input className="w-full p-2 border rounded" placeholder="Title" value={formData.title || ''} onChange={e => setFormData({...formData, title: e.target.value})} />
                    <input className="w-full p-2 border rounded" placeholder="Type (Insurance, Identity...)" value={formData.type || ''} onChange={e => setFormData({...formData, type: e.target.value})} />
                    <input className="w-full p-2 border rounded" placeholder="Tags (comma separated)" value={formData.tags || ''} onChange={e => setFormData({...formData, tags: e.target.value.split(',')})} />
                    <input className="w-full p-2 border rounded" type="date" placeholder="Expiry" value={formData.expiry || ''} onChange={e => setFormData({...formData, expiry: e.target.value})} />
                    <input className="w-full p-2 border rounded" placeholder="Location" value={formData.location || ''} onChange={e => setFormData({...formData, location: e.target.value})} />
                    <input className="w-full p-2 border rounded" placeholder="Secure Number (optional)" value={formData.number || ''} onChange={e => setFormData({...formData, number: e.target.value, secure: true})} />
                    <button onClick={handleAddSubmit} className="w-full bg-stone-900 text-white p-2 rounded">Save Document</button>
                </div>
            );
        case 'asset':
            return (
                <div className="space-y-3">
                    <input className="w-full p-2 border rounded" placeholder="Asset Name" value={formData.title || ''} onChange={e => setFormData({...formData, title: e.target.value})} />
                    <label className="text-xs text-gray-500">Purchase Date</label>
                    <input className="w-full p-2 border rounded" type="date" value={formData.purchaseDate || ''} onChange={e => setFormData({...formData, purchaseDate: e.target.value})} />
                    <label className="text-xs text-gray-500">Warranty Expiry</label>
                    <input className="w-full p-2 border rounded" type="date" value={formData.warrantyExpiry || ''} onChange={e => setFormData({...formData, warrantyExpiry: e.target.value})} />
                    <button onClick={handleAddSubmit} className="w-full bg-stone-900 text-white p-2 rounded">Save Asset</button>
                </div>
            );
        case 'bill':
            return (
                <div className="space-y-3">
                    <input className="w-full p-2 border rounded" placeholder="Bill Description" value={formData.title || ''} onChange={e => setFormData({...formData, title: e.target.value})} />
                    <input className="w-full p-2 border rounded" type="number" placeholder="Amount" value={formData.amount || ''} onChange={e => setFormData({...formData, amount: e.target.value})} />
                    <label className="text-xs text-gray-500">Due Date</label>
                    <input className="w-full p-2 border rounded" type="date" value={formData.dueDate || ''} onChange={e => setFormData({...formData, dueDate: e.target.value})} />
                    <button onClick={handleAddSubmit} className="w-full bg-stone-900 text-white p-2 rounded">Save Bill</button>
                </div>
            );
        case 'health':
            return (
                <div className="space-y-3">
                    <select className="w-full p-2 border rounded" value={formData.type || ''} onChange={e => setFormData({...formData, type: e.target.value})}>
                        <option value="">Select Type</option>
                        <option value="Vaccination">Vaccination</option>
                        <option value="Prescription">Prescription</option>
                    </select>
                    {formData.type === 'Vaccination' && (
                        <>
                            <input className="w-full p-2 border rounded" placeholder="Vaccine Name" value={formData.value || ''} onChange={e => setFormData({...formData, value: e.target.value})} />
                            <label className="text-xs text-gray-500">Date Administered</label>
                            <input className="w-full p-2 border rounded" type="date" value={formData.date || ''} onChange={e => setFormData({...formData, date: e.target.value})} />
                            <label className="text-xs text-gray-500">Next Due</label>
                            <input className="w-full p-2 border rounded" type="date" value={formData.nextDue || ''} onChange={e => setFormData({...formData, nextDue: e.target.value})} />
                        </>
                    )}
                    {formData.type === 'Prescription' && (
                        <>
                            <input className="w-full p-2 border rounded" placeholder="Medicine Name" value={formData.title || ''} onChange={e => setFormData({...formData, title: e.target.value})} />
                            <input className="w-full p-2 border rounded" placeholder="Dosage" value={formData.dosage || ''} onChange={e => setFormData({...formData, dosage: e.target.value})} />
                            <input className="w-full p-2 border rounded" placeholder="Notes" value={formData.notes || ''} onChange={e => setFormData({...formData, notes: e.target.value})} />
                        </>
                    )}
                    <button onClick={handleAddSubmit} className="w-full bg-stone-900 text-white p-2 rounded">Save Record</button>
                </div>
            );
        default:
            return (
             <div className="grid grid-cols-2 gap-4">
                <button onClick={() => setAddType('doc')} className="flex flex-col items-center justify-center p-6 bg-stone-50 rounded-xl hover:bg-stone-100 transition-colors border border-stone-200">
                   <Files size={32} className="text-teal-500 mb-3" />
                   <span className="font-medium text-stone-700">Scan Document</span>
                </button>
                <button onClick={() => setAddType('asset')} className="flex flex-col items-center justify-center p-6 bg-stone-50 rounded-xl hover:bg-stone-100 transition-colors border border-stone-200">
                   <Armchair size={32} className="text-amber-500 mb-3" />
                   <span className="font-medium text-stone-700">New Asset</span>
                </button>
                <button onClick={() => setAddType('bill')} className="flex flex-col items-center justify-center p-6 bg-stone-50 rounded-xl hover:bg-stone-100 transition-colors border border-stone-200">
                   <CreditCard size={32} className="text-rose-500 mb-3" />
                   <span className="font-medium text-stone-700">Log Expense</span>
                </button>
                <button onClick={() => setAddType('health')} className="flex flex-col items-center justify-center p-6 bg-stone-50 rounded-xl hover:bg-stone-100 transition-colors border border-stone-200">
                   <HeartPulse size={32} className="text-purple-500 mb-3" />
                   <span className="font-medium text-stone-700">Health Record</span>
                </button>
             </div>
            )
    }
  }

  return (
    <div className="flex h-screen bg-stone-50 font-sans text-stone-900 overflow-hidden">

      <aside className="hidden md:flex w-64 flex-col bg-white border-r border-stone-200 h-full">
        <div className="p-6">
          <h1 className="text-xl font-bold tracking-tight text-stone-800 flex items-center gap-2">
            <div className="w-8 h-8 bg-stone-900 rounded-lg flex items-center justify-center text-white"><Armchair size={16} /></div>
            Hearth
          </h1>
        </div>

        <nav className="flex-1 px-4 space-y-1">
          {[
            { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
            { id: 'vault', icon: Files, label: 'Vaults' },
            { id: 'assets', icon: Armchair, label: 'Assets' },
            { id: 'finance', icon: CreditCard, label: 'Finance' },
            { id: 'wellness', icon: HeartPulse, label: 'Wellness' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all ${
                activeTab === item.id
                  ? 'bg-stone-100 text-stone-900'
                  : 'text-stone-500 hover:bg-stone-50 hover:text-stone-700'
              }`}
            >
              <item.icon size={18} strokeWidth={2} className={activeTab === item.id ? 'text-teal-600' : ''} />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-stone-100 space-y-2">
           <button
             onClick={() => setSOSOpen(true)}
             className="w-full flex items-center justify-center gap-2 bg-rose-50 text-rose-600 hover:bg-rose-100 hover:text-rose-700 px-4 py-3 rounded-xl text-sm font-bold transition-colors"
           >
             <Siren size={18} /> Emergency SOS
           </button>
           <button onClick={logout} className="w-full flex items-center justify-center gap-2 text-stone-500 hover:text-stone-800 px-4 py-2 text-xs">
              <LogOut size={14} /> Sign Out
           </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        <header className="h-16 flex items-center justify-between px-6 bg-white/80 backdrop-blur-md border-b border-stone-200 z-10 sticky top-0">
          <div className="relative w-full max-w-md hidden sm:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={16} />
            <input
              type="text"
              placeholder="Search documents, warranties, bills (Cmd+K)..."
              className="w-full pl-10 pr-4 py-2 bg-stone-100 border-none rounded-xl text-sm focus:ring-2 focus:ring-teal-500/20 focus:bg-white transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-4">
             <div className="flex items-center gap-2 bg-stone-100 p-1 rounded-full">
                {data.users.map(u => (
                  <button
                    key={u.id}
                    onClick={() => setActiveUser(u)}
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm transition-all ${activeUser?.id === u.id ? 'bg-white shadow-sm scale-110' : 'opacity-50 hover:opacity-100'}`}
                    title={u.name}
                  >
                    {u.avatar}
                  </button>
                ))}
             </div>
             <button className="relative p-2 text-stone-400 hover:text-stone-600">
               <Bell size={20} />
               {urgentItems.length > 0 && <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full border border-white"></span>}
             </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6 scroll-smooth">
           <div className="max-w-5xl mx-auto pb-20 md:pb-0">
             {activeTab === 'dashboard' && renderDashboard()}
             {activeTab === 'vault' && renderVault()}
             {activeTab === 'assets' && renderAssets()}
             {activeTab === 'finance' && renderFinance()}
             {activeTab === 'wellness' && renderWellness()}
           </div>
        </div>

        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-stone-200 p-2 flex justify-around z-20 pb-safe">
          {[
            { id: 'dashboard', icon: LayoutDashboard },
            { id: 'vault', icon: Files },
            { id: 'assets', icon: Armchair },
            { id: 'finance', icon: CreditCard },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`p-3 rounded-xl ${activeTab === item.id ? 'bg-stone-100 text-teal-700' : 'text-stone-400'}`}
            >
              <item.icon size={22} />
            </button>
          ))}
           <button onClick={() => setSOSOpen(true)} className="p-3 rounded-xl bg-rose-50 text-rose-600"><Siren size={22} /></button>
        </div>
      </main>

      <Modal isOpen={isSOSOpen} onClose={() => setSOSOpen(false)} title="Emergency Protocol">
         <div className="space-y-6">
            <div className="bg-rose-50 border border-rose-100 p-4 rounded-xl text-center">
              <h4 className="text-rose-700 font-bold text-lg mb-1">House Flood / Fire</h4>
              <p className="text-rose-600 font-mono text-xl">080-100-2000</p>
            </div>

            <div>
               <h4 className="font-semibold text-stone-700 mb-2">Primary Contacts</h4>
               <div className="space-y-2">
                 {data.emergency.contacts.map((c, i) => (
                   <div key={i} className="flex justify-between items-center bg-stone-50 p-3 rounded-lg">
                      <span className="text-sm font-medium text-stone-800">{c.name}</span>
                      <a href={`tel:${c.number}`} className="text-teal-600 font-mono text-sm font-bold bg-white px-2 py-1 rounded shadow-sm border border-stone-100">{c.number}</a>
                   </div>
                 ))}
               </div>
            </div>

            <div className="p-4 bg-stone-800 text-stone-200 rounded-xl">
               <h4 className="text-xs uppercase tracking-widest text-stone-400 mb-1">Health Insurance Policy</h4>
               <p className="font-mono text-lg">{data.emergency.insurance || 'Not Set'}</p>
            </div>
         </div>
      </Modal>

      <Modal isOpen={isQuickAddOpen} onClose={() => { setQuickAddOpen(false); setAddType(null); setFormData({}); }} title={addType ? "Add Detail" : "Add to Hearth"}>
         {renderAddForm()}
      </Modal>

    </div>
  );
}
