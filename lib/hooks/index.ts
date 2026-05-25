// lib/hooks/index.ts — Merchant hooks with variant support
"use client";
import { useState, useEffect } from "react";
import {
  collection, query, where, orderBy, onSnapshot, addDoc,
  updateDoc, deleteDoc, doc, serverTimestamp, getDocs, limit,
  getDoc, writeBatch,
} from "firebase/firestore";
import { db } from "../firebase/client";

// ── Live orders ───────────────────────────────────────────────
export function useOrders(merchantId:string|null, statusFilter?:string){
  const [orders,setOrders]   = useState<any[]>([]);
  const [loading,setLoading] = useState(true);
  useEffect(()=>{
    if(!merchantId){setLoading(false);return;}
    const constraints:any[] = [where("merchantId","==",merchantId)];
    if(statusFilter) constraints.push(where("status","==",statusFilter));
    return onSnapshot(
      query(collection(db,"orders"),...constraints),
      s => { setOrders(s.docs.map(d=>({id:d.id,...d.data()}))); setLoading(false); },
      () => setLoading(false)
    );
  },[merchantId,statusFilter]);
  return {orders, loading};
}

// ── Wallet ────────────────────────────────────────────────────
export function useWallet(merchantId:string|null){
  const [wallet,setWallet] = useState<any>(null);
  useEffect(()=>{
    if(!merchantId) return;
    return onSnapshot(
      query(collection(db,"wallets"),where("merchantId","==",merchantId),limit(1)),
      s => setWallet(s.empty?null:{id:s.docs[0].id,...s.docs[0].data()})
    );
  },[merchantId]);
  return {wallet};
}

// ── Deposit addresses ─────────────────────────────────────────
export function useDepositAddresses(merchantId:string|null){
  const [addrs,setAddrs] = useState<any[]>([]);
  useEffect(()=>{
    if(!merchantId) return;
    return onSnapshot(
      query(collection(db,"deposit_addresses"),where("merchantId","==",merchantId)),
      s => setAddrs(s.docs.map(d=>({id:d.id,...d.data()})))
    );
  },[merchantId]);
  return {addrs};
}

// ── Withdrawals ───────────────────────────────────────────────
export function useWithdrawals(merchantId:string|null){
  const [withdrawals,setWithdrawals] = useState<any[]>([]);
  useEffect(()=>{
    if(!merchantId) return;
    return onSnapshot(
      query(collection(db,"withdrawals"),where("merchantId","==",merchantId),orderBy("requestedAt","desc")),
      s => setWithdrawals(s.docs.map(d=>({id:d.id,...d.data()})))
    );
  },[merchantId]);
  return {withdrawals};
}
export async function requestWithdrawal(params:any){
  return addDoc(collection(db,"withdrawals"),{...params,status:"pending",requestedAt:serverTimestamp()});
}

// ── Store products ────────────────────────────────────────────
export function useStoreProducts(storeId:string|null){
  const [items,setItems]     = useState<any[]>([]);
  const [loading,setLoading] = useState(true);
  useEffect(()=>{
    if(!storeId){setLoading(false);return;}
    return onSnapshot(
      query(collection(db,"store_products"),where("storeId","==",storeId)),
      s => { setItems(s.docs.map(d=>({id:d.id,...d.data()}))); setLoading(false); },
      () => setLoading(false)
    );
  },[storeId]);
  return {items, loading};
}

// ── Full catalog — NO orderBy to avoid index requirement ──────
export function useCatalog(category?:string){
  const [data,setData]       = useState<any[]>([]);
  const [loading,setLoading] = useState(true);
  useEffect(()=>{
    const constraints:any[] = [where("status","==","active")];
    if(category&&category!=="All") constraints.push(where("category","==",category));
    return onSnapshot(
      query(collection(db,"products"),...constraints),
      s => { setData(s.docs.map(d=>({id:d.id,...d.data()}))); setLoading(false); },
      err => { console.error("Catalog error:",err.message); setLoading(false); }
    );
  },[category]);
  return {data, loading};
}

