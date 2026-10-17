/*
 * Real lines written by the worker on AMD Token Factory (Gemma) for three fictional sample brands, 17 Oct 2026.
 * Sources: evidence/phase1/dev-run-3-audiences-2026-10-17.json and sample-scripts-stride-mitti-2026-10-17.json.
 * Facts (prices, offers) are the brand's own values filled in by code, never written by the model.
 */

export type BrandKey = "chai" | "stride" | "mitti";

export type Sample = {
  id: string;
  brand: BrandKey;
  city: string;
  language: string;
  script: string;
  headline: string;
  price: string;
  offer: string;
  caption: string;
};

export const BRANDS: Record<BrandKey, { name: string; bg: string; fg: string; card: string; cardFg: string }> = {
  chai: { name: "Kettle & Kadak", bg: "#1d4d3f", fg: "#ffffff", card: "#F2B33D", cardFg: "#1b1b1b" },
  stride: { name: "Stride", bg: "#0b0b12", fg: "#ffffff", card: "#d1fe17", cardFg: "#05050a" },
  mitti: { name: "Mitti", bg: "#f6dfe6", fg: "#3b1d2a", card: "#5b41f8", cardFg: "#ffffff" },
};

export const SAMPLES: Sample[] = [
  { id: "chai-bn", brand: "chai", city: "Kolkata", language: "Bengali", script: "বাংলা", headline: "এক কাপ কড়া চা হবে?", price: "₹149", offer: "২টো কিনলে ১টা ফ্রি", caption: "সারাদিন খাটুনি? এক কাপ কড়া চা হোক!" },
  { id: "stride-it", brand: "stride", city: "Milan", language: "Italian", script: "Italiano", headline: "Inizia a correre.", price: "€59", offer: "Reso gratuito per 30 giorni", caption: "Non serve correre forte. Basta partire." },
  { id: "mitti-hi", brand: "mitti", city: "Lucknow", language: "Hindi", script: "हिन्दी", headline: "त्वचा को मिले आराम", price: "₹699", offer: "मुफ़्त डिलीवरी", caption: "आपकी त्वचा भी थक गई होगी।" },
  { id: "chai-hi", brand: "chai", city: "Lucknow", language: "Hindi", script: "हिन्दी", headline: "एक कड़क चाय हो जाए?", price: "₹149", offer: "2 खरीदें, 1 मुफ़्त", caption: "दिन भारी है? एक कड़क चाय हो जाए।" },
  { id: "stride-bn", brand: "stride", city: "Kolkata", language: "Bengali", script: "বাংলা", headline: "দৌড়ানো শুরু করো", price: "₹2,999", offer: "৩০ দিনে ফ্রি রিটার্ন", caption: "গতি নয়, শুধু শুরু করো।" },
  { id: "mitti-it", brand: "mitti", city: "Milan", language: "Italian", script: "Italiano", headline: "Pelle, pausa relax.", price: "€14", offer: "Spedizione gratuita", caption: "Anche la tua pelle è stanca." },
  { id: "chai-it", brand: "chai", city: "Milan", language: "Italian", script: "Italiano", headline: "Voglia di un vero chai?", price: "€4,90", offer: "Prendi 3, paghi 2", caption: "Giornata infinita? Ti serve un vero chai." },
  { id: "stride-hi", brand: "stride", city: "Lucknow", language: "Hindi", script: "हिन्दी", headline: "बस दौड़ना शुरू करें", price: "₹2,999", offer: "30 दिन में मुफ़्त वापसी", caption: "रफ़्तार नहीं, बस शुरुआत ज़रूरी है।" },
  { id: "mitti-bn", brand: "mitti", city: "Kolkata", language: "Bengali", script: "বাংলা", headline: "ত্বককেও দাও একটু ছুটি", price: "₹699", offer: "ফ্রি ডেলিভারি", caption: "তোমার ত্বকেরও তো বিশ্রাম চাই।" },
  { id: "chai-en", brand: "chai", city: "Global", language: "English", script: "English", headline: "Time for a proper chai?", price: "₹149", offer: "Buy 2, get 1 free", caption: "Big day ahead? Treat yourself to a proper chai." },
  { id: "stride-en", brand: "stride", city: "Global", language: "English", script: "English", headline: "Just start running.", price: "₹2,999", offer: "Free returns for 30 days", caption: "Don't worry about speed. Just get moving." },
  { id: "mitti-en", brand: "mitti", city: "Global", language: "English", script: "English", headline: "Time for a reset.", price: "₹699", offer: "Free shipping", caption: "Your skin needs a little reset." },
];

export const byId = (id: string) => SAMPLES.find((s) => s.id === id)!;
