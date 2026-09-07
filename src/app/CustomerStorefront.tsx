'use client';

import { useState, useEffect } from 'react';
import { ShoppingCart, Search, Plus, Minus, X, Check, UserCircle, Phone, MessageCircle, LogOut, Package } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import CustomerAuthModal from '@/components/CustomerAuthModal';

export default function CustomerStorefront({ initialProducts }: { initialProducts: any[] }) {
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState<any[]>([]);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  
  // View states
  const [view, setView] = useState<'store' | 'past_orders'>('store');
  const [pastOrders, setPastOrders] = useState<any[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  
  // Checkout form
  const [address, setAddress] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;

  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    const savedUser = localStorage.getItem('medistore_customer');
    if (savedUser) {
      setCurrentUser(JSON.parse(savedUser));
    }
    const savedCart = localStorage.getItem('medistore_cart');
    if (savedCart) {
      setCart(JSON.parse(savedCart));
    }
  }, []);

  useEffect(() => {
    if (cart.length > 0) {
      localStorage.setItem('medistore_cart', JSON.stringify(cart));
    } else {
      localStorage.removeItem('medistore_cart');
    }
  }, [cart]);

  const loadPastOrders = async () => {
    if (!currentUser) return;
    setIsLoadingOrders(true);
    const { data } = await supabase.from('orders').select('*').eq('customer_id', currentUser.id).order('created_at', { ascending: false });
    if (data) setPastOrders(data);
    setIsLoadingOrders(false);
  };

  useEffect(() => {
    if (view === 'past_orders') {
      loadPastOrders();
    }
  }, [view, currentUser]);

  const filteredProducts = initialProducts.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    (p.formula_name && p.formula_name.toLowerCase().includes(search.toLowerCase()))
  );

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const paginatedProducts = filteredProducts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

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
        const newQ = Math.max(0, item.quantity + delta);
        return { ...item, quantity: newQ };
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const removeFromCart = (id: string) => {
    setCart(cart.filter(item => item.id !== id));
  };

  const totalAmount = cart.reduce((sum, item) => sum + (item.sale_price * item.quantity), 0);

  const handleCheckoutClick = () => {
    if (!currentUser) {
      setIsAuthModalOpen(true);
    } else {
      setIsCheckoutOpen(true);
    }
  };

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setIsSubmitting(true);

    const generatedId = typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function' ? crypto.randomUUID() : 'ord-' + Math.random().toString(36).substring(2) + Date.now().toString(36);
    const orderData = {
      id: generatedId,
      customer_id: currentUser.id,
      client_name: currentUser.name,
      customer_phone: currentUser.phone,
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
        setAddress('');
      }, 8000);
    }
  };

  return (
    <div className="flex flex-col md:flex-row max-w-7xl mx-auto p-4 gap-6 relative">
      <CustomerAuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
        onLogin={(cust) => {
          setCurrentUser(cust);
          localStorage.setItem('medistore_customer', JSON.stringify(cust));
          setIsAuthModalOpen(false);
          setIsCheckoutOpen(true);
        }} 
      />

      <div className="flex-1 w-full">
        <header className="flex justify-between items-center mb-8 bg-white dark:bg-zinc-900 p-4 rounded-2xl shadow-sm border border-slate-200 dark:border-zinc-800">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">MediStore</h1>
            <p className="text-sm text-slate-500">Fast & Reliable Medicines</p>
          </div>
          <div className="flex items-center gap-4">
            {currentUser ? (
               <div className="flex items-center gap-3">
                 <button onClick={() => setView(view === 'store' ? 'past_orders' : 'store')} className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-blue-600 bg-slate-100 dark:bg-zinc-800 px-3 py-2 rounded-lg">
                   {view === 'store' ? <><Package size={16}/> Past Orders</> : <><ShoppingCart size={16}/> Shop</>}
                 </button>
                 <div className="hidden sm:flex flex-col text-right">
                   <span className="text-sm font-bold text-slate-900 dark:text-white">{currentUser.name}</span>
                   <span className="text-xs text-slate-500">{currentUser.phone}</span>
                 </div>
                 <button onClick={() => {
                   setCurrentUser(null);
                   localStorage.removeItem('medistore_customer');
                   setView('store');
                 }} className="p-2 text-slate-400 hover:text-red-500 bg-slate-50 dark:bg-zinc-950 rounded-lg" title="Logout">
                   <LogOut size={18} />
                 </button>
               </div>
            ) : (
               <button onClick={() => setIsAuthModalOpen(true)} className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-800 dark:text-slate-200 px-4 py-2 rounded-xl font-medium transition-colors">
                 <UserCircle size={20} /> Login
               </button>
            )}
          </div>
        </header>

        {view === 'past_orders' ? (
          <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-slate-200 dark:border-zinc-800 p-6 min-h-[500px]">
             <h2 className="text-xl font-bold mb-6">Your Past Orders</h2>
             {isLoadingOrders ? (
               <div className="animate-pulse flex flex-col gap-4">
                 {[1,2,3].map(i => <div key={i} className="h-24 bg-slate-100 dark:bg-zinc-800 rounded-xl" />)}
               </div>
             ) : pastOrders.length === 0 ? (
               <div className="text-center py-12 text-slate-500">You haven't placed any orders yet.</div>
             ) : (
               <div className="flex flex-col gap-4">
                 {pastOrders.map(order => (
                   <div key={order.id} className="border border-slate-200 dark:border-zinc-800 rounded-xl p-4 flex flex-col sm:flex-row gap-4 justify-between">
                     <div>
                       <div className="flex items-center gap-3 mb-2">
                         <span className="font-bold text-lg">Order #{order.receipt_number || 'N/A'}</span>
                         <span className={`px-2 py-1 text-xs font-bold rounded-md ${order.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700' : order.status === 'CANCELLED' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'}`}>
                           {order.status}
                         </span>
                       </div>
                       <p className="text-sm text-slate-500">{new Date(order.created_at).toLocaleString()}</p>
                       <p className="text-sm mt-2 text-slate-700 dark:text-slate-300">
                         {Array.isArray(order.items) ? order.items.map((i:any) => `${i.quantity}x ${i.name}`).join(', ') : 'Items recorded'}
                       </p>
                     </div>
                     <div className="text-left sm:text-right flex flex-col justify-between">
                       <span className="font-bold text-xl text-blue-600">Rs. {Number(order.total).toFixed(2)}</span>
                     </div>
                   </div>
                 ))}
               </div>
             )}
          </div>
        ) : (
          <>
            <div className="relative mb-6">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input 
                type="text" 
                placeholder="Search medicines, formulas..." 
                value={search}
                onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
                className="w-full pl-12 pr-4 py-4 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 focus:ring-2 focus:ring-blue-500 outline-none shadow-sm text-slate-900 dark:text-white"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {paginatedProducts.map(product => (
                <div key={product.id} className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
                  <div>
                    {product.section && <span className="inline-block px-2 py-1 bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-slate-400 text-xs rounded-md mb-3">{product.section}</span>}
                    <h3 className="font-bold text-lg text-slate-900 dark:text-white line-clamp-2 leading-tight">{product.name}</h3>
                    {product.formula_name && <p className="text-xs text-slate-500 mt-1 line-clamp-1">{product.formula_name}</p>}
                    <p className="text-xl font-bold text-blue-600 mt-3">Rs. {product.sale_price}</p>
                  </div>
                  <button 
                    onClick={() => addToCart(product)}
                    disabled={product.stock_quantity <= 0}
                    className="mt-4 w-full bg-slate-100 hover:bg-slate-200 text-slate-800 dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-zinc-200 py-2.5 rounded-xl font-medium disabled:opacity-50 transition-colors"
                  >
                    {product.stock_quantity > 0 ? 'Add to Cart' : 'Out of Stock'}
                  </button>
                </div>
              ))}
              {filteredProducts.length === 0 && (
                <div className="col-span-full py-12 text-center text-slate-500 bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800">
                  No products found.
                </div>
              )}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-4 mt-8 bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-slate-200 dark:border-zinc-800">
                <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-4 py-2 border rounded-lg disabled:opacity-50 font-medium">Previous</button>
                <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Page {currentPage} of {totalPages}</span>
                <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="px-4 py-2 border rounded-lg disabled:opacity-50 font-medium">Next</button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Cart Section */}
      <div className={`w-full md:w-96 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-xl flex flex-col h-[calc(100vh-2rem)] sticky top-4 ${view === 'past_orders' ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-4 border-b border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950 rounded-t-2xl flex items-center gap-3 shrink-0">
          <ShoppingCart className="text-blue-600" />
          <h2 className="font-bold text-lg">Your Cart</h2>
          <span className="ml-auto bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 px-2.5 py-0.5 rounded-full text-sm font-bold">
            {cart.reduce((s, i) => s + i.quantity, 0)}
          </span>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-4">
              <div className="w-20 h-20 bg-slate-50 dark:bg-zinc-800 rounded-full flex items-center justify-center">
                <ShoppingCart size={32} className="opacity-40" />
              </div>
              <p className="font-medium">Your cart is empty.</p>
            </div>
          ) : (
            cart.map(item => (
              <div key={item.id} className="flex items-center gap-3 bg-slate-50 dark:bg-zinc-800/50 p-3 rounded-xl border border-slate-100 dark:border-zinc-800 relative group">
                <div className="flex-1 pr-6">
                  <h4 className="font-semibold text-sm line-clamp-1 leading-tight mb-1">{item.name}</h4>
                  <p className="text-blue-600 font-bold text-sm">Rs. {item.sale_price * item.quantity}</p>
                </div>
                <div className="flex items-center gap-1 bg-white dark:bg-zinc-900 rounded-lg border border-slate-200 dark:border-zinc-700 p-0.5 shrink-0">
                  <button onClick={() => updateQuantity(item.id, -1)} className="p-1 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded text-slate-500">
                    <Minus size={14} />
                  </button>
                  <span className="w-6 text-center text-sm font-bold">{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.id, 1)} className="p-1 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded text-slate-500">
                    <Plus size={14} />
                  </button>
                </div>
                <button onClick={() => removeFromCart(item.id)} className="absolute top-2 right-2 text-slate-400 hover:text-red-500 p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <X size={14} />
                </button>
              </div>
            ))
          )}
        </div>

        <div className="p-4 border-t border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950 rounded-b-2xl space-y-4 shrink-0">
          <div className="flex justify-between items-center font-bold text-xl">
            <span>Total</span>
            <span className="text-blue-600">Rs. {totalAmount.toFixed(2)}</span>
          </div>
          <button 
            onClick={handleCheckoutClick}
            disabled={cart.length === 0}
            className="w-full bg-blue-600 text-white font-bold py-3.5 rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-blue-600/20"
          >
            Checkout
          </button>
        </div>
      </div>

      {/* Checkout / Success Modal */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 max-w-md w-full rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 relative">
            {success ? (
              <div className="p-8 flex flex-col items-center justify-center text-center space-y-5">
                <button onClick={() => {setIsCheckoutOpen(false); setSuccess(false); setView('past_orders');}} className="absolute top-4 right-4 text-slate-400 hover:text-slate-700">
                  <X size={24} />
                </button>
                <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-2">
                  <Check size={40} strokeWidth={3} />
                </div>
                <div>
                  <h2 className="text-3xl font-bold mb-2 text-slate-900 dark:text-white">Order Placed!</h2>
                  <p className="text-slate-500">Your order has been sent to the pharmacy. They will process it shortly.</p>
                </div>
                
                <div className="w-full h-px bg-slate-200 dark:bg-zinc-800 my-4" />
                
                <div className="w-full space-y-3">
                  <p className="font-semibold text-slate-700 dark:text-slate-300 mb-2">Need to contact us?</p>
                  <a href={`https://wa.me/923000000000?text=Hi, I just placed an order (Total: Rs. ${totalAmount.toFixed(2)}) on MediStore.`} target="_blank" rel="noreferrer" className="w-full flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#1ebd57] text-white font-bold py-3 rounded-xl transition-colors">
                    <MessageCircle size={20} /> Contact via WhatsApp
                  </a>
                  <a href="tel:+923000000000" className="w-full flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-800 dark:text-white font-bold py-3 rounded-xl transition-colors">
                    <Phone size={20} /> Call Us
                  </a>
                </div>
              </div>
            ) : (
              <form onSubmit={handleCheckout} className="p-6 space-y-5">
                <div className="flex justify-between items-center mb-2">
                  <h2 className="text-2xl font-bold">Checkout</h2>
                  <button type="button" onClick={() => setIsCheckoutOpen(false)} className="text-slate-400 hover:text-slate-700">
                    <X size={24} />
                  </button>
                </div>
                
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl flex items-center gap-4">
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-800 text-blue-600 dark:text-blue-200 rounded-full flex items-center justify-center shrink-0">
                    <UserCircle size={24} />
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 dark:text-white">{currentUser?.name}</p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">{currentUser?.phone}</p>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-slate-700 dark:text-zinc-300">Complete Delivery Address</label>
                    <textarea required rows={3} placeholder="House 123, Street 4, City..." value={address} onChange={e=>setAddress(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 dark:border-zinc-700 px-4 py-3 bg-white dark:bg-zinc-950 focus:ring-2 focus:ring-blue-600 outline-none resize-none transition-all" />
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-100 dark:border-zinc-800">
                  <div className="flex justify-between items-center mb-6">
                    <span className="font-semibold text-slate-500">Total Amount:</span>
                    <span className="font-bold text-2xl text-blue-600">Rs. {totalAmount.toFixed(2)}</span>
                  </div>
                  <button type="submit" disabled={isSubmitting || !address.trim()} className="w-full bg-emerald-600 text-white font-bold py-4 rounded-xl hover:bg-emerald-700 transition-colors disabled:opacity-50 shadow-lg shadow-emerald-600/20">
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