// ── Add to store ──────────────────────────────────────────────
export async function addToStore(product:any, storeId:string, merchantId:string){
  const existing = await getDocs(query(collection(db,"store_products"),
    where("storeId","==",storeId),where("productId","==",product.id),limit(1)));
  if(!existing.empty) throw new Error("Already in store");
  return addDoc(collection(db,"store_products"),{
    storeId, merchantId,
    productId:      product.id,
    productName:    product.name,
    productImage:   product.images?.[0]||"📦",
    basePrice:      product.basePrice??0,
    retailPrice:    product.retailPrice??product.suggestedRetail??0,
    suggestedRetail:product.suggestedRetail??product.retailPrice??0,
    merchantProfit: +((product.suggestedRetail??0)*0.20).toFixed(2),
    vendorId:       product.vendorId??"",
    vendorName:     product.vendorName??"",
    category:       product.category??"",
    variants:       product.variants??[],
    isVisible:      true,
    addedAt:        serverTimestamp(),
  });
}

// ── Remove from store ─────────────────────────────────────────
export async function removeFromStore(storeProductId:string){
  await deleteDoc(doc(db,"store_products",storeProductId));
}

// ── Toggle visibility ─────────────────────────────────────────
export async function toggleVisibility(id:string, current:boolean){
  await updateDoc(doc(db,"store_products",id),{isVisible:!current,updatedAt:serverTimestamp()});
}

// ── Merchant store ────────────────────────────────────────────
export function useMerchantStore(merchantId:string|null){
  const [store,setStore] = useState<any>(null);
  useEffect(()=>{
    if(!merchantId) return;
    return onSnapshot(
      query(collection(db,"stores"),where("merchantId","==",merchantId),limit(1)),
      s => setStore(s.empty?null:{id:s.docs[0].id,...s.docs[0].data()})
    );
  },[merchantId]);
  return {store};
}

// ── Merchant KYC ─────────────────────────────────────────────
export function useMerchantKYC(merchantId:string|null){
  const [kyc,setKYC] = useState<any>(null);
  useEffect(()=>{
    if(!merchantId) return;
    return onSnapshot(
      query(collection(db,"kyc_submissions"),where("merchantId","==",merchantId),limit(1)),
      s => setKYC(s.empty?null:{id:s.docs[0].id,...s.docs[0].data()})
    );
  },[merchantId]);
  return {kyc};
}

// ── Notifications ─────────────────────────────────────────────
export function useNotifications(userId:string|null){
  const [notifs,setNotifs] = useState<any[]>([]);
  useEffect(()=>{
    if(!userId) return;
    return onSnapshot(
      query(collection(db,"notifications"),where("userId","==",userId),orderBy("createdAt","desc"),limit(50)),
      s => setNotifs(s.docs.map(d=>({id:d.id,...d.data()})))
    );
  },[userId]);
  const unread = notifs.filter(n=>!n.read).length;
  async function markRead(id:string){ await updateDoc(doc(db,"notifications",id),{read:true}); }
  async function markAllRead(){
    const batch = writeBatch(db);
    notifs.filter(n=>!n.read).forEach(n=>batch.update(doc(db,"notifications",n.id),{read:true}));
    await batch.commit();
  }
  return {notifs, unread, markRead, markAllRead};
}

// ── Chat ──────────────────────────────────────────────────────
export function useMerchantChatRoom(merchantId:string|null){
  const [room,setRoom] = useState<any>(null);
  useEffect(()=>{
    if(!merchantId) return;
    return onSnapshot(
      query(collection(db,"chat_rooms"),where("merchantId","==",merchantId),limit(1)),
      s => setRoom(s.empty?null:{id:s.docs[0].id,...s.docs[0].data()})
    );
  },[merchantId]);
  return {room};
}
export function useChatMessages(roomId:string|null){
  const [msgs,setMsgs] = useState<any[]>([]);
  useEffect(()=>{
    if(!roomId) return;
    return onSnapshot(
      query(collection(db,"chat_rooms",roomId,"messages"),orderBy("createdAt","asc")),
      s => setMsgs(s.docs.map(d=>({id:d.id,...d.data()})))
    );
  },[roomId]);
  return {msgs};
}
export async function sendMerchantMessage(roomId:string, text:string, merchantId:string, merchantName:string){
  await addDoc(collection(db,"chat_rooms",roomId,"messages"),{
    senderId:merchantId, senderRole:"merchant", senderName:merchantName,
    text, createdAt:serverTimestamp(), read:false,
  });
  const snap = await getDoc(doc(db,"chat_rooms",roomId));
  await updateDoc(doc(db,"chat_rooms",roomId),{
    lastMessage:text, lastMessageAt:serverTimestamp(),
    unreadAdmin:(snap.data()?.unreadAdmin??0)+1,
    unreadMerchant:0,
  });
}

