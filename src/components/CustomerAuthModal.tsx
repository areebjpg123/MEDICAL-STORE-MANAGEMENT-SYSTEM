import { useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { X, Loader2 } from 'lucide-react';

export default function CustomerAuthModal({ isOpen, onClose, onLogin }: { isOpen: boolean, onClose: () => void, onLogin: (customer: any) => void }) {
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim()) return;

    setIsLoading(true);
    setError('');
    const supabase = createClient();

    try {
      // Lookup customer
      const { data: existing, error: fetchErr } = await supabase
        .from('customers')
        .select('*')
        .eq('phone', phone.trim())
        .single();

      if (existing) {
        // If they entered a new address, update it.
        if (address.trim() && existing.address !== address.trim()) {
           const { data: updated, error: updateErr } = await supabase.from('customers').update({ address: address.trim() }).eq('id', existing.id).select().single();
           if (!updateErr && updated) {
              onLogin(updated);
              setIsLoading(false);
              return;
           }
        }
        onLogin(existing);
      } else {
        if (!name.trim() || !address.trim()) {
          setError('Please provide your name and complete home address to continue.');
          setIsLoading(false);
          return;
        }
        
        // Register new
        const { data: newCust, error: insertErr } = await supabase
          .from('customers')
          .insert({ phone: phone.trim(), name: name.trim(), address: address.trim() })
          .select()
          .single();
          
        if (insertErr) throw insertErr;
        onLogin(newCust);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Your Details</h2>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
              <X size={24} />
            </button>
          </div>
          <p className="text-slate-600 dark:text-slate-400 mb-6">
            Please provide your details before checking out.
          </p>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Phone Number</label>
              <input
                type="tel"
                required
                placeholder="03001234567"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Full Name</label>
              <input
                type="text"
                placeholder="Ali Khan"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Home Address</label>
              <textarea
                placeholder="House 123, Street 4, City..."
                rows={2}
                value={address}
                onChange={e => setAddress(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-none"
              />
            </div>

            {error && (
              <div className="text-red-500 text-sm bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center transition-colors disabled:opacity-70"
            >
              {isLoading ? <Loader2 className="animate-spin" size={20} /> : 'Save & Continue'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
