"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  RotateCcw, 
  Search, 
  Eye, 
  X, 
  Package, 
  AlertCircle 
} from "lucide-react";

const playNotificationSound = () => {
  try {
    const audio = new Audio('/iphone_notification.mp3');
    audio.play().catch(e => console.error("Audio playback failed", e));
  } catch (e) {
    console.error("Audio playback failed", e);
  }
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'PENDING' | 'COMPLETED' | 'CANCELLED'>('PENDING');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    fetchOrders();

    const channel = supabase.channel('admin_orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          if (payload.new.status === 'PENDING') {
            playNotificationSound();
          }
          setOrders(prev => [payload.new, ...prev]);
        } else if (payload.eventType === 'UPDATE') {
          setOrders(prev => prev.map(o => o.id === payload.new.id ? payload.new : o));
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const fetchOrders = async () => {
    setIsLoading(true);
    const { data } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
    if (data) setOrders(data);
    setIsLoading(false);
  };

  const handleAutomake = async (order: any) => {
    if (!confirm('Are you sure you want to Fulfill & Automake this order? This will deduct stock.')) return;
    setActionLoading(true);

    try {
      // 1. Fetch current stock for all items
      const productIds = order.items.map((i: any) => i.id);
      const { data: productsData, error: fetchErr } = await supabase.from('products').select('id, stock_quantity, name').in('id', productIds);
      
      if (fetchErr) throw fetchErr;

      // 2. Validate stock
      for (const item of order.items) {
        const dbProduct = productsData?.find(p => p.id === item.id);
        if (!dbProduct) throw new Error(`Product ${item.name} not found in database.`);
        if (dbProduct.stock_quantity < item.quantity) {
          throw new Error(`Insufficient stock for ${item.name}. Available: ${dbProduct.stock_quantity}, Needed: ${item.quantity}`);
        }
      }

      // 3. Deduct stock one by one
      for (const item of order.items) {
        const dbProduct = productsData?.find(p => p.id === item.id);
        if (dbProduct) {
          await supabase.from('products').update({ stock_quantity: Math.max(0, dbProduct.stock_quantity - item.quantity) }).eq('id', item.id);
        }
      }

      // 4. Update order status
      await supabase.from('orders').update({ status: 'COMPLETED' }).eq('id', order.id);
      setSelectedOrder(null);
    } catch (err: any) {
      alert(err.message || 'Error fulfilling order');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async (order: any) => {
    if (!confirm('Cancel this order?')) return;
    setActionLoading(true);
    await supabase.from('orders').update({ status: 'CANCELLED' }).eq('id', order.id);
    setSelectedOrder(null);
    setActionLoading(false);
  };

  const handleRestore = async (order: any) => {
    if (!confirm('Restore this order to PENDING?')) return;
    setActionLoading(true);

    try {
      if (order.status === 'COMPLETED') {
        // Refund stock!
        const productIds = order.items.map((i: any) => i.id);
        const { data: productsData } = await supabase.from('products').select('id, stock_quantity').in('id', productIds);
        
        for (const item of order.items) {
          const dbProduct = productsData?.find(p => p.id === item.id);
          if (dbProduct) {
            await supabase.from('products').update({ stock_quantity: dbProduct.stock_quantity + item.quantity }).eq('id', item.id);
          }
        }
      }
      
      await supabase.from('orders').update({ status: 'PENDING' }).eq('id', order.id);
      setSelectedOrder(null);
    } catch (err) {
      console.error(err);
      alert('Error restoring order');
    } finally {
      setActionLoading(false);
    }
  };

  const filteredOrders = orders.filter(o => o.status === activeTab);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Online Orders</h1>
          <p className="text-slate-500">Manage customer orders from the storefront</p>
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-slate-200 dark:border-zinc-800 overflow-hidden">
        <div className="flex border-b border-slate-200 dark:border-zinc-800">
          <button 
            onClick={() => setActiveTab('PENDING')}
            className={`flex-1 py-4 px-6 text-center font-semibold transition-colors ${activeTab === 'PENDING' ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-zinc-800'}`}
          >
            <Clock className="inline-block mr-2 w-5 h-5" /> Pending
            <span className="ml-2 bg-slate-200 dark:bg-zinc-700 text-xs px-2 py-0.5 rounded-full">{orders.filter(o=>o.status==='PENDING').length}</span>
          </button>
          <button 
            onClick={() => setActiveTab('COMPLETED')}
            className={`flex-1 py-4 px-6 text-center font-semibold transition-colors ${activeTab === 'COMPLETED' ? 'bg-emerald-50 text-emerald-600 border-b-2 border-emerald-600' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-zinc-800'}`}
          >
            <CheckCircle className="inline-block mr-2 w-5 h-5" /> Completed
          </button>
          <button 
            onClick={() => setActiveTab('CANCELLED')}
            className={`flex-1 py-4 px-6 text-center font-semibold transition-colors ${activeTab === 'CANCELLED' ? 'bg-red-50 text-red-600 border-b-2 border-red-600' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-zinc-800'}`}
          >
            <XCircle className="inline-block mr-2 w-5 h-5" /> Cancelled
          </button>
        </div>

        <div className="p-6">
          {isLoading ? (
             <div className="animate-pulse space-y-4">
               {[1,2,3,4].map(i => <div key={i} className="h-20 bg-slate-100 dark:bg-zinc-800 rounded-xl" />)}
             </div>
          ) : filteredOrders.length === 0 ? (
             <div className="text-center py-16 text-slate-500">
               <Package size={48} className="mx-auto mb-4 opacity-20" />
               <p className="text-lg">No {activeTab.toLowerCase()} orders found.</p>
             </div>
          ) : (
            <div className="space-y-4">
              {filteredOrders.map(order => (
                <div key={order.id} className="flex flex-col sm:flex-row items-center justify-between p-5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950/50 gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="font-bold text-lg">Order #{order.receipt_number || 'N/A'}</h3>
                      <span className="text-sm text-slate-500">{new Date(order.created_at).toLocaleString()}</span>
                    </div>
                    <p className="text-slate-900 dark:text-slate-200 font-medium">{order.client_name} <span className="text-slate-400 font-normal">({order.customer_phone})</span></p>
                    <p className="text-sm text-slate-500 line-clamp-1">{order.customer_address}</p>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-sm text-slate-500">Total</p>
                      <p className="font-bold text-xl text-blue-600">Rs. {Number(order.total).toFixed(2)}</p>
                    </div>
                    <button 
                      onClick={() => setSelectedOrder(order)}
                      className="p-3 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 rounded-xl hover:bg-slate-50 hover:text-blue-600 transition-colors shadow-sm"
                    >
                      <Eye size={20} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* View Order Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 max-w-2xl w-full rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-200 dark:border-zinc-800 flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold">Order #{selectedOrder.receipt_number || 'N/A'}</h2>
                <p className="text-slate-500">{new Date(selectedOrder.created_at).toLocaleString()}</p>
              </div>
              <button onClick={() => setSelectedOrder(null)} className="text-slate-400 hover:text-slate-700"><X size={24} /></button>
            </div>
            
            <div className="p-6 flex-1 overflow-y-auto">
              <div className="bg-slate-50 dark:bg-zinc-950 p-4 rounded-xl mb-6 space-y-2 text-sm">
                <p><span className="font-bold w-24 inline-block">Customer:</span> {selectedOrder.client_name}</p>
                <p><span className="font-bold w-24 inline-block">Phone:</span> {selectedOrder.customer_phone}</p>
                <p><span className="font-bold w-24 inline-block">Address:</span> {selectedOrder.customer_address}</p>
              </div>

              <h3 className="font-bold mb-4">Order Items</h3>
              <div className="space-y-3">
                {selectedOrder.items?.map((item: any, i: number) => (
                  <div key={i} className="flex justify-between items-center border border-slate-200 dark:border-zinc-800 p-3 rounded-lg">
                    <div>
                      <p className="font-semibold">{item.name}</p>
                      <p className="text-sm text-slate-500">{item.quantity} x Rs. {item.sale_price}</p>
                    </div>
                    <span className="font-bold">Rs. {item.quantity * item.sale_price}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-6 border-t border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950/50">
              <div className="flex justify-between items-center mb-6">
                <span className="text-lg font-bold text-slate-600">Total Amount</span>
                <span className="text-2xl font-bold text-blue-600">Rs. {Number(selectedOrder.total).toFixed(2)}</span>
              </div>

              <div className="flex gap-4">
                {selectedOrder.status === 'PENDING' && (
                  <>
                    <button 
                      onClick={() => handleCancel(selectedOrder)}
                      disabled={actionLoading}
                      className="flex-1 bg-white border border-red-200 text-red-600 hover:bg-red-50 font-bold py-3 rounded-xl transition-colors"
                    >
                      Cancel Order
                    </button>
                    <button 
                      onClick={() => handleAutomake(selectedOrder)}
                      disabled={actionLoading}
                      className="flex-1 bg-emerald-600 text-white hover:bg-emerald-700 font-bold py-3 rounded-xl transition-colors flex justify-center items-center gap-2"
                    >
                      <CheckCircle size={20} /> Fulfill & Automake
                    </button>
                  </>
                )}
                {selectedOrder.status !== 'PENDING' && (
                  <button 
                    onClick={() => handleRestore(selectedOrder)}
                    disabled={actionLoading}
                    className="w-full bg-slate-800 text-white hover:bg-slate-700 font-bold py-3 rounded-xl transition-colors flex justify-center items-center gap-2"
                  >
                    <RotateCcw size={20} /> Restore to Pending
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