// ── Submit order (deduct wallet) ──────────────────────────────
export async function submitMerchantOrder(params:{
  orderId:string; merchantId:string; storeId:string; storeName:string;
  totalBaseCost:number; storeSettings:any;
}){
  const {orderId,merchantId,storeId,storeName,totalBaseCost,storeSettings} = params;

  const wSnap = await getDocs(query(collection(db,"wallets"),where("merchantId","==",merchantId),limit(1)));
  if(wSnap.empty) throw new Error("Wallet not found. Contact support.");
  const wDoc = wSnap.docs[0];
  const w    = wDoc.data();
  const currentUSD = w.usdEquivalent??0;

  if(currentUSD<totalBaseCost)
    throw new Error(`Insufficient funds. Need $${totalBaseCost.toFixed(2)}, have $${currentUSD.toFixed(2)}.`);

  const customerPayment  = +(totalBaseCost*1.20).toFixed(2);
  const commissionRate   = storeSettings?.commissionRate??0.03;
  const commission       = +(customerPayment*commissionRate).toFixed(2);
  const merchantReceives = +(customerPayment-commission).toFixed(2);
  const netProfit        = +(merchantReceives-totalBaseCost).toFixed(2);

  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate()+(storeSettings?.deliveryDays??3));

  const batch = writeBatch(db);

  batch.update(doc(db,"orders",orderId),{
    status:"submitted", fundsDeducted:true,
    merchantSubmittedAt:serverTimestamp(), updatedAt:serverTimestamp(),
    reimbursementDue:dueDate,
    customerPayment, platformCommission:commission,
    merchantEarnings:netProfit, totalReimbursement:merchantReceives,
    totalBaseCost,
  });

  const newUSD  = Math.max(0,currentUSD-totalBaseCost);
  const newUSDT = Math.max(0,(w.balances?.USDT_TRC20??0)-totalBaseCost);
  batch.update(wDoc.ref,{
    "balances.USDT_TRC20":newUSDT,
    usdEquivalent:newUSD,
    updatedAt:serverTimestamp(),
  });

  await batch.commit();

  await addDoc(collection(db,"transactions"),{
    merchantId, storeId, merchantName:storeName,
    type:"order_deduction", coin:"USDT", network:"TRC20",
    amount:totalBaseCost, usdValue:totalBaseCost,
    txHash:`submit_${orderId}_${Date.now()}`, status:"confirmed",
    description:`Order submitted. Deducted $${totalBaseCost.toFixed(2)}. You receive $${merchantReceives.toFixed(2)} after delivery.`,
    createdAt:serverTimestamp(),
  });

  await addDoc(collection(db,"pending_reimbursements"),{
    orderId, merchantId, storeId, merchantName:storeName,
    totalBaseCost, customerPayment, platformCommission:commission,
    merchantProfit:netProfit, totalReimbursement:merchantReceives,
    dueAt:dueDate, processed:false, createdAt:serverTimestamp(),
  });

  return {customerPayment, commission, merchantReceives, netProfit};
}

// ── Transactions ──────────────────────────────────────────────
export function useTransactions(merchantId:string|null){
  const [txns,setTxns]       = useState<any[]>([]);
  const [loading,setLoading] = useState(true);
  useEffect(()=>{
    if(!merchantId){setLoading(false);return;}
    return onSnapshot(
      query(collection(db,"transactions"),where("merchantId","==",merchantId),orderBy("createdAt","desc"),limit(100)),
      s => { setTxns(s.docs.map(d=>({id:d.id,...d.data()}))); setLoading(false); },
      () => setLoading(false)
    );
  },[merchantId]);
  return {txns, loading};
}