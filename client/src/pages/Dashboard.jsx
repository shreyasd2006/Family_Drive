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
  Trash2,
  MapPin,
  ScanLine,
  Upload,
  RefreshCw,
  X
} from 'lucide-react';
import { createWorker } from 'tesseract.js';
import * as pdfjsLib from 'pdfjs-dist';
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;
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
    emergency: { contacts: [], insurance: '' },
    vehicles: [],
    properties: [],
    subscriptions: [],
    householdName: ''
  });
  const [loading, setLoading] = useState(true);
  const [activeUser, setActiveUser] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchOverlay, setShowSearchOverlay] = useState(true);
  const [isNotificationsOpen, setNotificationsOpen] = useState(false);
  const [isSOSOpen, setSOSOpen] = useState(false);
  const [isQuickAddOpen, setQuickAddOpen] = useState(false);
  const [travelMode, setTravelMode] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [addType, setAddType] = useState(null); // 'doc', 'asset', 'bill', 'health', 'scan', 'vehicle', 'property', 'subscription'
  const [financeTab, setFinanceTab] = useState('bills'); // 'bills' or 'subscriptions'

  // OCR State
  const [isScanning, setIsScanning] = useState(false);
  const [scanStep, setScanStep] = useState('upload'); // 'upload', 'processing', 'review'
  const [scannedImage, setScannedImage] = useState(null);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanResult, setScanResult] = useState(null);

  // Invite State
  const [inviteCode, setInviteCode] = useState(null);
  const [inviteExpires, setInviteExpires] = useState(null);
  const [isInviteModalOpen, setInviteModalOpen] = useState(false);

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

  useEffect(() => {
    if (searchQuery) {
      setShowSearchOverlay(true);
    }
  }, [searchQuery]);

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
      const payload = { ...formData };
      if (!payload.userId) {
        payload.userId = currentUser._id;
      }

      let endpoint = '';
      if (addType === 'doc') endpoint = '/documents';
      if (addType === 'asset') endpoint = '/assets';
      if (addType === 'bill') endpoint = '/bills';
      if (addType === 'health') endpoint = '/health';
      if (addType === 'vehicle') endpoint = '/vehicles';
      if (addType === 'property') endpoint = '/properties';
      if (addType === 'subscription') endpoint = '/subscriptions';

      if (addType === 'subscription' && payload.id) {
        await api.put(`${endpoint}/${payload.id}`, payload);
      } else {
        await api.post(endpoint, payload);
      }

      setQuickAddOpen(false);
      setAddType(null);
      setFormData({});
      fetchData();
    } catch (err) {
      alert('Failed to add item: ' + err.message);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setScanStep('processing');
    setIsScanning(true);
    setScanProgress(0);

    try {
      let imageUrl = '';

      if (file.type === 'application/pdf') {
        // Convert PDF to Image
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        const page = await pdf.getPage(1);
        const viewport = page.getViewport({ scale: 1.5 });
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        await page.render({ canvasContext: context, viewport: viewport }).promise;
        imageUrl = canvas.toDataURL('image/png');
      } else {
        imageUrl = URL.createObjectURL(file);
      }

      // Perform OCR
      const worker = await createWorker('eng');
      const { data: { text } } = await worker.recognize(imageUrl);
      await worker.terminate();

      const lines = text.split('\n').filter(line => line.trim() !== '');

      // Attempt to find title
      const titleGuess = lines[0] || 'Untitled Scan';

      // Attempt to find date
      const dateRegex = /(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})|(\d{4}[-/]\d{1,2}[-/]\d{1,2})/;
      const dateMatch = text.match(dateRegex);
      let dateGuess = '';
      if (dateMatch) {
        const parsedDate = new Date(dateMatch[0]);
        if (!isNaN(parsedDate.getTime())) {
          dateGuess = parsedDate.toISOString().split('T')[0];
        }
      }

      // Attempt to find amount (for bills)
      const amountRegex = /[\$£€₹]\s?(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/;
      const amountMatch = text.match(amountRegex);
      const amountGuess = amountMatch ? amountMatch[1].replace(/,/g, '') : '';

      setFormData({
        title: titleGuess,
        date: dateGuess,
        amount: amountGuess,
        userId: currentUser._id, // Default to personal
        typeSelector: 'doc' // Default type
      });

      setScanResult(text);
      setScanStep('review');
      setIsScanning(false);

    } catch (err) {
      console.error(err);
      alert('Scan failed: ' + err.message);
      setScanStep('upload');
      setIsScanning(false);
    }
  };

  const handleGenerateInvite = async () => {
    try {
      const res = await api.post('/invitations');
      setInviteCode(res.data.code);
      setInviteExpires(res.data.expiresAt);
      setInviteModalOpen(true);
    } catch (err) {
      alert('Failed to generate invite: ' + err.message);
    }
  };

  const handleScanAccept = () => {
    // Determine type and save
    if (formData.typeSelector) {
      setAddType(formData.typeSelector);
    } else {
      setAddType('doc');
    }
    // Form data is already set, just switching view to the specific add form
    // The user can then review and hit save
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
    // Sort: Personal first, then Family
    return docs.sort((a, b) => {
      if (a.userId === currentUser._id && b.userId !== currentUser._id) return -1;
      if (a.userId !== currentUser._id && b.userId === currentUser._id) return 1;
      return 0;
    });
  }, [data.docs, activeUser, searchQuery, travelMode, currentUser._id]);

  const filteredAssets = useMemo(() => {
    if (!activeUser) return [];
    let assets = data.assets.filter(a =>
      (a.userId === activeUser.id || activeUser.id === 'family' || a.userId === 'family') &&
      a.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
    return assets.sort((a, b) => {
      if (a.userId === currentUser._id && b.userId !== currentUser._id) return -1;
      if (a.userId !== currentUser._id && b.userId === currentUser._id) return 1;
      return 0;
    });
  }, [data.assets, searchQuery, activeUser, currentUser._id]);

  const filteredBills = useMemo(() => {
    if (!activeUser) return [];
    let bills = data.bills.filter(b =>
      (b.user === activeUser.id || activeUser.id === 'family' || b.user === 'family') && // Note: Bill uses 'user' field in schema, check if consistent
      b.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
    return bills.sort((a, b) => {
      if (a.user === currentUser._id && b.user !== currentUser._id) return -1;
      if (a.user !== currentUser._id && b.user === currentUser._id) return 1;
      return 0;
    });
  }, [data.bills, searchQuery, activeUser, currentUser._id]);

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
            <div
              key={i}
              onClick={() => setActiveTab(item.type === 'bill' ? 'finance' : 'assets')}
              className="flex items-start gap-3 bg-white p-4 rounded-xl border border-stone-100 shadow-sm hover:shadow-md transition-all cursor-pointer hover:border-teal-500/30 group"
            >
              <div className={`p-2 rounded-full ${item.type === 'bill' ? 'bg-rose-50 text-rose-600' : 'bg-amber-50 text-amber-600'} group-hover:scale-110 transition-transform`}>
                {item.type === 'bill' ? <CreditCard size={18} /> : <ShieldCheck size={18} />}
              </div>
              <div>
                <h4 className="font-medium text-stone-800 text-sm group-hover:text-teal-700 transition-colors">{item.title}</h4>
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

      <div className="bg-white p-6 rounded-2xl border border-stone-100 shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold text-stone-700">My Family: {data.householdName}</h3>
          <button onClick={handleGenerateInvite} className="text-xs font-medium text-teal-600 hover:text-teal-700 flex items-center gap-1 bg-teal-50 px-2 py-1 rounded-lg transition-colors">
            <Plus size={14} /> Invite Member
          </button>
        </div>
        <div className="flex flex-wrap gap-6">
          {data.users.filter(u => u.id !== 'family').map(u => (
            <div key={u.id} className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 rounded-full bg-stone-100 border-2 border-white shadow-sm flex items-center justify-center text-xl text-stone-600 font-serif">
                {u.name ? u.name.charAt(0) : '?'}
              </div>
              <span className="text-xs font-medium text-stone-600">{u.name}</span>
            </div>
          ))}
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
          <button onClick={() => { setQuickAddOpen(true); setAddType(null); setFormData({ userId: currentUser._id }); }} className="w-full text-left px-4 py-3 rounded-xl bg-stone-50 hover:bg-stone-100 transition-colors flex items-center gap-3 text-sm text-stone-600 font-medium group">
            <div className="bg-white p-1.5 rounded-lg shadow-sm group-hover:scale-110 transition-transform"><Plus size={16} className="text-teal-600" /></div>
            Add New Item
          </button>
          <button onClick={() => { setQuickAddOpen(true); setAddType('scan'); setScanStep('upload'); setFormData({ userId: currentUser._id }); }} className="w-full text-left px-4 py-3 rounded-xl bg-stone-50 hover:bg-stone-100 transition-colors flex items-center gap-3 text-sm text-stone-600 font-medium group">
            <div className="bg-white p-1.5 rounded-lg shadow-sm group-hover:scale-110 transition-transform"><ScanLine size={16} className="text-teal-600" /></div>
            Smart Scan Document/Bill
          </button>
        </div>
      </div>
    </div>
  );

  const renderVault = () => (
    <div className="space-y-6 animate-in fade-in duration-300 mt-6">
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
              {doc.userId === 'family' && (
                <div className={`absolute top-0 ${daysLeft < 45 || isExpired ? 'right-24' : 'right-0'} bg-indigo-50 text-indigo-600 text-[10px] font-bold px-2 py-1 rounded-bl-lg border-l border-b border-indigo-100 flex items-center gap-1`}>
                  <Users size={10} /> FAMILY
                </div>
              )}

              <div className="flex justify-between items-start mb-4">
                <div className="p-2 bg-stone-50 rounded-lg text-stone-400 group-hover:text-teal-600 transition-colors">
                  <Files size={20} />
                </div>
                <div className="flex gap-1">
                  {doc.tags.map(t => <span key={t} className="text-[10px] uppercase tracking-wider text-stone-400 bg-stone-50 px-1.5 py-0.5 rounded-md">{t}</span>)}
                </div>
                <button onClick={() => handleDelete('documents', doc.id)} className="text-stone-300 hover:text-rose-500"><Trash2 size={14} /></button>
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
                    <button onClick={() => handleDelete('assets', asset.id)} className="text-stone-300 hover:text-rose-500 ml-2"><Trash2 size={16} /></button>
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
                <h4 className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-3 flex items-center gap-2"><History size={12} /> Service Log</h4>
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

  const renderVehicles = () => (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-serif text-stone-800">Vehicles</h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {data.vehicles.map(vehicle => (
          <div key={vehicle.id} className="bg-white rounded-xl border border-stone-200 p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Plane size={20} /></div> {/* Using Plane as placeholder icon for Vehicle */}
                <h3 className="font-semibold text-stone-800 text-lg">{vehicle.number}</h3>
              </div>
              <button onClick={() => handleDelete('vehicles', vehicle.id)} className="text-stone-300 hover:text-rose-500"><Trash2 size={16} /></button>
            </div>
            <div className="space-y-2">
              {vehicle.customFields && vehicle.customFields.map((field, idx) => (
                <div key={idx} className="flex justify-between text-sm">
                  <span className="text-stone-500">{field.label}</span>
                  <span className="font-medium text-stone-800">{field.value}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
        {data.vehicles.length === 0 && <p className="text-stone-400 italic">No vehicles added.</p>}
      </div>
    </div>
  );

  const renderProperties = () => (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-serif text-stone-800">Properties</h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {data.properties.map(property => (
          <div key={property.id} className="bg-white rounded-xl border border-stone-200 p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-50 text-amber-600 rounded-lg"><MapPin size={20} /></div>
                <h3 className="font-semibold text-stone-800 text-lg">{property.name}</h3>
              </div>
              <button onClick={() => handleDelete('properties', property.id)} className="text-stone-300 hover:text-rose-500"><Trash2 size={16} /></button>
            </div>
            <div className="space-y-2">
              {property.customFields && property.customFields.map((field, idx) => (
                <div key={idx} className="flex justify-between text-sm">
                  <span className="text-stone-500">{field.label}</span>
                  <span className="font-medium text-stone-800">{field.value}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
        {data.properties.length === 0 && <p className="text-stone-400 italic">No properties added.</p>}
      </div>
    </div>
  );

  const renderFinance = () => (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-serif text-stone-800">Financial Control</h2>
        <div className="flex items-center gap-3">
          {financeTab === 'subscriptions' && (
            <button onClick={() => { setAddType('subscription'); setQuickAddOpen(true); }} className="flex items-center gap-1 text-sm font-medium text-teal-600 hover:text-teal-700 bg-teal-50 px-3 py-1.5 rounded-lg transition-colors">
              <Plus size={16} /> Add Subscription
            </button>
          )}
          <div className="flex gap-2">
            <button onClick={() => setFinanceTab('bills')} className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${financeTab === 'bills' ? 'bg-stone-800 text-white' : 'text-stone-500 hover:bg-stone-100'}`}>Bills</button>
            <button onClick={() => setFinanceTab('subscriptions')} className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${financeTab === 'subscriptions' ? 'bg-stone-800 text-white' : 'text-stone-500 hover:bg-stone-100'}`}>Subscriptions</button>
          </div>
        </div>
      </div>

      {financeTab === 'bills' ? (
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
                    <button onClick={() => handleDelete('bills', bill.id)} className="text-stone-300 hover:text-rose-500"><Trash2 size={16} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-white border border-stone-200 rounded-xl overflow-hidden shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-stone-50 text-stone-500 border-b border-stone-200">
              <tr>
                <th className="px-6 py-4 font-medium">Name</th>
                <th className="px-6 py-4 font-medium">Amount</th>
                <th className="px-6 py-4 font-medium">Billing Cycle</th>
                <th className="px-6 py-4 font-medium">Next Billing</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {data.subscriptions.map(sub => (
                <tr key={sub.id} className="hover:bg-stone-50/50 transition-colors">
                  <td className="px-6 py-4 font-medium text-stone-800">{sub.name}</td>
                  <td className="px-6 py-4 font-mono">₹{sub.amount.toLocaleString()}</td>
                  <td className="px-6 py-4 capitalize">{sub.billingCycle}</td>
                  <td className="px-6 py-4">{sub.nextBillingDate}</td>
                  <td className="px-6 py-4">
                    <StatusBadge type={sub.status === 'active' ? 'success' : 'neutral'} text={sub.status} />
                  </td>
                  <td className="px-6 py-4 text-right flex gap-2 justify-end">
                    <button onClick={() => {
                      setAddType('subscription');
                      setFormData(sub); // Populate for edit
                      setQuickAddOpen(true);
                    }} className="text-stone-300 hover:text-teal-500">Edit</button>
                    <button onClick={() => handleDelete('subscriptions', sub.id)} className="text-stone-300 hover:text-rose-500"><Trash2 size={16} /></button>
                  </td>
                </tr>
              ))}
              {data.subscriptions.length === 0 && (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-stone-400 italic">No subscriptions tracked yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
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
          <h3 className="font-semibold text-stone-700 mb-4 flex items-center gap-2"><ShieldCheck size={18} className="text-teal-600" /> Vaccinations</h3>
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
                <button onClick={() => handleDelete('health', vac.id)} className="text-stone-300 hover:text-rose-500 ml-2"><Trash2 size={14} /></button>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-sm">
          <h3 className="font-semibold text-stone-700 mb-4 flex items-center gap-2"><Files size={18} className="text-amber-500" /> Active Prescriptions</h3>
          <div className="space-y-3">
            {data.health.filter(h => h.type === 'Prescription').map(rx => (
              <div key={rx.id} className="p-3 bg-stone-50 rounded-lg border-l-4 border-amber-400 flex justify-between">
                <div>
                  <p className="font-medium text-stone-800 text-sm">{rx.title}</p>
                  <p className="text-xs text-stone-600 mt-1">{rx.dosage}</p>
                  <p className="text-[10px] text-stone-400 mt-2 italic">{rx.notes}</p>
                </div>
                <button onClick={() => handleDelete('health', rx.id)} className="text-stone-300 hover:text-rose-500 ml-2 h-fit"><Trash2 size={14} /></button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  // Add Form Render
  const renderAddForm = () => {
    // Common fields rendering...
    const commonFields = (
      <div className="mb-3">
        <label className="text-xs text-stone-500 mb-1 block">Assign To</label>
        <div className="flex bg-stone-100 p-1 rounded-lg">
          <button
            onClick={() => setFormData({ ...formData, userId: currentUser._id })}
            className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${!formData.userId || formData.userId === currentUser._id ? 'bg-white shadow-sm text-stone-800' : 'text-stone-500 hover:text-stone-700'}`}
          >
            Me (Personal)
          </button>
          <button
            onClick={() => setFormData({ ...formData, userId: 'family' })}
            className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${formData.userId === 'family' ? 'bg-white shadow-sm text-stone-800' : 'text-stone-500 hover:text-stone-700'}`}
          >
            Family (Shared)
          </button>
        </div>
      </div>
    );

    if (addType === 'scan') {
      return (
        <div className="space-y-6">
          {scanStep === 'upload' && (
            <div className="border-2 border-dashed border-stone-200 rounded-xl p-8 flex flex-col items-center justify-center text-center hover:bg-stone-50 transition-colors relative">
              <input
                type="file"
                accept="image/*,application/pdf"
                onChange={handleFileUpload}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
              <div className="w-16 h-16 bg-teal-50 text-teal-600 rounded-full flex items-center justify-center mb-4">
                <ScanLine size={32} />
              </div>
              <h3 className="text-lg font-semibold text-stone-800">Smart Scan</h3>
              <p className="text-sm text-stone-500 mt-1">Upload a Document, Bill, or Warranty (Image or PDF)</p>
              <button className="mt-4 bg-stone-900 text-white px-4 py-2 rounded-lg text-sm font-medium">Select File</button>
            </div>
          )}

          {scanStep === 'processing' && (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="animate-spin text-teal-600 mb-4" size={48} />
              <h3 className="text-lg font-semibold text-stone-800">Scanning Document...</h3>
              <p className="text-stone-500 text-sm mt-1">Extracting text and details ({scanProgress}%)</p>
            </div>
          )}

          {scanStep === 'review' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="border border-stone-200 rounded-xl overflow-hidden bg-stone-100 flex items-center justify-center max-h-[400px]">
                {scannedImage && <img src={scannedImage} alt="Scanned" className="max-w-full max-h-full object-contain" />}
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-stone-500 uppercase tracking-wider">Detected Type</label>
                  <select
                    className="w-full mt-1 p-2 border rounded-lg bg-white"
                    value={formData.typeSelector || 'doc'}
                    onChange={e => setFormData({ ...formData, typeSelector: e.target.value })}
                  >
                    <option value="doc">Document</option>
                    <option value="bill">Bill / Expense</option>
                    <option value="asset">Asset / Warranty</option>
                    <option value="health">Health Record</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-medium text-stone-500 uppercase tracking-wider">Extracted Title</label>
                  <input
                    className="w-full mt-1 p-2 border rounded-lg"
                    value={formData.title || ''}
                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-stone-500 uppercase tracking-wider">Date</label>
                    <input
                      type="date"
                      className="w-full mt-1 p-2 border rounded-lg"
                      value={formData.date || ''}
                      onChange={e => setFormData({ ...formData, date: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-stone-500 uppercase tracking-wider">Amount</label>
                    <input
                      type="number"
                      className="w-full mt-1 p-2 border rounded-lg"
                      value={formData.amount || ''}
                      onChange={e => setFormData({ ...formData, amount: e.target.value })}
                    />
                  </div>
                </div>

                <div className="pt-4 flex gap-2">
                  <button
                    onClick={() => setScanStep('upload')}
                    className="flex-1 py-2 border border-stone-200 rounded-lg text-stone-600 hover:bg-stone-50 text-sm font-medium"
                  >
                    Try Again
                  </button>
                  <button
                    onClick={handleScanAccept}
                    className="flex-[2] py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 text-sm font-medium"
                  >
                    Looks Good, Continue
                  </button>
                </div>
                <button
                  onClick={() => { setAddType('doc'); setFormData({}); }}
                  className="w-full text-xs text-stone-400 hover:text-stone-600 underline"
                >
                  Switch to Manual Entry
                </button>
              </div>
            </div>
          )}
        </div>
      );
    }

    switch (addType) {
      case 'doc':
        return (
          <div className="space-y-3">
            {commonFields}
            <input className="w-full p-2 border rounded" placeholder="Title" value={formData.title || ''} onChange={e => setFormData({ ...formData, title: e.target.value })} />
            <input className="w-full p-2 border rounded" placeholder="Type (Insurance, Identity...)" value={formData.type || ''} onChange={e => setFormData({ ...formData, type: e.target.value })} />
            <input className="w-full p-2 border rounded" placeholder="Tags (comma separated)" value={formData.tags || ''} onChange={e => setFormData({ ...formData, tags: e.target.value.split(',') })} />
            <input className="w-full p-2 border rounded" type="date" placeholder="Expiry" value={formData.expiry || ''} onChange={e => setFormData({ ...formData, expiry: e.target.value })} />
            <input className="w-full p-2 border rounded" placeholder="Location" value={formData.location || ''} onChange={e => setFormData({ ...formData, location: e.target.value })} />
            <input className="w-full p-2 border rounded" placeholder="Secure Number (optional)" value={formData.number || ''} onChange={e => setFormData({ ...formData, number: e.target.value, secure: true })} />
            <button onClick={handleAddSubmit} className="w-full bg-stone-900 text-white p-2 rounded">Save Document</button>
          </div>
        );
      case 'asset':
        return (
          <div className="space-y-3">
            {commonFields}
            <input className="w-full p-2 border rounded" placeholder="Asset Name" value={formData.title || ''} onChange={e => setFormData({ ...formData, title: e.target.value })} />
            <label className="text-xs text-gray-500">Purchase Date</label>
            <input className="w-full p-2 border rounded" type="date" value={formData.purchaseDate || ''} onChange={e => setFormData({ ...formData, purchaseDate: e.target.value })} />
            <label className="text-xs text-gray-500">Warranty Expiry</label>
            <input className="w-full p-2 border rounded" type="date" value={formData.warrantyExpiry || ''} onChange={e => setFormData({ ...formData, warrantyExpiry: e.target.value })} />
            <button onClick={handleAddSubmit} className="w-full bg-stone-900 text-white p-2 rounded">Save Asset</button>
          </div>
        );
      case 'bill':
        return (
          <div className="space-y-3">
            {commonFields}
            <input className="w-full p-2 border rounded" placeholder="Bill Description" value={formData.title || ''} onChange={e => setFormData({ ...formData, title: e.target.value })} />
            <input className="w-full p-2 border rounded" type="number" placeholder="Amount" value={formData.amount || ''} onChange={e => setFormData({ ...formData, amount: e.target.value })} />
            <label className="text-xs text-gray-500">Due Date</label>
            <input className="w-full p-2 border rounded" type="date" value={formData.dueDate || ''} onChange={e => setFormData({ ...formData, dueDate: e.target.value })} />
            <button onClick={handleAddSubmit} className="w-full bg-stone-900 text-white p-2 rounded">Save Bill</button>
          </div>
        );
      case 'health':
        return (
          <div className="space-y-3">
            {commonFields}
            <select className="w-full p-2 border rounded" value={formData.type || ''} onChange={e => setFormData({ ...formData, type: e.target.value })}>
              <option value="">Select Type</option>
              <option value="Vaccination">Vaccination</option>
              <option value="Prescription">Prescription</option>
            </select>
            {formData.type === 'Vaccination' && (
              <>
                <input className="w-full p-2 border rounded" placeholder="Vaccine Name" value={formData.value || ''} onChange={e => setFormData({ ...formData, value: e.target.value })} />
                <label className="text-xs text-gray-500">Date Administered</label>
                <input className="w-full p-2 border rounded" type="date" value={formData.date || ''} onChange={e => setFormData({ ...formData, date: e.target.value })} />
                <label className="text-xs text-gray-500">Next Due Date</label>
                <input className="w-full p-2 border rounded" type="date" value={formData.nextDue || ''} onChange={e => setFormData({ ...formData, nextDue: e.target.value })} />
              </>
            )}
            {formData.type === 'Prescription' && (
              <>
                <input className="w-full p-2 border rounded" placeholder="Medication Name" value={formData.title || ''} onChange={e => setFormData({ ...formData, title: e.target.value })} />
                <input className="w-full p-2 border rounded" placeholder="Dosage (e.g. 10mg)" value={formData.dosage || ''} onChange={e => setFormData({ ...formData, dosage: e.target.value })} />
                <textarea className="w-full p-2 border rounded" placeholder="Notes / Instructions" value={formData.notes || ''} onChange={e => setFormData({ ...formData, notes: e.target.value })} />
              </>
            )}
            <button onClick={handleAddSubmit} className="w-full bg-stone-900 text-white p-2 rounded">Save Health Record</button>
          </div>
        );
      case 'vehicle':
        return (
          <div className="space-y-3">
            {commonFields}
            <input className="w-full p-2 border rounded" placeholder="Vehicle Number" value={formData.number || ''} onChange={e => setFormData({ ...formData, number: e.target.value })} />

            <div className="space-y-2">
              <label className="text-xs font-medium text-stone-500">Custom Fields</label>
              {(formData.customFields || []).map((field, idx) => (
                <div key={idx} className="flex gap-2">
                  <input className="flex-1 p-2 border rounded text-sm" placeholder="Label" value={field.label} onChange={e => {
                    const newFields = [...(formData.customFields || [])];
                    newFields[idx].label = e.target.value;
                    setFormData({ ...formData, customFields: newFields });
                  }} />
                  <input className="flex-1 p-2 border rounded text-sm" placeholder="Value" value={field.value} onChange={e => {
                    const newFields = [...(formData.customFields || [])];
                    newFields[idx].value = e.target.value;
                    setFormData({ ...formData, customFields: newFields });
                  }} />
                  <button onClick={() => {
                    const newFields = formData.customFields.filter((_, i) => i !== idx);
                    setFormData({ ...formData, customFields: newFields });
                  }} className="text-rose-500"><X size={16} /></button>
                </div>
              ))}
              <button onClick={() => setFormData({ ...formData, customFields: [...(formData.customFields || []), { label: '', value: '' }] })} className="text-xs text-teal-600 font-medium">+ Add Field</button>
            </div>

            <button onClick={handleAddSubmit} className="w-full bg-stone-900 text-white p-2 rounded">Save Vehicle</button>
          </div>
        );
      case 'property':
        return (
          <div className="space-y-3">
            {commonFields}
            <input className="w-full p-2 border rounded" placeholder="Property Name" value={formData.name || ''} onChange={e => setFormData({ ...formData, name: e.target.value })} />

            <div className="space-y-2">
              <label className="text-xs font-medium text-stone-500">Custom Fields</label>
              {(formData.customFields || []).map((field, idx) => (
                <div key={idx} className="flex gap-2">
                  <input className="flex-1 p-2 border rounded text-sm" placeholder="Label" value={field.label} onChange={e => {
                    const newFields = [...(formData.customFields || [])];
                    newFields[idx].label = e.target.value;
                    setFormData({ ...formData, customFields: newFields });
                  }} />
                  <input className="flex-1 p-2 border rounded text-sm" placeholder="Value" value={field.value} onChange={e => {
                    const newFields = [...(formData.customFields || [])];
                    newFields[idx].value = e.target.value;
                    setFormData({ ...formData, customFields: newFields });
                  }} />
                  <button onClick={() => {
                    const newFields = formData.customFields.filter((_, i) => i !== idx);
                    setFormData({ ...formData, customFields: newFields });
                  }} className="text-rose-500"><X size={16} /></button>
                </div>
              ))}
              <button onClick={() => setFormData({ ...formData, customFields: [...(formData.customFields || []), { label: '', value: '' }] })} className="text-xs text-teal-600 font-medium">+ Add Field</button>
            </div>

            <button onClick={handleAddSubmit} className="w-full bg-stone-900 text-white p-2 rounded">Save Property</button>
          </div>
        );
      case 'subscription':
        return (
          <div className="space-y-3">
            {commonFields}
            <input className="w-full p-2 border rounded" placeholder="Subscription Name" value={formData.name || ''} onChange={e => setFormData({ ...formData, name: e.target.value })} />
            <input className="w-full p-2 border rounded" type="number" placeholder="Amount" value={formData.amount || ''} onChange={e => setFormData({ ...formData, amount: e.target.value })} />
            <select className="w-full p-2 border rounded" value={formData.billingCycle || 'monthly'} onChange={e => setFormData({ ...formData, billingCycle: e.target.value })}>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </select>
            <label className="text-xs text-gray-500">Next Billing Date</label>
            <input className="w-full p-2 border rounded" type="date" value={formData.nextBillingDate || ''} onChange={e => setFormData({ ...formData, nextBillingDate: e.target.value })} />
            <select className="w-full p-2 border rounded" value={formData.status || 'active'} onChange={e => setFormData({ ...formData, status: e.target.value })}>
              <option value="active">Active</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <button onClick={handleAddSubmit} className="w-full bg-stone-900 text-white p-2 rounded">Save Subscription</button>
          </div>
        );
      default:
        return (
          <div className="grid grid-cols-2 gap-4">
            <button onClick={() => { setAddType('scan'); setScanStep('upload'); setFormData({}); }} className="col-span-2 flex flex-row items-center justify-center gap-4 p-6 bg-gradient-to-r from-teal-50 to-emerald-50 rounded-xl hover:from-teal-100 hover:to-emerald-100 transition-colors border border-teal-100 group">
              <div className="p-3 bg-white rounded-full shadow-sm text-teal-600 group-hover:scale-110 transition-transform">
                <ScanLine size={24} />
              </div>
              <div className="text-left">
                <span className="font-bold text-teal-900 block text-lg">Smart Scan</span>
                <span className="text-teal-700/70 text-sm">Auto-fill from Image or PDF</span>
              </div>
            </button>

            <button onClick={() => setAddType('doc')} className="flex flex-col items-center justify-center p-6 bg-stone-50 rounded-xl hover:bg-stone-100 transition-colors border border-stone-200">
              <Files size={32} className="text-stone-400 mb-3" />
              <span className="font-medium text-stone-700">Manual Document</span>
              <MapPin size={32} className="text-green-500 mb-3" />
              <span className="font-medium text-stone-700">Add Property</span>
            </button>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 font-sans text-stone-900 flex">
      {/* Sidebar */}
      <aside className="w-20 lg:w-64 bg-white border-r border-stone-200 flex flex-col fixed h-full z-20 transition-all duration-300">
        <div className="p-6 flex items-center gap-3">
          <div className="w-8 h-8 bg-stone-900 rounded-lg flex items-center justify-center text-white font-serif font-bold text-xl">H</div>
          <span className="font-serif text-xl font-bold tracking-tight hidden lg:block">Hearth</span>
        </div>

        <nav className="flex-1 px-4 space-y-2 mt-6">
          {[
            { id: 'dashboard', icon: LayoutDashboard, label: 'Overview' },
            { id: 'vault', icon: Files, label: 'Vault' },
            { id: 'assets', icon: Armchair, label: 'Assets' },
            { id: 'finance', icon: CreditCard, label: 'Finance' },
            { id: 'wellness', icon: HeartPulse, label: 'Wellness' },
            { id: 'vehicles', icon: Plane, label: 'Vehicles' },
            { id: 'properties', icon: MapPin, label: 'Properties' },
          ].map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${activeTab === item.id ? 'bg-stone-900 text-white shadow-md' : 'text-stone-500 hover:bg-stone-50 hover:text-stone-900'}`}
            >
              <item.icon size={20} className={activeTab === item.id ? 'text-white' : 'text-stone-400 group-hover:text-stone-900'} />
              <span className="font-medium text-sm hidden lg:block">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-stone-100">
          <button onClick={logout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-stone-400 hover:bg-rose-50 hover:text-rose-600 transition-colors">
            <LogOut size={20} />
            <span className="font-medium text-sm hidden lg:block">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-20 lg:ml-64 p-4 lg:p-8 overflow-y-auto h-screen">
        {/* Header */}
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-serif font-bold text-stone-800 capitalize">{activeTab}</h1>
            <p className="text-stone-500 text-sm">{data.householdName}</p>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
              <input
                type="text"
                placeholder="Search anything..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 bg-white border border-stone-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 w-64 transition-all focus:w-80"
              />
            </div>

            <button
              onClick={() => setNotificationsOpen(!isNotificationsOpen)}
              className="relative p-2 bg-white border border-stone-200 rounded-full text-stone-500 hover:text-stone-900 transition-colors"
            >
              <Bell size={20} />
              {urgentItems.length > 0 && (
                <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-white"></span>
              )}

              {isNotificationsOpen && (
                <div className="absolute top-full right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-stone-100 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                  <div className="p-3 border-b border-stone-100 bg-stone-50">
                    <h4 className="font-semibold text-stone-700 text-sm">Notifications</h4>
                  </div>
                  <div className="max-h-[300px] overflow-y-auto">
                    {urgentItems.length > 0 ? (
                      urgentItems.map((item, i) => (
                        <div
                          key={i}
                          onClick={() => {
                            setActiveTab(item.type === 'bill' ? 'finance' : 'assets');
                            setNotificationsOpen(false);
                          }}
                          className="p-3 border-b border-stone-50 hover:bg-stone-50 cursor-pointer transition-colors flex items-start gap-3"
                        >
                          <div className={`p-2 rounded-full shrink-0 ${item.type === 'bill' ? 'bg-rose-50 text-rose-600' : 'bg-amber-50 text-amber-600'}`}>
                            {item.type === 'bill' ? <CreditCard size={16} /> : <ShieldCheck size={16} />}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-stone-800">{item.title}</p>
                            <p className="text-xs text-stone-500">{item.msg}</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-8 text-center text-stone-400">
                        <Bell size={24} className="mx-auto mb-2 opacity-20" />
                        <p className="text-xs">No new notifications</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </button>

            <div className="flex items-center gap-3 pl-4 border-l border-stone-200">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-stone-800">{currentUser?.name}</p>
                <p className="text-xs text-stone-500 capitalize">{currentUser?.role}</p>
              </div>
              <div className="w-10 h-10 bg-stone-200 rounded-full overflow-hidden border-2 border-white shadow-sm">
                <div className="w-full h-full flex items-center justify-center bg-stone-800 text-white font-medium">
                  {currentUser?.name?.charAt(0)}
                </div>
              </div>
            </div>
          </div>
        </header>

        {searchQuery && showSearchOverlay ? (
          <div className="space-y-8 animate-in fade-in duration-300 p-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-serif text-stone-800">Search Results for "{searchQuery}"</h2>
              <button onClick={() => setShowSearchOverlay(false)} className="text-sm text-stone-500 hover:text-stone-800 underline">
                Close Search
              </button>
            </div>

            {filteredDocs.length > 0 && (
              <div>
                <h3 className="font-semibold text-stone-700 mb-3 flex items-center gap-2">
                  <Files size={18} className="text-teal-600" /> Documents ({filteredDocs.length})
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredDocs.map(doc => (
                    <div
                      key={doc.id}
                      onClick={() => { setActiveTab('vault'); setShowSearchOverlay(false); }}
                      className="bg-white rounded-xl border border-stone-200 p-4 hover:shadow-md transition-all cursor-pointer group hover:border-teal-500/30"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="p-1.5 bg-stone-50 rounded-lg text-stone-400 group-hover:text-teal-600 transition-colors">
                          <Files size={16} />
                        </div>
                        <span className="text-[10px] uppercase tracking-wider text-stone-400 bg-stone-50 px-1.5 py-0.5 rounded-md">{doc.type}</span>
                      </div>
                      <h4 className="font-medium text-stone-800 mb-1">{doc.title}</h4>
                      {doc.expiry && <p className="text-xs text-stone-400">Expires: {doc.expiry}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {filteredAssets.length > 0 && (
              <div>
                <h3 className="font-semibold text-stone-700 mb-3 flex items-center gap-2">
                  <Armchair size={18} className="text-amber-600" /> Assets ({filteredAssets.length})
                </h3>
                <div className="grid grid-cols-1 gap-4">
                  {filteredAssets.map(asset => (
                    <div
                      key={asset.id}
                      onClick={() => { setActiveTab('assets'); setShowSearchOverlay(false); }}
                      className="bg-white rounded-xl border border-stone-200 p-4 flex justify-between items-center cursor-pointer hover:shadow-md transition-all hover:border-amber-500/30 group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-amber-50 text-amber-600 rounded-lg group-hover:scale-110 transition-transform"><Armchair size={18} /></div>
                        <div>
                          <span className="font-medium text-stone-800 block">{asset.title}</span>
                          <span className="text-xs text-stone-500">Purchased: {asset.purchaseDate}</span>
                        </div>
                      </div>
                      <span className="text-xs font-medium bg-stone-100 text-stone-600 px-2 py-1 rounded-lg">View Details</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {filteredBills.length > 0 && (
              <div>
                <h3 className="font-semibold text-stone-700 mb-3 flex items-center gap-2">
                  <CreditCard size={18} className="text-rose-600" /> Bills ({filteredBills.length})
                </h3>
                <div className="space-y-2">
                  {filteredBills.map(bill => (
                    <div
                      key={bill.id}
                      onClick={() => { setActiveTab('finance'); setShowSearchOverlay(false); }}
                      className="bg-white rounded-xl border border-stone-200 p-4 flex justify-between items-center cursor-pointer hover:shadow-md transition-all hover:border-rose-500/30 group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-rose-50 text-rose-600 rounded-lg group-hover:scale-110 transition-transform"><CreditCard size={18} /></div>
                        <div>
                          <span className="font-medium text-stone-800 block">{bill.title}</span>
                          <span className={`text-xs ${isPast(parseISO(bill.dueDate)) ? 'text-rose-500' : 'text-stone-500'}`}>Due: {bill.dueDate}</span>
                        </div>
                      </div>
                      <span className="font-mono text-sm font-bold text-stone-700">₹{bill.amount.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {filteredDocs.length === 0 && filteredAssets.length === 0 && filteredBills.length === 0 && (
              <div className="text-center py-12 text-stone-400">
                <Search size={48} className="mx-auto mb-4 opacity-20" />
                <p>No results found</p>
              </div>
            )}
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-6 pb-24">
            {activeTab === 'dashboard' && renderDashboard()}
            {activeTab === 'vault' && renderVault()}
            {activeTab === 'assets' && renderAssets()}
            {activeTab === 'finance' && renderFinance()}
            {activeTab === 'wellness' && renderWellness()}
            {activeTab === 'vehicles' && renderVehicles()}
            {activeTab === 'properties' && renderProperties()}
          </div>
        )}

        <div className="md:hidden bg-white border-t border-stone-200 p-4 flex justify-around shrink-0 z-20">
          {[
            { id: 'dashboard', icon: LayoutDashboard },
            { id: 'vault', icon: Files },
            { id: 'assets', icon: Armchair },
            { id: 'finance', icon: CreditCard },
            { id: 'wellness', icon: HeartPulse }
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
      </main >

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

      <Modal isOpen={isInviteModalOpen} onClose={() => setInviteModalOpen(false)} title="Invite Family Member">
        <div className="text-center space-y-6 py-4">
          <div className="w-16 h-16 bg-teal-50 text-teal-600 rounded-full flex items-center justify-center mx-auto">
            <Users size={32} />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-stone-800">Share this Code</h3>
            <p className="text-stone-500 text-sm">Share this code with your family member to let them join your household.</p>
          </div>

          <div className="bg-stone-100 p-4 rounded-xl border border-stone-200">
            <p className="font-mono text-3xl font-bold text-stone-800 tracking-widest">{inviteCode}</p>
          </div>

          <p className="text-xs text-stone-400">
            Expires on {inviteExpires && format(new Date(inviteExpires), 'PP p')}
          </p>

          <button
            onClick={() => {
              navigator.clipboard.writeText(inviteCode);
              alert('Code copied to clipboard!');
            }}
            className="w-full bg-stone-900 text-white py-2.5 rounded-xl font-medium hover:bg-stone-800 transition-colors"
          >
            Copy Code
          </button>
        </div>
      </Modal>

      <Modal isOpen={isQuickAddOpen} onClose={() => { setQuickAddOpen(false); setAddType(null); setFormData({}); }} title={addType ? "Add Detail" : "Add to Hearth"}>
        {renderAddForm()}
      </Modal>

    </div >
  );
}
