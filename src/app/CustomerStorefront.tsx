'use client';

import { useState } from 'react';
import { ShoppingCart, Search, Plus, Minus, X, Check } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';

export default function CustomerStorefront({ initialProducts }: { initialProducts: any[] }) {
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState<any[]>([]);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  
  // Checkout form
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const supabase = createClient();
  const router = useRouter();

  const filteredProducts = initialProducts.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    (p.formula_name && p.formula_name.toLowerCase().includes(search.toLowerCase()))
  );

  const addToCart = (product: any) => {
    const existing = cart.find(item => item.id === product.id);
    if (existing) {
      setCart(cart.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item));
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
    }
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(cart.map(item => {
      if (item.id === id) {
        const newQ = item.quantity + delta;
        return newQ > 0 ? { ...item, quantity: newQ } : item;
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const removeFromCart = (id: string) => {
    setCart(cart.filter(item => item.id !== id));
  };

  const totalAmount = cart.reduce((sum, item) => sum + (item.sale_price * item.quantity), 0);

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const orderData = {
      client_name: name,
      customer_email: email,
      customer_phone: phone,
      customer_address: address,
      items: cart,
      total: totalAmount,
      status: 'PENDING'
    };

    const { error } = await supabase.from('orders').insert(orderData);

    setIsSubmitting(false);
    if (error) {
      alert('Failed to place order. Please try again.');
    } else {
      setSuccess(true);
      setCart([]);
      setTimeout(() => {
        setIsCheckoutOpen(false);
        setSuccess(false);
        setName(''); setEmail(''); setPhone(''); setAddress('');
      }, 3000);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-4 flex flex-col md:flex-row gap-6">
      {/* Products Section */}
      <div className="flex-1 space-y-6">
        <div className="flex flex-col space-y-2">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Medical Store</h1>
          <p className="text-slate-500">Order medicines directly to your door.</p>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input 
            type="text" 
            placeholder="Search medicines, formulas..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-zinc-800 focus:ring-2 focus:ring-blue-600 outline-none bg-white dark:bg-zinc-900 shadow-sm"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProducts.map(product => (
            <div key={product.id} className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl p-4 flex flex-col shadow-sm hover:shadow-md transition-shadow">
              <div className="flex-1">
                <h3 className="font-bold text-lg text-slate-900 dark:text-white">{product.name}</h3>
                {product.formula_name && <p className="text-xs text-slate-500 mb-2">{product.formula_name}</p>}
                <p className="text-lg font-semibold text-blue-600 mt-2">Rs. {product.sale_price}</p>
              </div>
              <button 
                onClick={() => addToCart(product)}
                disabled={product.stock_quantity <= 0}
                className="mt-4 w-full bg-slate-100 hover:bg-slate-200 text-slate-800 dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-zinc-200 py-2 rounded-lg font-medium disabled:opacity-50 transition-colors"
              >
                {product.stock_quantity > 0 ? 'Add to Cart' : 'Out of Stock'}
              </button>
            </div>
          ))}
          {filteredProducts.length === 0 && (
            <div className="col-span-full py-12 text-center text-slate-500">
              No products found.
            </div>
          )}
        </div>
      </div>

      {/* Cart Section */}
      <div className="w-full md:w-96 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-lg flex flex-col h-[calc(100vh-2rem)] sticky top-4">
        <div className="p-4 border-b border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950 rounded-t-2xl flex items-center gap-3">
          <ShoppingCart className="text-blue-600" />
          <h2 className="font-bold text-lg">Your Cart</h2>
          <span className="ml-auto bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 px-2.5 py-0.5 rounded-full text-sm font-bold">
            {cart.reduce((s, i) => s + i.quantity, 0)}
          </span>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-2">
              <ShoppingCart size={48} className="opacity-20" />
              <p>Your cart is empty.</p>
            </div>
          ) : (
            cart.map(item => (
              <div key={item.id} className="flex items-center gap-3 bg-slate-50 dark:bg-zinc-800/50 p-3 rounded-xl border border-slate-100 dark:border-zinc-800">
                <div className="flex-1">
                  <h4 className="font-semibold text-sm line-clamp-1">{item.name}</h4>
                  <p className="text-blue-600 font-medium text-sm">Rs. {item.sale_price * item.quantity}</p>
                </div>
                <div className="flex items-center gap-2 bg-white dark:bg-zinc-900 rounded-lg border border-slate-200 dark:border-zinc-700 p-1">
                  <button onClick={() => updateQuantity(item.id, -1)} className="p-1 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded">
                    <Minus size={14} />
                  </button>
                  <span className="w-4 text-center text-sm font-medium">{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.id, 1)} className="p-1 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded">
                    <Plus size={14} />
                  </button>
                </div>
                <button onClick={() => removeFromCart(item.id)} className="text-red-500 p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg ml-1">
                  <X size={16} />
                </button>
              </div>
            ))
          )}
        </div>

        <div className="p-4 border-t border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950 rounded-b-2xl space-y-4">
          <div className="flex justify-between items-center font-bold text-lg">
            <span>Total</span>
            <span className="text-blue-600">Rs. {totalAmount.toFixed(2)}</span>
          </div>
          <button 
            onClick={() => setIsCheckoutOpen(true)}
            disabled={cart.length === 0}
            className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Checkout
          </button>
        </div>
      </div>

      {/* Checkout Modal */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 max-w-md w-full rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {success ? (
              <div className="p-8 flex flex-col items-center justify-center text-center space-y-4">
                <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-2">
                  <Check size={32} strokeWidth={3} />
                </div>
                <h2 className="text-2xl font-bold">Order Placed!</h2>
                <p className="text-slate-500">Your order has been successfully placed. We will contact you shortly.</p>
              </div>
            ) : (
              <form onSubmit={handleCheckout} className="p-6 space-y-4">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold">Checkout Details</h2>
                  <button type="button" onClick={() => setIsCheckoutOpen(false)} className="text-slate-400 hover:text-slate-700">
                    <X size={24} />
                  </button>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-slate-700 dark:text-zinc-300">Full Name</label>
                    <input required type="text" value={name} onChange={e=>setName(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 dark:border-zinc-700 px-3 py-2 bg-white dark:bg-zinc-950 focus:ring-2 focus:ring-blue-600 outline-none" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700 dark:text-zinc-300">Phone Number</label>
                    <input required type="tel" value={phone} onChange={e=>setPhone(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 dark:border-zinc-700 px-3 py-2 bg-white dark:bg-zinc-950 focus:ring-2 focus:ring-blue-600 outline-none" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700 dark:text-zinc-300">Email Address (Optional)</label>
                    <input type="email" value={email} onChange={e=>setEmail(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 dark:border-zinc-700 px-3 py-2 bg-white dark:bg-zinc-950 focus:ring-2 focus:ring-blue-600 outline-none" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700 dark:text-zinc-300">Complete Delivery Address</label>
                    <textarea required rows={3} value={address} onChange={e=>setAddress(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 dark:border-zinc-700 px-3 py-2 bg-white dark:bg-zinc-950 focus:ring-2 focus:ring-blue-600 outline-none resize-none" />
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 dark:border-zinc-800 mt-6">
                  <div className="flex justify-between items-center mb-4 font-bold text-lg">
                    <span>Total Amount:</span>
                    <span className="text-blue-600">Rs. {totalAmount.toFixed(2)}</span>
                  </div>
                  <button type="submit" disabled={isSubmitting} className="w-full bg-emerald-600 text-white font-bold py-3 rounded-xl hover:bg-emerald-700 transition-colors disabled:opacity-50">
                    {isSubmitting ? 'Placing Order...' : 'Confirm Order'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
