import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Armchair, Loader2 } from 'lucide-react';

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [isJoin, setIsJoin] = useState(false); // Toggle between "Create Household" and "Join Household"
  const { login, registerHousehold, joinHousehold } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Form states
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    householdName: '',
    housePassword: '',
    adminName: '', // For create
    name: '', // For join
    avatar: '👤'
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    let res;
    if (isLogin) {
        res = await login(formData.username, formData.password);
    } else if (isJoin) {
        res = await joinHousehold({
            householdName: formData.householdName,
            housePassword: formData.housePassword,
            username: formData.username,
            password: formData.password,
            name: formData.name,
            avatar: formData.avatar
        });
    } else {
        // Create household
        res = await registerHousehold({
            householdName: formData.householdName,
            housePassword: formData.housePassword,
            username: formData.username,
            password: formData.password,
            adminName: formData.adminName
        });
    }

    setLoading(false);
    if (res.success) {
        navigate('/');
    } else {
        setError(res.message);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md p-8 rounded-2xl shadow-xl border border-stone-100">
        <div className="flex flex-col items-center mb-8">
            <div className="w-12 h-12 bg-stone-900 rounded-xl flex items-center justify-center text-white mb-4">
                <Armchair size={24} />
            </div>
            <h1 className="text-2xl font-serif font-bold text-stone-800">Hearth</h1>
            <p className="text-stone-500">Family Management System</p>
        </div>

        {error && <div className="bg-rose-50 text-rose-600 p-3 rounded-lg text-sm mb-4">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">

            {!isLogin && (
                <>
                   <div>
                        <label className="block text-xs font-medium text-stone-700 mb-1">Household Name</label>
                        <input name="householdName" type="text" required className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-400" onChange={handleChange} />
                   </div>
                   <div>
                        <label className="block text-xs font-medium text-stone-700 mb-1">House Password (Shared)</label>
                        <input name="housePassword" type="password" required className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-400" onChange={handleChange} />
                   </div>
                   <div className="border-t border-stone-100 my-4 pt-2">
                       <p className="text-xs text-stone-400 font-medium uppercase tracking-wider mb-2">Your Account</p>
                       <div>
                            <label className="block text-xs font-medium text-stone-700 mb-1">Full Name</label>
                            <input name={isJoin ? "name" : "adminName"} type="text" required className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-400" onChange={handleChange} />
                       </div>
                   </div>
                </>
            )}

            <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">Username</label>
                <input name="username" type="text" required className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-400" onChange={handleChange} />
            </div>
            <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">Password</label>
                <input name="password" type="password" required className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-400" onChange={handleChange} />
            </div>

            <button type="submit" disabled={loading} className="w-full bg-stone-900 text-white py-2.5 rounded-xl font-medium hover:bg-stone-800 transition-colors flex justify-center items-center gap-2">
                {loading && <Loader2 className="animate-spin" size={18} />}
                {isLogin ? 'Sign In' : (isJoin ? 'Join Household' : 'Create Household')}
            </button>
        </form>

        <div className="mt-6 flex flex-col items-center gap-2 text-sm text-stone-500">
            {isLogin ? (
                <>
                    <button onClick={() => { setIsLogin(false); setIsJoin(false); }} className="hover:text-stone-800">New Household?</button>
                    <button onClick={() => { setIsLogin(false); setIsJoin(true); }} className="hover:text-stone-800">Join Existing Household?</button>
                </>
            ) : (
                <button onClick={() => setIsLogin(true)} className="hover:text-stone-800">Back to Login</button>
            )}
            {!isLogin && !isJoin && (
                 <button onClick={() => setIsJoin(true)} className="hover:text-stone-800">Join Existing Household instead?</button>
            )}
            {!isLogin && isJoin && (
                 <button onClick={() => setIsJoin(false)} className="hover:text-stone-800">Create New Household instead?</button>
            )}
        </div>
      </div>
    </div>
  );
}
