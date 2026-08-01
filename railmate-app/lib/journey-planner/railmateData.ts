/**
 * RailMate Bangladesh — Verified Knowledge Graph Data
 * -----------------------------------------------------
 * REGENERATED 2026-07-19 from data/trains_fixed.json,
 * data/train_stops_fixed.json, and data/stations.json — the same
 * PDF-verified source used by scripts/generate_canonical_seed.mjs
 * for the production Supabase database.
 *
 * PREVIOUS VERSION REPLACED: the prior file in this location used
 * 0%-verified fabricated/interpolated data (training-memory guesses
 * and duration interpolation, not sourced from any official BR
 * publication) and was never authorized for production use.
 *
 * confidenceGroup now reflects real provenance tiers, not the old
 * fabricated scale (see PROVENANCE_AUDIT_FINAL.md):
 *   g1 = VERIFIED_PDF / VERIFIED_PDF_STATION — western zone text-layer
 *        PDF, direct column read. Highest confidence.
 *   g2 = VERIFIED_IMG — eastern zone scanned-image PDF, vision-read.
 *   g3 = PDF_SUMMARY_COMMUTER(_MAIL) — official PDF summary table,
 *        origin+destination only, no intermediate stop times.
 *   g4 = no verified stop data found for this train number.
 *
 * This file encodes topology (which stations a train serves, in order)
 * for the multi-transfer route planner. It does NOT encode display
 * times — use Supabase train_stops for verified arrival/departure
 * times, never this file.
 *
 * STATUS: This module is not currently linked from app navigation
 * (see app/_layout.tsx — the previous global mount was removed
 * 2026-07-19 because it rendered fabricated-data results over every
 * screen in the app, outside the routing system). If you wire it
 * back in, do so as a proper routed screen, and prefer querying
 * Supabase directly over this static snapshot, which will drift as
 * the database is updated.
 */

import type { TrainMeta, Station } from './routeEngine';

export const STATIONS: Station[] = [
  { code: 'DHKA', nameEn: 'Dhaka (Kamalapur)', nameBn: 'ঢাকা (কমলাপুর)', shohozCity: 'DHAKA', division: 'Dhaka', isHub: true },
  { code: 'DABB', nameEn: 'Dhaka Airport', nameBn: 'ঢাকা বিমানবন্দর', shohozCity: 'DHAKA AIRPORT', division: 'Dhaka', isHub: false },
  { code: 'DHCA', nameEn: 'Dhaka Cantonment', nameBn: 'ঢাকা ক্যান্টনমেন্ট', shohozCity: 'DHAKA CANTONMENT', division: 'Dhaka', isHub: false },
  { code: 'BNNI', nameEn: 'Banani', nameBn: 'বনানী', shohozCity: 'BANANI', division: 'Dhaka', isHub: false },
  { code: 'TJG', nameEn: 'Tejgaon', nameBn: 'তেজগাঁও', shohozCity: 'TEJGAON', division: 'Dhaka', isHub: false },
  { code: 'TNG', nameEn: 'Tongi', nameBn: 'টঙ্গী', shohozCity: 'TONGI', division: 'Dhaka', isHub: false },
  { code: 'JDP', nameEn: 'Joydebpur', nameBn: 'জয়দেবপুর', shohozCity: 'JOYDEBPUR', division: 'Dhaka', isHub: false },
  { code: 'NSD', nameEn: 'Narsingdi', nameBn: 'নরসিংদী', shohozCity: 'NARSINGDI', division: 'Dhaka', isHub: false },
  { code: 'BBZ', nameEn: 'Bhairab Bazar', nameBn: 'ভৈরব বাজার', shohozCity: 'BHAIRAB BAZAR', division: 'Dhaka', isHub: false },
  { code: 'NRG', nameEn: 'Narayanganj', nameBn: 'নারায়ণগঞ্জ', shohozCity: 'NARAYANGANJ', division: 'Dhaka', isHub: false },
  { code: 'CTG', nameEn: 'Chattogram', nameBn: 'চট্টগ্রাম', shohozCity: 'CHATTOGRAM', division: 'Chittagong', isHub: true },
  { code: 'COM', nameEn: 'Comilla', nameBn: 'কুমিল্লা', shohozCity: 'COMILLA', division: 'Chittagong', isHub: false },
  { code: 'AKH', nameEn: 'Akhaura', nameBn: 'আখাউড়া', shohozCity: 'AKHAURA', division: 'Chittagong', isHub: false },
  { code: 'LKS', nameEn: 'Laksam', nameBn: 'লাকসাম', shohozCity: 'LAKSAM', division: 'Chittagong', isHub: false },
  { code: 'NOA', nameEn: 'Noakhali', nameBn: 'নোয়াখালী', shohozCity: 'NOAKHALI', division: 'Chittagong', isHub: false },
  { code: 'CDP', nameEn: 'Chandpur', nameBn: 'চাঁদপুর', shohozCity: 'CHANDPUR', division: 'Chittagong', isHub: false },
  { code: 'CXBZ', nameEn: 'Cox\'s Bazar', nameBn: 'কক্সবাজার', shohozCity: 'COX\'S BAZAR', division: 'Chittagong', isHub: false },
  { code: 'SYT', nameEn: 'Sylhet', nameBn: 'সিলেট', shohozCity: 'SYLHET', division: 'Sylhet', isHub: true },
  { code: 'SRM', nameEn: 'Sreemangal', nameBn: 'শ্রীমঙ্গল', shohozCity: 'SREEMANGAL', division: 'Sylhet', isHub: false },
  { code: 'KLR', nameEn: 'Kulaura', nameBn: 'কুলাউড়া', shohozCity: 'KULAURA', division: 'Sylhet', isHub: false },
  { code: 'KSG', nameEn: 'Kishoreganj', nameBn: 'কিশোরগঞ্জ', shohozCity: 'KISHOREGANJ', division: 'Dhaka', isHub: false },
  { code: 'MYM', nameEn: 'Mymensingh', nameBn: 'ময়মনসিংহ', shohozCity: 'MYMENSINGH', division: 'Mymensingh', isHub: true },
  { code: 'JMP', nameEn: 'Jamalpur', nameBn: 'জামালপুর', shohozCity: 'JAMALPUR', division: 'Mymensingh', isHub: false },
  { code: 'NTK', nameEn: 'Netrokona', nameBn: 'নেত্রকোণা', shohozCity: 'NETROKONA', division: 'Mymensingh', isHub: false },
  { code: 'RAJ', nameEn: 'Rajshahi', nameBn: 'রাজশাহী', shohozCity: 'RAJSHAHI', division: 'Rajshahi', isHub: true },
  { code: 'NTR', nameEn: 'Natore', nameBn: 'নাটোর', shohozCity: 'NATORE', division: 'Rajshahi', isHub: false },
  { code: 'IWD', nameEn: 'Ishwardi', nameBn: 'ঈশ্বরদী', shohozCity: 'ISHWARDI', division: 'Rajshahi', isHub: false },
  { code: 'STH', nameEn: 'Santahar', nameBn: 'সান্তাহার', shohozCity: 'SANTAHAR', division: 'Rajshahi', isHub: false },
  { code: 'BOG', nameEn: 'Bogura', nameBn: 'বগুড়া', shohozCity: 'BOGURA', division: 'Rajshahi', isHub: false },
  { code: 'SJG', nameEn: 'Sirajganj', nameBn: 'সিরাজগঞ্জ', shohozCity: 'SIRAJGANJ', division: 'Rajshahi', isHub: false },
  { code: 'JPH', nameEn: 'Joypurhat', nameBn: 'জয়পুরহাট', shohozCity: 'JOYPURHAT', division: 'Rajshahi', isHub: false },
  { code: 'CPN', nameEn: 'Chapai Nawabganj', nameBn: 'চাঁপাইনবাবগঞ্জ', shohozCity: 'CHAPAINAWABGANJ', division: 'Rajshahi', isHub: false },
  { code: 'PBP', nameEn: 'Parbatipur', nameBn: 'পার্বতীপুর', shohozCity: 'PARBATIPUR', division: 'Rangpur', isHub: false },
  { code: 'DNJ', nameEn: 'Dinajpur', nameBn: 'দিনাজপুর', shohozCity: 'DINAJPUR', division: 'Rangpur', isHub: false },
  { code: 'RNG', nameEn: 'Rangpur', nameBn: 'রংপুর', shohozCity: 'RANGPUR', division: 'Rangpur', isHub: false },
  { code: 'LMH', nameEn: 'Lalmonirhat', nameBn: 'লালমনিরহাট', shohozCity: 'LALMONIRHAT', division: 'Rangpur', isHub: false },
  { code: 'PCG', nameEn: 'Panchagarh', nameBn: 'পঞ্চগড়', shohozCity: 'PANCHAGARH', division: 'Rangpur', isHub: false },
  { code: 'KRG', nameEn: 'Kurigram', nameBn: 'কুড়িগ্রাম', shohozCity: 'KURIGRAM', division: 'Rangpur', isHub: false },
  { code: 'CLH', nameEn: 'Chilahati', nameBn: 'চিলাহাটি', shohozCity: 'CHILAHATI', division: 'Rangpur', isHub: false },
  { code: 'KHU', nameEn: 'Khulna', nameBn: 'খুলনা', shohozCity: 'KHULNA', division: 'Khulna', isHub: true },
  { code: 'JS', nameEn: 'Jessore (Jashore)', nameBn: 'যশোর', shohozCity: 'JASHORE', division: 'Khulna', isHub: false },
  { code: 'BNP', nameEn: 'Benapole', nameBn: 'বেনাপোল', shohozCity: 'BENAPOLE', division: 'Khulna', isHub: false },
  { code: 'RPS', nameEn: 'Rupsha', nameBn: 'রূপসা', shohozCity: 'RUPSHA', division: 'Khulna', isHub: false },
  { code: 'BRL', nameEn: 'Barisal', nameBn: 'বরিশাল', shohozCity: 'BARISAL', division: 'Barisal', isHub: false },
  { code: 'FRP', nameEn: 'Faridpur', nameBn: 'ফরিদপুর', shohozCity: 'FARIDPUR', division: 'Dhaka', isHub: false },
  { code: 'RBR', nameEn: 'Rajbari', nameBn: 'রাজবাড়ী', shohozCity: 'RAJBARI', division: 'Dhaka', isHub: false },
  { code: 'TGL', nameEn: 'Tangail', nameBn: 'টাঙ্গাইল', shohozCity: 'TANGAIL', division: 'Dhaka', isHub: false },
  { code: 'GZP', nameEn: 'Gazipur', nameBn: 'গাজীপুর', shohozCity: 'GAZIPUR', division: 'Dhaka', isHub: false },
  { code: 'GBD', nameEn: 'Gaibandha', nameBn: 'গাইবান্ধা', shohozCity: 'GAIBANDHA', division: 'Rangpur', isHub: false },
  { code: 'PBN', nameEn: 'Pabna', nameBn: 'পাবনা', shohozCity: 'PABNA', division: 'Rajshahi', isHub: false },
  { code: 'ULP', nameEn: 'Ullapara', nameBn: 'উল্লাপাড়া', shohozCity: 'ULLAPARA', division: 'Rajshahi', isHub: false },
  { code: 'BMR', nameEn: 'Burimari', nameBn: 'বুড়িমারী', shohozCity: 'BURIMARI', division: 'Rangpur', isHub: false },
  { code: 'IBD', nameEn: 'Ibrahimabad', nameBn: 'ইব্রাহিমাবাদ', shohozCity: 'IBRAHIMABAD', division: 'Rajshahi', isHub: false },
  { code: 'SMA', nameEn: 'SM Ali', nameBn: 'শহীদ এম এম আলী', shohozCity: 'SM ALI', division: 'Rajshahi', isHub: false },
  { code: 'IWDB', nameEn: 'Ishwardi Bypass', nameBn: 'ঈশ্বরদী বাইপাস', shohozCity: 'ISHWARDI BYPASS', division: 'Rajshahi', isHub: false },
  { code: 'BAL', nameEn: 'Baralshi Bridge', nameBn: 'বড়ালশী ব্রিজ', shohozCity: 'BARALSHI', division: 'Rajshahi', isHub: false },
  { code: 'CTM', nameEn: 'Chatmohar', nameBn: 'চাটমোহর', shohozCity: 'CHATMOHAR', division: 'Rajshahi', isHub: false },
  { code: 'ALP', nameEn: 'Alipour', nameBn: 'আলীপুর', shohozCity: 'ALIPOUR', division: 'Rajshahi', isHub: false },
  { code: 'MDN', nameEn: 'Madhanagar', nameBn: 'মাধনগর', shohozCity: 'MADHANAGAR', division: 'Rajshahi', isHub: false },
  { code: 'AHG', nameEn: 'Ahsanganj', nameBn: 'আহসানগঞ্জ', shohozCity: 'AHSANGANJ', division: 'Rajshahi', isHub: false },
  { code: 'PCB', nameEn: 'Panchibabi', nameBn: 'পাঁচবিবি', shohozCity: 'PANCHIBABI', division: 'Rajshahi', isHub: false },
  { code: 'BRM', nameEn: 'Birampur', nameBn: 'বিরামপুর', shohozCity: 'BIRAMPUR', division: 'Rangpur', isHub: false },
  { code: 'FLB', nameEn: 'Fulbari', nameBn: 'ফুলবাড়ী', shohozCity: 'FULBARI', division: 'Rangpur', isHub: false },
  { code: 'CRB', nameEn: 'Chirirbandar', nameBn: 'চিরিরবন্দর', shohozCity: 'CHIRIRBANDAR', division: 'Rangpur', isHub: false },
  { code: 'STB', nameEn: 'Setabganj', nameBn: 'সেতাবগঞ্জ', shohozCity: 'SETABGANJ', division: 'Rangpur', isHub: false },
  { code: 'PRJ', nameEn: 'Pirganj', nameBn: 'পীরগঞ্জ', shohozCity: 'PIRGANJ', division: 'Rangpur', isHub: false },
  { code: 'TKG', nameEn: 'Thakurgaon', nameBn: 'ঠাকুরগাঁও', shohozCity: 'THAKURGAON', division: 'Rangpur', isHub: false },
  { code: 'RHI', nameEn: 'Ruhia', nameBn: 'রুহিয়া', shohozCity: 'RUHIA', division: 'Rangpur', isHub: false },
  { code: 'KSM', nameEn: 'Kismat', nameBn: 'কিসমত', shohozCity: 'KISMAT', division: 'Rangpur', isHub: false },
  { code: 'SYP', nameEn: 'Saidpur', nameBn: 'সৈয়দপুর', shohozCity: 'SAIDPUR', division: 'Rangpur', isHub: false },
  { code: 'NLF', nameEn: 'Nilphamari', nameBn: 'নীলফামারী', shohozCity: 'NILPHAMARI', division: 'Rangpur', isHub: false },
  { code: 'DOM', nameEn: 'Domar', nameBn: 'ডোমার', shohozCity: 'DOMAR', division: 'Rangpur', isHub: false },
  { code: 'ADT', nameEn: 'Aditmari', nameBn: 'আদিতমারী', shohozCity: 'ADITMARI', division: 'Rangpur', isHub: false },
  { code: 'KKN', nameEn: 'Kakina', nameBn: 'কাকিনা', shohozCity: 'KAKINA', division: 'Rangpur', isHub: false },
  { code: 'SLB', nameEn: 'Soulbhyar', nameBn: 'সৌলভ্যার', shohozCity: 'SOULBHYAR', division: 'Rangpur', isHub: false },
  { code: 'HTB', nameEn: 'Hatibandha', nameBn: 'হাতিবান্ধা', shohozCity: 'HATIBANDHA', division: 'Rangpur', isHub: false },
  { code: 'BKT', nameEn: 'Barkhat', nameBn: 'বড়খাতা', shohozCity: 'BARKHAT', division: 'Rangpur', isHub: false },
  { code: 'BWR', nameEn: 'Baura', nameBn: 'বাউড়া', shohozCity: 'BAURA', division: 'Rangpur', isHub: false },
  { code: 'PTG', nameEn: 'Patgram', nameBn: 'পাটগ্রাম', shohozCity: 'PATGRAM', division: 'Rangpur', isHub: false },
  { code: 'TST', nameEn: 'Tista', nameBn: 'তিস্তা', shohozCity: 'TISTA', division: 'Rangpur', isHub: false },
  { code: 'KWN', nameEn: 'Kaunia', nameBn: 'কাউনিয়া', shohozCity: 'KAUNIA', division: 'Rangpur', isHub: false },
  { code: 'PGC', nameEn: 'Pirgacha', nameBn: 'পীরগাছা', shohozCity: 'PIRGACHA', division: 'Rangpur', isHub: false },
  { code: 'BMD', nameEn: 'Bamondanga', nameBn: 'বামনডাঙ্গা', shohozCity: 'BAMONDANGA', division: 'Rangpur', isHub: false },
  { code: 'BNP2', nameEn: 'Bonarpara', nameBn: 'বোনারপাড়া', shohozCity: 'BONARPARA', division: 'Rajshahi', isHub: false },
  { code: 'SNT', nameEn: 'Sonatala', nameBn: 'সোনাতলা', shohozCity: 'SONATALA', division: 'Rajshahi', isHub: false },
  { code: 'MHG', nameEn: 'Mohimaganj', nameBn: 'মহিমাগঞ্জ', shohozCity: 'MOHIMAGANJ', division: 'Rajshahi', isHub: false },
  { code: 'BDG', nameEn: 'Badarganj', nameBn: 'বদরগঞ্জ', shohozCity: 'BADARGANJ', division: 'Rangpur', isHub: false },
  { code: 'NWP', nameEn: 'Noapara', nameBn: 'নোয়াপাড়া', shohozCity: 'NOAPARA', division: 'Khulna', isHub: false },
  { code: 'MBG', nameEn: 'Mobarakganj', nameBn: 'মোবারকগঞ্জ', shohozCity: 'MOBARAKGANJ', division: 'Khulna', isHub: false },
  { code: 'KCP', nameEn: 'Kotchandpur', nameBn: 'কোটচাঁদপুর', shohozCity: 'KOTCHANDPUR', division: 'Khulna', isHub: false },
  { code: 'SFP', nameEn: 'Safdaripur', nameBn: 'সাফদারপুর', shohozCity: 'SAFDARIPUR', division: 'Khulna', isHub: false },
  { code: 'DSH', nameEn: 'Darshana Halt', nameBn: 'দর্শনা হল্ট', shohozCity: 'DARSHANA HALT', division: 'Khulna', isHub: false },
  { code: 'CWD', nameEn: 'Chuadanga', nameBn: 'চুয়াডাঙ্গা', shohozCity: 'CHUADANGA', division: 'Khulna', isHub: false },
  { code: 'ALD', nameEn: 'Alamdanga', nameBn: 'আলমডাঙ্গা', shohozCity: 'ALAMDANGA', division: 'Khulna', isHub: false },
  { code: 'PDA', nameEn: 'Poradaha', nameBn: 'পোড়াদহ', shohozCity: 'PORADAHA', division: 'Khulna', isHub: false },
  { code: 'MZP', nameEn: 'Mirzapur', nameBn: 'মির্জাপুর', shohozCity: 'MIRZAPUR', division: 'Khulna', isHub: false },
  { code: 'BMA', nameEn: 'Bheramara', nameBn: 'ভেড়ামারা', shohozCity: 'BHERAMARA', division: 'Khulna', isHub: false },
  { code: 'PKS', nameEn: 'Pakshi', nameBn: 'পাকশী', shohozCity: 'PAKSHI', division: 'Rajshahi', isHub: false },
  { code: 'AZN', nameEn: 'Azimnagor', nameBn: 'আজিমনগর', shohozCity: 'AZIMNAGOR', division: 'Rajshahi', isHub: false },
  { code: 'SDR', nameEn: 'Sardah Road', nameBn: 'সরদহ রোড', shohozCity: 'SARDAH ROAD', division: 'Rajshahi', isHub: false },
  { code: 'ARA', nameEn: 'Arani', nameBn: 'আড়ানী', shohozCity: 'ARANI', division: 'Rajshahi', isHub: false },
  { code: 'DLC', nameEn: 'Dhalarchar', nameBn: 'ঢালারচর', shohozCity: 'DHALARCHAR', division: 'Rajshahi', isHub: false },
  { code: 'GBR', nameEn: 'Gobra', nameBn: 'গোবরা', shohozCity: 'GOBRA', division: 'Khulna', isHub: false },
  { code: 'DLT', nameEn: 'Daultapur', nameBn: 'দৌলতপুর', shohozCity: 'DAULTAPUR', division: 'Khulna', isHub: false },
  { code: 'SRK', nameEn: 'Srishtikote', nameBn: 'শ্রীস্টিকোট', shohozCity: 'SRISHTIKOTE', division: 'Khulna', isHub: false },
  { code: 'PAN', nameEn: 'Pangsha', nameBn: 'পাংশা', shohozCity: 'PANGSHA', division: 'Dhaka', isHub: false },
  { code: 'BNG', nameEn: 'Bhanga', nameBn: 'ভাঙ্গা', shohozCity: 'BHANGA', division: 'Dhaka', isHub: false },
  { code: 'MAW', nameEn: 'Mawa', nameBn: 'মাওয়া', shohozCity: 'MAWA', division: 'Dhaka', isHub: false },
  { code: 'PDM', nameEn: 'Padma', nameBn: 'পদ্মা', shohozCity: 'PADMA', division: 'Dhaka', isHub: false },
  { code: 'SBR', nameEn: 'Shibchar', nameBn: 'শিবচর', shohozCity: 'SHIBCHAR', division: 'Dhaka', isHub: false },
  { code: 'TLM', nameEn: 'Talma', nameBn: 'তালমা', shohozCity: 'TALMA', division: 'Barisal', isHub: false },
  { code: 'AMB', nameEn: 'Amirabad', nameBn: 'আমিরাবাদ', shohozCity: 'AMIRABAD', division: 'Barisal', isHub: false },
  { code: 'PCR', nameEn: 'Pachuria', nameBn: 'পাচুরিয়া', shohozCity: 'PACHURIA', division: 'Khulna', isHub: false },
  { code: 'KMK', nameEn: 'Kmarkhali', nameBn: 'কামারখালী', shohozCity: 'KAMARKHALI', division: 'Khulna', isHub: false },
  { code: 'KKS', nameEn: 'Khoksha', nameBn: 'খোকসা', shohozCity: 'KHOKSHA', division: 'Khulna', isHub: false },
  { code: 'JKG', nameEn: 'Jhikargacha', nameBn: 'ঝিকরগাছা', shohozCity: 'JHIKARGACHA', division: 'Khulna', isHub: false },
  { code: 'NRL', nameEn: 'Narail', nameBn: 'নড়াইল', shohozCity: 'NARAIL', division: 'Khulna', isHub: false },
  { code: 'KSY', nameEn: 'Kashiani', nameBn: 'কাশিয়ানী', shohozCity: 'KASHIANI', division: 'Khulna', isHub: false },
  { code: 'FNI', nameEn: 'Feni', nameBn: 'ফেনী', shohozCity: 'FENI', division: 'Chittagong', isHub: false },
  { code: 'BRB', nameEn: 'Brahmanbaria', nameBn: 'ব্রাহ্মণবাড়িয়া', shohozCity: 'BRAHMANBARIA', division: 'Chittagong', isHub: false },
  { code: 'DWG', nameEn: 'Dewanganj Bazar', nameBn: 'দেওয়ানগঞ্জ বাজার', shohozCity: 'DEWANGANJ BAZAR', division: 'Mymensingh', isHub: false },
  { code: 'TRK', nameEn: 'Tarakandi', nameBn: 'তারাকান্দি', shohozCity: 'TARAKANDI', division: 'Mymensingh', isHub: false },
  { code: 'MHJ', nameEn: 'Mohonganj', nameBn: 'মোহনগঞ্জ', shohozCity: 'MOHONGANJ', division: 'Mymensingh', isHub: false },
  { code: 'YSR', nameEn: 'Jolshohore', nameBn: 'যলশহর', shohozCity: 'JOLSHOHORE', division: 'Chittagong', isHub: false },
  { code: 'JAL', nameEn: 'Janalihaat', nameBn: 'জানালিহাট', shohozCity: 'JANALIHAAT', division: 'Chittagong', isHub: false },
  { code: 'PTY', nameEn: 'Patiya', nameBn: 'পটিয়া', shohozCity: 'PATIYA', division: 'Chittagong', isHub: false },
  { code: 'GOM', nameEn: 'Gomdovi', nameBn: 'গোমদণ্ডী', shohozCity: 'GOMDOVI', division: 'Chittagong', isHub: false },
  { code: 'STK', nameEn: 'Satkania', nameBn: 'সাতকানিয়া', shohozCity: 'SATKANIA', division: 'Chittagong', isHub: false },
  { code: 'LHG', nameEn: 'Lohagara', nameBn: 'লোহাগাড়া', shohozCity: 'LOHAGARA', division: 'Chittagong', isHub: false },
  { code: 'HRB', nameEn: 'Harbang', nameBn: 'হারবাং', shohozCity: 'HARBANG', division: 'Chittagong', isHub: false },
  { code: 'CKR', nameEn: 'Chakaria', nameBn: 'চকরিয়া', shohozCity: 'CHAKARIA', division: 'Chittagong', isHub: false },
  { code: 'DLH', nameEn: 'Dulahazra', nameBn: 'দুলাহাজরা', shohozCity: 'DULAHAZRA', division: 'Chittagong', isHub: false },
  { code: 'ISM', nameEn: 'Islamabad', nameBn: 'ইসলামাবাদ', shohozCity: 'ISLAMABAD', division: 'Chittagong', isHub: false },
  { code: 'RAMU', nameEn: 'Ramu', nameBn: 'রামু', shohozCity: 'RAMU', division: 'Chittagong', isHub: false },
  { code: 'DHA2', nameEn: 'Dohazari', nameBn: 'দোহাজারী', shohozCity: 'DOHAZARI', division: 'Chittagong', isHub: false },
  { code: 'RHN', nameEn: 'Rohanpur', nameBn: 'রহনপুর', shohozCity: 'ROHANPUR', division: 'Rajshahi', isHub: false },
  { code: 'BRL2', nameEn: 'Birol', nameBn: 'বিরল', shohozCity: 'BIROL', division: 'Rangpur', isHub: false },
  { code: 'MGL', nameEn: 'Mongla', nameBn: 'মোংলা', shohozCity: 'MONGLA', division: 'Khulna', isHub: false },
  { code: 'BZP', nameEn: 'Bajitpur', nameBn: 'বাজিতপুর', shohozCity: 'BAJITPUR', division: 'Dhaka', isHub: false },
];

export const TRAINS: TrainMeta[] = [
  { number: 735, name: 'Aghnibina Express', type: 'intercity', confidenceGroup: 'g2' }, // VERIFIED_IMG
  { number: 736, name: 'Aghnibina Express', type: 'intercity', confidenceGroup: 'g2' }, // VERIFIED_IMG
  { number: 791, name: 'Banalata Express', type: 'intercity', confidenceGroup: 'g1' }, // VERIFIED_PDF
  { number: 792, name: 'Banalata Express', type: 'intercity', confidenceGroup: 'g1' }, // VERIFIED_PDF
  { number: 803, name: 'Banglabandha Express', type: 'intercity', confidenceGroup: 'g1' }, // VERIFIED_PDF
  { number: 804, name: 'Banglabandha Express', type: 'intercity', confidenceGroup: 'g1' }, // VERIFIED_PDF
  { number: 731, name: 'Barendra Express', type: 'intercity', confidenceGroup: 'g1' }, // VERIFIED_PDF
  { number: 732, name: 'Barendra Express', type: 'intercity', confidenceGroup: 'g1' }, // VERIFIED_PDF
  { number: 795, name: 'Benapole Express', type: 'intercity', confidenceGroup: 'g1' }, // VERIFIED_PDF
  { number: 796, name: 'Benapole Express', type: 'intercity', confidenceGroup: 'g1' }, // VERIFIED_PDF
  { number: 785, name: 'Bijoy Express', type: 'intercity', confidenceGroup: 'g2' }, // VERIFIED_IMG
  { number: 786, name: 'Bijoy Express', type: 'intercity', confidenceGroup: 'g2' }, // VERIFIED_IMG
  { number: 743, name: 'Brahmaputra Express', type: 'intercity', confidenceGroup: 'g2' }, // VERIFIED_IMG
  { number: 744, name: 'Brahmaputra Express', type: 'intercity', confidenceGroup: 'g2' }, // VERIFIED_IMG
  { number: 809, name: 'Burimari Express', type: 'intercity', confidenceGroup: 'g1' }, // VERIFIED_PDF
  { number: 810, name: 'Burimari Express', type: 'intercity', confidenceGroup: 'g1' }, // VERIFIED_PDF
  { number: 109, name: 'Chapainawabganj Shuttle', type: 'commuter', confidenceGroup: 'g3' }, // PDF_SUMMARY_COMMUTER
  { number: 110, name: 'Chapainawabganj Shuttle', type: 'commuter', confidenceGroup: 'g3' }, // PDF_SUMMARY_COMMUTER
  { number: 801, name: 'Chattala Express', type: 'intercity', confidenceGroup: 'g2' }, // VERIFIED_IMG
  { number: 802, name: 'Chattala Express', type: 'intercity', confidenceGroup: 'g2' }, // VERIFIED_IMG
  { number: 805, name: 'Chilahati Express', type: 'intercity', confidenceGroup: 'g1' }, // VERIFIED_PDF
  { number: 806, name: 'Chilahati Express', type: 'intercity', confidenceGroup: 'g1' }, // VERIFIED_PDF
  { number: 763, name: 'Chitra Express', type: 'intercity', confidenceGroup: 'g1' }, // VERIFIED_PDF
  { number: 764, name: 'Chitra Express', type: 'intercity', confidenceGroup: 'g1' }, // VERIFIED_PDF
  { number: 813, name: 'Cox\'s Bazar Express', type: 'intercity', confidenceGroup: 'g2' }, // VERIFIED_IMG
  { number: 814, name: 'Cox\'s Bazar Express', type: 'intercity', confidenceGroup: 'g2' }, // VERIFIED_IMG
  { number: 769, name: 'Dhumketu Express', type: 'intercity', confidenceGroup: 'g1' }, // VERIFIED_PDF
  { number: 770, name: 'Dhumketu Express', type: 'intercity', confidenceGroup: 'g1' }, // VERIFIED_PDF
  { number: 779, name: 'Dhalarchar Express', type: 'intercity', confidenceGroup: 'g1' }, // VERIFIED_PDF
  { number: 780, name: 'Dhalarchar Express', type: 'intercity', confidenceGroup: 'g1' }, // VERIFIED_PDF
  { number: 767, name: 'Dolonchapa Express', type: 'intercity', confidenceGroup: 'g1' }, // VERIFIED_PDF
  { number: 768, name: 'Dolonchapa Express', type: 'intercity', confidenceGroup: 'g1' }, // VERIFIED_PDF
  { number: 757, name: 'Drutojan Express', type: 'intercity', confidenceGroup: 'g1' }, // VERIFIED_PDF
  { number: 758, name: 'Drutojan Express', type: 'intercity', confidenceGroup: 'g1' }, // VERIFIED_PDF
  { number: 749, name: 'Egarosindhur Godhuli', type: 'intercity', confidenceGroup: 'g2' }, // VERIFIED_IMG
  { number: 750, name: 'Egarosindhur Godhuli', type: 'intercity', confidenceGroup: 'g2' }, // VERIFIED_IMG
  { number: 737, name: 'Egarosindhur Provati', type: 'intercity', confidenceGroup: 'g2' }, // VERIFIED_IMG
  { number: 738, name: 'Egarosindhur Provati', type: 'intercity', confidenceGroup: 'g2' }, // VERIFIED_IMG
  { number: 705, name: 'Ekota Express', type: 'intercity', confidenceGroup: 'g1' }, // VERIFIED_PDF
  { number: 706, name: 'Ekota Express', type: 'intercity', confidenceGroup: 'g1' }, // VERIFIED_PDF
  { number: 777, name: 'Hawr Express', type: 'intercity', confidenceGroup: 'g2' }, // VERIFIED_IMG
  { number: 778, name: 'Hawr Express', type: 'intercity', confidenceGroup: 'g2' }, // VERIFIED_IMG
  { number: 825, name: 'Jahanabad Express', type: 'intercity', confidenceGroup: 'g1' }, // VERIFIED_PDF
  { number: 826, name: 'Jahanabad Express', type: 'intercity', confidenceGroup: 'g1' }, // VERIFIED_PDF
  { number: 799, name: 'Jamalpur Express', type: 'intercity', confidenceGroup: 'g2' }, // VERIFIED_IMG
  { number: 800, name: 'Jamalpur Express', type: 'intercity', confidenceGroup: 'g2' }, // VERIFIED_IMG
  { number: 745, name: 'Jamuna Express', type: 'intercity', confidenceGroup: 'g2' }, // VERIFIED_IMG
  { number: 746, name: 'Jamuna Express', type: 'intercity', confidenceGroup: 'g2' }, // VERIFIED_IMG
  { number: 717, name: 'Jayantika Express', type: 'intercity', confidenceGroup: 'g2' }, // VERIFIED_IMG
  { number: 718, name: 'Jayantika Express', type: 'intercity', confidenceGroup: 'g2' }, // VERIFIED_IMG
  { number: 773, name: 'Kalni Express', type: 'intercity', confidenceGroup: 'g2' }, // VERIFIED_IMG
  { number: 774, name: 'Kalni Express', type: 'intercity', confidenceGroup: 'g2' }, // VERIFIED_IMG
  { number: 41, name: 'Kanchon Intercity Commuter', type: 'commuter', confidenceGroup: 'g3' }, // PDF_SUMMARY_COMMUTER
  { number: 42, name: 'Kanchon Intercity Commuter', type: 'commuter', confidenceGroup: 'g3' }, // PDF_SUMMARY_COMMUTER
  { number: 715, name: 'Kapotaksha Express', type: 'intercity', confidenceGroup: 'g1' }, // VERIFIED_PDF
  { number: 716, name: 'Kapotaksha Express', type: 'intercity', confidenceGroup: 'g1' }, // VERIFIED_PDF
  { number: 781, name: 'Kishoreganj Express', type: 'intercity', confidenceGroup: 'g2' }, // VERIFIED_IMG
  { number: 782, name: 'Kishoreganj Express', type: 'intercity', confidenceGroup: 'g2' }, // VERIFIED_IMG
  { number: 713, name: 'Korotoa Express', type: 'intercity', confidenceGroup: 'g1' }, // VERIFIED_PDF
  { number: 714, name: 'Korotoa Express', type: 'intercity', confidenceGroup: 'g1' }, // VERIFIED_PDF
  { number: 797, name: 'Kurigram Express', type: 'intercity', confidenceGroup: 'g1' }, // VERIFIED_PDF
  { number: 798, name: 'Kurigram Express', type: 'intercity', confidenceGroup: 'g1' }, // VERIFIED_PDF
  { number: 751, name: 'Lalmoni Express', type: 'intercity', confidenceGroup: 'g1' }, // VERIFIED_PDF
  { number: 752, name: 'Lalmoni Express', type: 'intercity', confidenceGroup: 'g1' }, // VERIFIED_PDF
  { number: 755, name: 'Madhumati Express', type: 'intercity', confidenceGroup: 'g1' }, // VERIFIED_PDF
  { number: 756, name: 'Madhumati Express', type: 'intercity', confidenceGroup: 'g1' }, // VERIFIED_PDF
  { number: 703, name: 'Mahanagar Godhuli', type: 'intercity', confidenceGroup: 'g2' }, // VERIFIED_IMG
  { number: 704, name: 'Mahanagar Provati', type: 'intercity', confidenceGroup: 'g2' }, // VERIFIED_IMG
  { number: 729, name: 'Meghna Express', type: 'intercity', confidenceGroup: 'g2' }, // VERIFIED_IMG
  { number: 730, name: 'Meghna Express', type: 'intercity', confidenceGroup: 'g2' }, // VERIFIED_IMG
  { number: 721, name: 'Mohanagar Express', type: 'intercity', confidenceGroup: 'g1' }, // VERIFIED_PDF_STATION
  { number: 722, name: 'Mohanagar Express', type: 'intercity', confidenceGroup: 'g1' }, // VERIFIED_PDF_STATION
  { number: 789, name: 'Mohonganj Express', type: 'intercity', confidenceGroup: 'g2' }, // VERIFIED_IMG
  { number: 790, name: 'Mohonganj Express', type: 'intercity', confidenceGroup: 'g2' }, // VERIFIED_IMG
  { number: 765, name: 'Nilsagar Express', type: 'intercity', confidenceGroup: 'g1' }, // VERIFIED_PDF
  { number: 766, name: 'Nilsagar Express', type: 'intercity', confidenceGroup: 'g1' }, // VERIFIED_PDF
  { number: 759, name: 'Padma Express', type: 'intercity', confidenceGroup: 'g1' }, // VERIFIED_PDF
  { number: 760, name: 'Padma Express', type: 'intercity', confidenceGroup: 'g1' }, // VERIFIED_PDF
  { number: 719, name: 'Paharika Express', type: 'intercity', confidenceGroup: 'g2' }, // VERIFIED_IMG
  { number: 720, name: 'Paharika Express', type: 'intercity', confidenceGroup: 'g2' }, // VERIFIED_IMG
  { number: 793, name: 'Panchagarh Express', type: 'intercity', confidenceGroup: 'g1' }, // VERIFIED_PDF
  { number: 794, name: 'Panchagarh Express', type: 'intercity', confidenceGroup: 'g1' }, // VERIFIED_PDF
  { number: 709, name: 'Parabat Express', type: 'intercity', confidenceGroup: 'g2' }, // VERIFIED_IMG
  { number: 710, name: 'Parabat Express', type: 'intercity', confidenceGroup: 'g2' }, // VERIFIED_IMG
  { number: 815, name: 'Parjotak Express', type: 'intercity', confidenceGroup: 'g2' }, // VERIFIED_IMG
  { number: 816, name: 'Parjotak Express', type: 'intercity', confidenceGroup: 'g2' }, // VERIFIED_IMG
  { number: 822, name: 'Probal Express', type: 'intercity', confidenceGroup: 'g2' }, // VERIFIED_IMG
  { number: 823, name: 'Probal Express', type: 'intercity', confidenceGroup: 'g2' }, // VERIFIED_IMG
  { number: 57, name: 'Rajshahi Commuter', type: 'commuter', confidenceGroup: 'g3' }, // PDF_SUMMARY_COMMUTER
  { number: 58, name: 'Rajshahi Commuter', type: 'commuter', confidenceGroup: 'g3' }, // PDF_SUMMARY_COMMUTER
  { number: 77, name: 'Rajshahi Commuter', type: 'commuter', confidenceGroup: 'g3' }, // PDF_SUMMARY_COMMUTER
  { number: 78, name: 'Rajshahi Commuter', type: 'commuter', confidenceGroup: 'g3' }, // PDF_SUMMARY_COMMUTER
  { number: 771, name: 'Rangpur Express', type: 'intercity', confidenceGroup: 'g1' }, // VERIFIED_PDF
  { number: 772, name: 'Rangpur Express', type: 'intercity', confidenceGroup: 'g1' }, // VERIFIED_PDF
  { number: 827, name: 'Ruposhi Bangla Express', type: 'intercity', confidenceGroup: 'g1' }, // VERIFIED_PDF
  { number: 828, name: 'Ruposhi Bangla Express', type: 'intercity', confidenceGroup: 'g1' }, // VERIFIED_PDF
  { number: 727, name: 'Rupsha Express', type: 'intercity', confidenceGroup: 'g1' }, // VERIFIED_PDF
  { number: 728, name: 'Rupsha Express', type: 'intercity', confidenceGroup: 'g1' }, // VERIFIED_PDF
  { number: 761, name: 'Sagardari Express', type: 'intercity', confidenceGroup: 'g1' }, // VERIFIED_PDF
  { number: 762, name: 'Sagardari Express', type: 'intercity', confidenceGroup: 'g1' }, // VERIFIED_PDF
  { number: 821, name: 'Shaikat Express', type: 'intercity', confidenceGroup: 'g2' }, // VERIFIED_IMG
  { number: 824, name: 'Shaikat Express', type: 'intercity', confidenceGroup: 'g2' }, // VERIFIED_IMG
  { number: 753, name: 'Silkcity Express', type: 'intercity', confidenceGroup: 'g1' }, // VERIFIED_PDF
  { number: 754, name: 'Silkcity Express', type: 'intercity', confidenceGroup: 'g1' }, // VERIFIED_PDF
  { number: 747, name: 'Simanta Express', type: 'intercity', confidenceGroup: 'g1' }, // VERIFIED_PDF
  { number: 748, name: 'Simanta Express', type: 'intercity', confidenceGroup: 'g1' }, // VERIFIED_PDF
  { number: 775, name: 'Sirajganj Express', type: 'intercity', confidenceGroup: 'g1' }, // VERIFIED_PDF
  { number: 776, name: 'Sirajganj Express', type: 'intercity', confidenceGroup: 'g1' }, // VERIFIED_PDF
  { number: 787, name: 'Sonar Bangla Express', type: 'intercity', confidenceGroup: 'g2' }, // VERIFIED_IMG
  { number: 788, name: 'Sonar Bangla Express', type: 'intercity', confidenceGroup: 'g2' }, // VERIFIED_IMG
  { number: 701, name: 'Suborno Express', type: 'intercity', confidenceGroup: 'g2' }, // VERIFIED_IMG
  { number: 702, name: 'Suborno Express', type: 'intercity', confidenceGroup: 'g2' }, // VERIFIED_IMG
  { number: 725, name: 'Sundarban Express', type: 'intercity', confidenceGroup: 'g1' }, // VERIFIED_PDF
  { number: 726, name: 'Sundarban Express', type: 'intercity', confidenceGroup: 'g1' }, // VERIFIED_PDF
  { number: 707, name: 'Tista Express', type: 'intercity', confidenceGroup: 'g1' }, // VERIFIED_PDF_STATION
  { number: 708, name: 'Tista Express', type: 'intercity', confidenceGroup: 'g1' }, // VERIFIED_PDF_STATION
  { number: 733, name: 'Titumir Express', type: 'intercity', confidenceGroup: 'g1' }, // VERIFIED_PDF
  { number: 734, name: 'Titumir Express', type: 'intercity', confidenceGroup: 'g1' }, // VERIFIED_PDF
  { number: 783, name: 'Tungipara Express', type: 'intercity', confidenceGroup: 'g1' }, // VERIFIED_PDF
  { number: 784, name: 'Tungipara Express', type: 'intercity', confidenceGroup: 'g1' }, // VERIFIED_PDF
  { number: 741, name: 'Turna', type: 'intercity', confidenceGroup: 'g2' }, // VERIFIED_IMG
  { number: 742, name: 'Turna', type: 'intercity', confidenceGroup: 'g2' }, // VERIFIED_IMG
  { number: 723, name: 'Udayan Express', type: 'intercity', confidenceGroup: 'g2' }, // VERIFIED_IMG
  { number: 724, name: 'Udayan Express', type: 'intercity', confidenceGroup: 'g2' }, // VERIFIED_IMG
  { number: 739, name: 'Upaban Express', type: 'intercity', confidenceGroup: 'g2' }, // VERIFIED_IMG
  { number: 740, name: 'Upaban Express', type: 'intercity', confidenceGroup: 'g2' }, // VERIFIED_IMG
  { number: 711, name: 'Upakul Express', type: 'intercity', confidenceGroup: 'g2' }, // VERIFIED_IMG
  { number: 712, name: 'Upakul Express', type: 'intercity', confidenceGroup: 'g2' }, // VERIFIED_IMG
  { number: 1, name: 'Dhaka Mail', type: 'mail', confidenceGroup: 'g3' }, // PDF_SUMMARY_COMMUTER_MAIL
  { number: 2, name: 'Chattogram Mail', type: 'mail', confidenceGroup: 'g3' }, // PDF_SUMMARY_COMMUTER_MAIL
  { number: 3, name: 'Karnaphuli Commuter', type: 'mail', confidenceGroup: 'g3' }, // PDF_SUMMARY_COMMUTER_MAIL
  { number: 4, name: 'Karnaphuli Commuter', type: 'mail', confidenceGroup: 'g3' }, // PDF_SUMMARY_COMMUTER_MAIL
  { number: 9, name: 'Surma Mail', type: 'mail', confidenceGroup: 'g3' }, // PDF_SUMMARY_COMMUTER_MAIL
  { number: 10, name: 'Surma Mail', type: 'mail', confidenceGroup: 'g3' }, // PDF_SUMMARY_COMMUTER_MAIL
  { number: 11, name: 'Noakhali Mail', type: 'mail', confidenceGroup: 'g3' }, // PDF_SUMMARY_COMMUTER_MAIL
  { number: 12, name: 'Noakhali Mail', type: 'mail', confidenceGroup: 'g3' }, // PDF_SUMMARY_COMMUTER_MAIL
  { number: 13, name: 'Jalalabad Mail', type: 'mail', confidenceGroup: 'g3' }, // PDF_SUMMARY_COMMUTER_MAIL
  { number: 14, name: 'Jalalabad Mail', type: 'mail', confidenceGroup: 'g3' }, // PDF_SUMMARY_COMMUTER_MAIL
  { number: 29, name: 'Sagarika Commuter', type: 'mail', confidenceGroup: 'g3' }, // PDF_SUMMARY_COMMUTER_MAIL
  { number: 30, name: 'Sagarika Commuter', type: 'mail', confidenceGroup: 'g3' }, // PDF_SUMMARY_COMMUTER_MAIL
  { number: 33, name: 'Titas Commuter', type: 'mail', confidenceGroup: 'g3' }, // PDF_SUMMARY_COMMUTER_MAIL
  { number: 34, name: 'Titas Commuter', type: 'mail', confidenceGroup: 'g3' }, // PDF_SUMMARY_COMMUTER_MAIL
  { number: 35, name: 'Titas Commuter', type: 'mail', confidenceGroup: 'g3' }, // PDF_SUMMARY_COMMUTER_MAIL
  { number: 36, name: 'Titas Commuter', type: 'mail', confidenceGroup: 'g3' }, // PDF_SUMMARY_COMMUTER_MAIL
  { number: 37, name: 'Mymensingh Mail', type: 'mail', confidenceGroup: 'g3' }, // PDF_SUMMARY_COMMUTER_MAIL
  { number: 38, name: 'Mymensingh Mail', type: 'mail', confidenceGroup: 'g3' }, // PDF_SUMMARY_COMMUTER_MAIL
  { number: 39, name: 'Ishakhan Mail', type: 'mail', confidenceGroup: 'g3' }, // PDF_SUMMARY_COMMUTER_MAIL
  { number: 40, name: 'Ishakhan Mail', type: 'mail', confidenceGroup: 'g3' }, // PDF_SUMMARY_COMMUTER_MAIL
  { number: 43, name: 'Mohua Commuter', type: 'mail', confidenceGroup: 'g3' }, // PDF_SUMMARY_COMMUTER_MAIL
  { number: 44, name: 'Mohua Commuter', type: 'mail', confidenceGroup: 'g3' }, // PDF_SUMMARY_COMMUTER_MAIL
  { number: 45, name: 'Somotot Mail', type: 'mail', confidenceGroup: 'g3' }, // PDF_SUMMARY_COMMUTER_MAIL
  { number: 46, name: 'Somotot Mail', type: 'mail', confidenceGroup: 'g3' }, // PDF_SUMMARY_COMMUTER_MAIL
  { number: 47, name: 'Dewanganj Commuter', type: 'mail', confidenceGroup: 'g3' }, // PDF_SUMMARY_COMMUTER_MAIL
  { number: 48, name: 'Dewanganj Commuter', type: 'mail', confidenceGroup: 'g3' }, // PDF_SUMMARY_COMMUTER_MAIL
  { number: 49, name: 'Bolaka Commuter', type: 'mail', confidenceGroup: 'g3' }, // PDF_SUMMARY_COMMUTER_MAIL
  { number: 50, name: 'Bolaka Commuter', type: 'mail', confidenceGroup: 'g3' }, // PDF_SUMMARY_COMMUTER_MAIL
  { number: 51, name: 'Jamalpur Commuter', type: 'mail', confidenceGroup: 'g3' }, // PDF_SUMMARY_COMMUTER_MAIL
  { number: 52, name: 'Jamalpur Commuter', type: 'mail', confidenceGroup: 'g3' }, // PDF_SUMMARY_COMMUTER_MAIL
  { number: 55, name: 'Bhawal Mail', type: 'mail', confidenceGroup: 'g3' }, // PDF_SUMMARY_COMMUTER_MAIL
  { number: 56, name: 'Bhawal Mail', type: 'mail', confidenceGroup: 'g3' }, // PDF_SUMMARY_COMMUTER_MAIL
  { number: 75, name: 'Dholeshwari Mail', type: 'mail', confidenceGroup: 'g3' }, // PDF_SUMMARY_COMMUTER_MAIL
  { number: 76, name: 'Dholeshwari Mail', type: 'mail', confidenceGroup: 'g3' }, // PDF_SUMMARY_COMMUTER_MAIL
  { number: 5, name: 'Rajshahi Commuter', type: 'mail', confidenceGroup: 'g3' }, // PDF_SUMMARY_COMMUTER_MAIL
  { number: 6, name: 'Rajshahi Commuter', type: 'mail', confidenceGroup: 'g3' }, // PDF_SUMMARY_COMMUTER_MAIL
  { number: 15, name: 'Mohananda Mail', type: 'mail', confidenceGroup: 'g3' }, // PDF_SUMMARY_COMMUTER_MAIL
  { number: 16, name: 'Mohananda Mail', type: 'mail', confidenceGroup: 'g3' }, // PDF_SUMMARY_COMMUTER_MAIL
  { number: 19, name: 'Bogura Commuter', type: 'mail', confidenceGroup: 'g3' }, // PDF_SUMMARY_COMMUTER_MAIL
  { number: 20, name: 'Bogura Commuter', type: 'mail', confidenceGroup: 'g3' }, // PDF_SUMMARY_COMMUTER_MAIL
  { number: 21, name: 'Padmaraag Commuter', type: 'mail', confidenceGroup: 'g3' }, // PDF_SUMMARY_COMMUTER_MAIL
  { number: 22, name: 'Padmaraag Commuter', type: 'mail', confidenceGroup: 'g3' }, // PDF_SUMMARY_COMMUTER_MAIL
  { number: 23, name: 'Rocket Mail', type: 'mail', confidenceGroup: 'g3' }, // PDF_SUMMARY_COMMUTER_MAIL
  { number: 24, name: 'Rocket Mail', type: 'mail', confidenceGroup: 'g3' }, // PDF_SUMMARY_COMMUTER_MAIL
  { number: 25, name: 'Nakshikatha Commuter', type: 'mail', confidenceGroup: 'g3' }, // PDF_SUMMARY_COMMUTER_MAIL
  { number: 26, name: 'Nakshikatha Commuter', type: 'mail', confidenceGroup: 'g3' }, // PDF_SUMMARY_COMMUTER_MAIL
  { number: 27, name: 'Ghaghot Mail', type: 'mail', confidenceGroup: 'g3' }, // PDF_SUMMARY_COMMUTER_MAIL
  { number: 28, name: 'Ghaghot Mail', type: 'mail', confidenceGroup: 'g3' }, // PDF_SUMMARY_COMMUTER_MAIL
  { number: 31, name: 'Uttara Mail', type: 'mail', confidenceGroup: 'g3' }, // PDF_SUMMARY_COMMUTER_MAIL
  { number: 32, name: 'Uttara Mail', type: 'mail', confidenceGroup: 'g3' }, // PDF_SUMMARY_COMMUTER_MAIL
  { number: 99, name: 'Dhaka Commuter', type: 'mail', confidenceGroup: 'g3' }, // PDF_SUMMARY_COMMUTER_MAIL
  { number: 61, name: 'Dinajpur Commuter', type: 'mail', confidenceGroup: 'g3' }, // PDF_SUMMARY_COMMUTER_MAIL
  { number: 62, name: 'Dinajpur Commuter', type: 'mail', confidenceGroup: 'g3' }, // PDF_SUMMARY_COMMUTER_MAIL
  { number: 63, name: 'Lalmoni Commuter-1', type: 'mail', confidenceGroup: 'g3' }, // PDF_SUMMARY_COMMUTER_MAIL
  { number: 64, name: 'Lalmoni Commuter-2', type: 'mail', confidenceGroup: 'g3' }, // PDF_SUMMARY_COMMUTER_MAIL
  { number: 65, name: 'Burimari Commuter-1', type: 'mail', confidenceGroup: 'g3' }, // PDF_SUMMARY_COMMUTER_MAIL
  { number: 66, name: 'Burimari Commuter-2', type: 'mail', confidenceGroup: 'g3' }, // PDF_SUMMARY_COMMUTER_MAIL
  { number: 71, name: 'Burimari Commuter-3', type: 'mail', confidenceGroup: 'g3' }, // PDF_SUMMARY_COMMUTER_MAIL
  { number: 72, name: 'Burimari Commuter-4', type: 'mail', confidenceGroup: 'g3' }, // PDF_SUMMARY_COMMUTER_MAIL
  { number: 95, name: 'Mongla Commuter', type: 'mail', confidenceGroup: 'g3' }, // PDF_SUMMARY_COMMUTER_MAIL
  { number: 96, name: 'Mongla Commuter', type: 'mail', confidenceGroup: 'g3' }, // PDF_SUMMARY_COMMUTER_MAIL
  { number: 97, name: 'Kurigram Shuttle', type: 'mail', confidenceGroup: 'g3' }, // PDF_SUMMARY_COMMUTER_MAIL
  { number: 98, name: 'Kurigram Shuttle', type: 'mail', confidenceGroup: 'g3' }, // PDF_SUMMARY_COMMUTER_MAIL
  { number: 101, name: 'Rajbari Mail-1', type: 'mail', confidenceGroup: 'g3' }, // PDF_SUMMARY_COMMUTER_MAIL
  { number: 102, name: 'Rajbari Mail-2', type: 'mail', confidenceGroup: 'g3' }, // PDF_SUMMARY_COMMUTER_MAIL
  { number: 105, name: 'Rajbari Mail-3', type: 'mail', confidenceGroup: 'g3' }, // PDF_SUMMARY_COMMUTER_MAIL
  { number: 106, name: 'Rajbari Mail-4', type: 'mail', confidenceGroup: 'g3' }, // PDF_SUMMARY_COMMUTER_MAIL
  { number: 125, name: 'Punarbhaba Commuter', type: 'mail', confidenceGroup: 'g3' }, // PDF_SUMMARY_COMMUTER_MAIL
  { number: 126, name: 'Punarbhaba Commuter', type: 'mail', confidenceGroup: 'g3' }, // PDF_SUMMARY_COMMUTER_MAIL
  { number: 127, name: 'Millika Commuter', type: 'mail', confidenceGroup: 'g3' }, // PDF_SUMMARY_COMMUTER_MAIL
  { number: 128, name: 'Millika Commuter', type: 'mail', confidenceGroup: 'g3' }, // PDF_SUMMARY_COMMUTER_MAIL
  { number: 129, name: 'Aparajita Commuter', type: 'mail', confidenceGroup: 'g3' }, // PDF_SUMMARY_COMMUTER_MAIL
  { number: 130, name: 'Aparajita Commuter', type: 'mail', confidenceGroup: 'g3' }, // PDF_SUMMARY_COMMUTER_MAIL
  { number: 7, name: 'Uttarbanga Mail', type: 'mail', confidenceGroup: 'g3' }, // PDF_SUMMARY_COMMUTER_MAIL
  { number: 8, name: 'Uttarbanga Mail', type: 'mail', confidenceGroup: 'g3' }, // PDF_SUMMARY_COMMUTER_MAIL
];

export const STOP_SEQUENCES: Record<number, string[]> = {
  1: ['CTG', 'DHKA'],
  2: ['DHKA', 'CTG'],
  3: ['CTG', 'DHKA'],
  4: ['DHKA', 'CTG'],
  5: ['DHKA', 'CPN'],
  6: ['CPN', 'IWD'],
  7: ['STH', 'PCG'],
  8: ['PCG', 'STH'],
  9: ['DHKA', 'SYT'],
  10: ['SYT', 'DHKA'],
  11: ['NOA', 'DHKA'],
  12: ['DHKA', 'NOA'],
  13: ['CTG', 'SYT'],
  14: ['SYT', 'CTG'],
  15: ['KHU', 'CPN'],
  16: ['RHN', 'KHU'],
  19: ['STH', 'LMH'],
  20: ['LMH', 'STH'],
  21: ['STH', 'LMH'],
  22: ['LMH', 'STH'],
  23: ['KHU', 'PBP'],
  24: ['PBP', 'KHU'],
  25: ['KHU', 'DHKA'],
  26: ['DHKA', 'KHU'],
  27: ['PBP', 'CLH'],
  28: ['CLH', 'PBP'],
  29: ['CTG', 'CDP'],
  30: ['CDP', 'CTG'],
  31: ['RAJ', 'PBP'],
  32: ['PBP', 'RAJ'],
  33: ['AKH', 'DHKA'],
  34: ['DHKA', 'BRB'],
  35: ['BRB', 'DHKA'],
  36: ['DHKA', 'AKH'],
  37: ['CTG', 'IBD'],
  38: ['IBD', 'CTG'],
  39: ['DHKA', 'MYM'],
  40: ['MYM', 'DHKA'],
  41: ['DHKA', 'NRG'],
  42: ['NRG', 'DHKA'],
  43: ['DHKA', 'MHJ'],
  44: ['MHJ', 'DHKA'],
  45: ['NOA', 'LKS'],
  46: ['LKS', 'NOA'],
  47: ['DHKA', 'DWG'],
  48: ['DWG', 'DHKA'],
  49: ['DHKA', 'BZP'],
  50: ['BZP', 'DHKA'],
  51: ['DHKA', 'DWG'],
  52: ['DWG', 'DHKA'],
  55: ['DHKA', 'DWG'],
  56: ['DWG', 'DHKA'],
  57: ['IWD', 'RHN'],
  58: ['RHN', 'IWD'],
  61: ['LMH', 'BRL2'],
  62: ['BRL2', 'LMH'],
  63: ['LMH', 'PBP'],
  64: ['PBP', 'LMH'],
  65: ['LMH', 'BMR'],
  66: ['BMR', 'LMH'],
  71: ['LMH', 'BMR'],
  72: ['BMR', 'LMH'],
  75: ['MYM', 'IBD'],
  76: ['IBD', 'MYM'],
  77: ['RAJ', 'RHN'],
  78: ['RHN', 'RAJ'],
  95: ['MGL', 'BNP'],
  96: ['BNP', 'MGL'],
  97: ['LMH', 'KRG'],
  98: ['KRG', 'LMH'],
  99: ['IWD', 'DHKA'],
  101: ['RBR', 'BNG'],
  102: ['BNG', 'KMK'],
  105: ['KMK', 'BNG'],
  106: ['BNG', 'RBR'],
  109: ['RAJ', 'CPN'],
  110: ['CPN', 'RAJ'],
  125: ['RAJ', 'RHN'],
  126: ['RHN', 'RAJ'],
  127: ['RAJ', 'CPN'],
  128: ['CPN', 'RAJ'],
  129: ['RHN', 'CPN'],
  130: ['CPN', 'RHN'],
  701: ['DHKA', 'DABB', 'BBZ', 'BRB', 'COM', 'LKS', 'FNI', 'CTG'],
  702: ['CTG', 'FNI', 'LKS', 'COM', 'AKH', 'BRB', 'BBZ', 'DABB', 'DHKA'],
  703: ['CTG', 'FNI', 'LKS', 'COM', 'AKH', 'BBZ', 'NSD', 'DABB', 'DHKA'],
  704: ['DHKA', 'DABB', 'NSD', 'BBZ', 'AKH', 'COM', 'LKS', 'FNI', 'CTG'],
  705: ['DHKA', 'DABB', 'JDP', 'TGL', 'IBD', 'SMA', 'ULP', 'IWDB', 'NTR', 'STH', 'AHG', 'JPH', 'PCB', 'BRM', 'FLB', 'PBP', 'CRB', 'DNJ', 'STB', 'PRJ', 'TKG', 'RHI', 'KSM', 'PCG'],
  706: ['PCG', 'KSM', 'RHI', 'TKG', 'PRJ', 'STB', 'DNJ', 'CRB', 'PBP', 'FLB', 'BRM', 'JPH', 'AHG', 'STH', 'NTR', 'IWDB', 'ULP', 'SMA', 'TGL', 'JDP', 'DHKA'],
  707: ['DHKA', 'DABB', 'IBD', 'STH', 'BOG', 'PBP', 'DNJ', 'KWN', 'LMH'],
  708: ['LMH', 'KWN', 'DNJ', 'PBP', 'BOG', 'STH', 'IBD', 'DABB', 'DHKA'],
  709: ['DHKA', 'DABB', 'BBZ', 'AKH', 'COM', 'LKS', 'SRM', 'SYT'],
  710: ['SYT', 'SRM', 'LKS', 'AKH', 'BBZ', 'DABB', 'DHKA'],
  711: ['NOA', 'LKS', 'COM', 'AKH', 'BBZ', 'DABB', 'DHKA'],
  712: ['DHKA', 'DABB', 'BBZ', 'AKH', 'COM', 'LKS', 'NOA'],
  713: ['STH', 'BOG', 'BNP2', 'MHG', 'SNT', 'GBD', 'BMD', 'PGC', 'KWN', 'TST', 'LMH', 'ADT', 'KKN', 'SLB', 'HTB', 'BKT', 'BWR', 'PTG', 'BMR'],
  714: ['BMR', 'PTG', 'BWR', 'BKT', 'HTB', 'SLB', 'KKN', 'ADT', 'LMH', 'TST', 'KWN', 'PGC', 'BMD', 'GBD', 'SNT', 'MHG', 'BNP2', 'BOG', 'STH'],
  715: ['KHU', 'NWP', 'JS', 'MBG', 'KCP', 'SFP', 'DSH', 'CWD', 'ALD', 'PDA', 'MZP', 'BMA', 'PKS', 'IWD', 'AZN', 'RAJ'],
  716: ['RAJ', 'AZN', 'IWD', 'PKS', 'BMA', 'MZP', 'PDA', 'ALD', 'CWD', 'DSH', 'SFP', 'KCP', 'MBG', 'JS', 'NWP', 'KHU'],
  717: ['DHKA', 'DABB', 'BBZ', 'AKH', 'SRM', 'KLR', 'SYT'],
  718: ['SYT', 'KLR', 'SRM', 'AKH', 'BBZ', 'DABB', 'DHKA'],
  719: ['CTG', 'LKS', 'COM', 'AKH', 'SRM', 'SYT'],
  720: ['SYT', 'SRM', 'AKH', 'COM', 'LKS', 'CTG'],
  721: ['DHKA', 'JDP', 'TGL', 'IWD', 'NTR', 'RAJ'],
  722: ['RAJ', 'NTR', 'IWD', 'TGL', 'JDP', 'DHKA'],
  723: ['CTG', 'COM', 'AKH', 'BBZ', 'SRM', 'SYT'],
  724: ['SYT', 'SRM', 'BBZ', 'AKH', 'COM', 'CTG'],
  725: ['KHU', 'DLT', 'NWP', 'JS', 'MBG', 'KCP', 'CWD', 'ALD', 'PDA', 'SRK', 'PAN', 'RBR', 'FRP', 'BNG', 'DHKA'],
  726: ['DHKA', 'BNG', 'FRP', 'RBR', 'PAN', 'SRK', 'PDA', 'ALD', 'CWD', 'KCP', 'MBG', 'JS', 'NWP', 'DLT', 'KHU'],
  727: ['KHU', 'NWP', 'JS', 'MBG', 'KCP', 'DSH', 'CWD', 'ALD', 'PDA', 'BMA', 'PKS', 'IWD', 'STH', 'JPH', 'BRM', 'FLB', 'PBP', 'SYP', 'NLF', 'DOM', 'CLH'],
  728: ['CLH', 'DOM', 'NLF', 'SYP', 'PBP', 'FLB', 'BRM', 'JPH', 'STH', 'IWD', 'PDA', 'ALD', 'CWD', 'DSH', 'KCP', 'MBG', 'JS', 'NWP', 'KHU'],
  729: ['CTG', 'FNI', 'LKS', 'CDP'],
  730: ['CDP', 'LKS', 'FNI', 'CTG'],
  731: ['RAJ', 'ALP', 'NTR', 'AHG', 'STH', 'JPH', 'PCB', 'BRM', 'FLB', 'PBP', 'NLF', 'DOM', 'CLH'],
  732: ['CLH', 'DOM', 'NLF', 'FLB', 'PBP', 'JPH', 'AHG', 'STH', 'NTR', 'ALP', 'RAJ'],
  733: ['RAJ', 'ALP', 'MDN', 'AHG', 'STH', 'JPH', 'PCB', 'BRM', 'FLB', 'PBP', 'SYP', 'NLF', 'DOM', 'CLH'],
  734: ['CLH', 'DOM', 'NLF', 'SYP', 'PBP', 'FLB', 'BRM', 'PCB', 'JPH', 'AHG', 'STH', 'MDN', 'NTR', 'ALP', 'RAJ'],
  735: ['DHKA', 'DABB', 'JDP', 'DWG', 'TRK'],
  736: ['TRK', 'DWG', 'JDP', 'DABB', 'DHKA'],
  737: ['DHKA', 'DABB', 'BBZ', 'KSG'],
  738: ['KSG', 'BBZ', 'DABB', 'DHKA'],
  739: ['DHKA', 'DABB', 'BBZ', 'AKH', 'SRM', 'SYT'],
  740: ['SYT', 'SRM', 'AKH', 'BBZ', 'DABB', 'DHKA'],
  741: ['CTG', 'FNI', 'COM', 'AKH', 'BBZ', 'NSD', 'DABB', 'DHKA'],
  742: ['DHKA', 'DABB', 'NSD', 'BBZ', 'AKH', 'COM', 'FNI', 'CTG'],
  743: ['DHKA', 'DABB', 'JDP', 'MYM', 'JMP'],
  744: ['JMP', 'MYM', 'JDP', 'DABB', 'DHKA'],
  745: ['DHKA', 'DABB', 'JDP', 'MYM', 'TRK'],
  746: ['TRK', 'MYM', 'JDP', 'DABB', 'DHKA'],
  747: ['KHU', 'DLT', 'NWP', 'JS', 'MBG', 'KCP', 'CWD', 'ALD', 'BMA', 'IWD', 'NTR', 'STH', 'AHG', 'JPH', 'BRM', 'FLB', 'PBP', 'SYP', 'NLF', 'DOM', 'CLH'],
  748: ['CLH', 'DOM', 'NLF', 'SYP', 'PBP', 'FLB', 'BRM', 'JPH', 'AHG', 'STH', 'NTR', 'IWD', 'BMA', 'ALD', 'CWD', 'DSH', 'KCP', 'MBG', 'JS', 'NWP', 'DLT', 'KHU'],
  749: ['DHKA', 'DABB', 'BBZ', 'KSG'],
  750: ['KSG', 'BBZ', 'DABB', 'DHKA'],
  751: ['DHKA', 'DABB', 'JDP', 'TGL', 'IBD', 'SMA', 'ULP', 'BAL', 'AZN', 'NTR', 'STH', 'BOG', 'BNP2', 'GBD', 'BMD', 'PGC', 'KWN', 'TST', 'LMH'],
  752: ['LMH', 'TST', 'KWN', 'PGC', 'BMD', 'GBD', 'BNP2', 'BOG', 'STH', 'NTR', 'AZN', 'BAL', 'ULP', 'SMA', 'IBD', 'TGL', 'JDP', 'DABB', 'DHKA'],
  753: ['DHKA', 'DABB', 'JDP', 'TGL', 'IBD', 'SMA', 'ULP', 'BAL', 'CTM', 'IWDB', 'ALP', 'RAJ'],
  754: ['RAJ', 'ALP', 'IWDB', 'CTM', 'BAL', 'ULP', 'SMA', 'IBD', 'TGL', 'JDP', 'DABB', 'DHKA'],
  755: ['DHKA', 'MAW', 'PDM', 'SBR', 'BNG', 'TLM', 'FRP', 'AMB', 'PCR', 'RBR', 'PAN', 'KMK', 'KKS', 'IWD', 'RAJ'],
  756: ['RAJ', 'IWD', 'PKS', 'PDA', 'KKS', 'KMK', 'PAN', 'RBR', 'PCR', 'AMB', 'FRP', 'TLM', 'BNG', 'SBR', 'PDM', 'MAW', 'DHKA'],
  757: ['DHKA', 'DABB', 'JDP', 'TGL', 'IBD', 'CTM', 'NTR', 'STH', 'AHG', 'JPH', 'PCB', 'BRM', 'FLB', 'PBP', 'CRB', 'DNJ', 'STB', 'PRJ', 'TKG', 'RHI', 'KSM', 'PCG'],
  758: ['PCG', 'KSM', 'RHI', 'TKG', 'PRJ', 'STB', 'DNJ', 'CRB', 'PBP', 'FLB', 'BRM', 'JPH', 'AHG', 'STH', 'NTR', 'CTM', 'IBD', 'TGL', 'JDP', 'DABB', 'DHKA'],
  759: ['DHKA', 'DABB', 'JDP', 'TGL', 'IBD', 'SMA', 'ULP', 'BAL', 'CTM', 'IWDB', 'ALP', 'SDR', 'RAJ'],
  760: ['RAJ', 'SDR', 'ALP', 'IWDB', 'CTM', 'BAL', 'ULP', 'SMA', 'IBD', 'TGL', 'JDP', 'DABB', 'DHKA'],
  761: ['KHU', 'NWP', 'JS', 'MBG', 'KCP', 'DSH', 'CWD', 'ALD', 'PDA', 'MZP', 'BMA', 'IWD', 'AZN', 'ALP', 'RAJ'],
  762: ['RAJ', 'ALP', 'AZN', 'IWD', 'BMA', 'MZP', 'PDA', 'ALD', 'CWD', 'DSH', 'KCP', 'MBG', 'JS', 'NWP', 'KHU'],
  763: ['KHU', 'NWP', 'JS', 'MBG', 'KCP', 'DSH', 'CWD', 'ALD', 'PDA', 'BMA', 'IWD', 'CTM', 'BAL', 'ULP', 'SMA', 'IBD', 'TGL', 'JDP', 'DABB', 'DHKA'],
  764: ['DHKA', 'DABB', 'JDP', 'TGL', 'IBD', 'SMA', 'ULP', 'BAL', 'CTM', 'IWD', 'MZP', 'PDA', 'CWD', 'MBG', 'JS', 'NWP'],
  765: ['DHKA', 'DABB', 'JDP', 'NTR', 'AHG', 'STH', 'JPH', 'BRM', 'FLB', 'PBP', 'SYP', 'NLF', 'DOM', 'CLH'],
  766: ['CLH', 'DOM', 'NLF', 'SYP', 'PBP', 'FLB', 'BRM', 'JPH', 'AHG', 'STH', 'NTR', 'JDP', 'DABB', 'DHKA'],
  767: ['STH', 'BOG', 'SNT', 'BNP2', 'GBD', 'BMD', 'PGC', 'KWN', 'RNG', 'BDG', 'PBP', 'DNJ', 'STB', 'PRJ', 'TKG', 'RHI', 'KSM', 'PCG'],
  768: ['PCG', 'KSM', 'RHI', 'TKG', 'PRJ', 'STB', 'DNJ', 'CRB', 'PBP', 'RNG', 'BMD', 'GBD', 'BNP2', 'BOG', 'STH'],
  769: ['DHKA', 'DABB', 'JDP', 'TGL', 'IBD', 'SMA', 'ULP', 'BAL', 'CTM', 'IWDB', 'ALP', 'ARA', 'RAJ'],
  770: ['RAJ', 'ARA', 'ALP', 'IWDB', 'CTM', 'BAL', 'ULP', 'SMA', 'IBD', 'TGL', 'JDP', 'DABB', 'DHKA'],
  771: ['DHKA', 'DABB', 'IBD', 'CTM', 'NTR', 'STH', 'BOG', 'BNP2', 'GBD', 'BMD', 'PGC', 'KWN', 'RNG'],
  772: ['RNG', 'KWN', 'PGC', 'BMD', 'GBD', 'BNP2', 'BOG', 'STH', 'NTR', 'CTM', 'DABB', 'DHKA'],
  773: ['DHKA', 'DABB', 'BBZ', 'AKH', 'SRM', 'SYT'],
  774: ['SYT', 'SRM', 'AKH', 'BBZ', 'DABB', 'DHKA'],
  775: ['SJG', 'DHKA'],
  776: ['DHKA', 'SJG'],
  777: ['DHKA', 'DABB', 'JDP', 'MYM', 'MHJ'],
  778: ['MHJ', 'MYM', 'JDP', 'DABB', 'DHKA'],
  779: ['DLC', 'PBN', 'IWD', 'AZN', 'ALP', 'SDR', 'RAJ'],
  780: ['RAJ', 'SDR', 'ALP', 'AZN', 'IWD', 'PBN', 'DLC'],
  781: ['DHKA', 'DABB', 'NSD', 'KSG'],
  782: ['KSG', 'NSD', 'DABB', 'DHKA'],
  783: ['GBR', 'IWD', 'AZN', 'RAJ'],
  784: ['RAJ', 'AZN', 'IWD', 'GBR'],
  785: ['CTG', 'COM', 'AKH', 'BBZ', 'NSD', 'MYM', 'JMP'],
  786: ['JMP', 'MYM', 'BBZ', 'AKH', 'COM', 'CTG'],
  787: ['CTG', 'DABB', 'DHKA'],
  788: ['DHKA', 'DABB', 'CTG'],
  789: ['DHKA', 'DABB', 'MYM', 'MHJ'],
  790: ['MHJ', 'MYM', 'DABB', 'DHKA'],
  791: ['DHKA', 'DABB', 'RAJ', 'CPN'],
  792: ['CPN', 'RAJ', 'DABB', 'DHKA'],
  793: ['DHKA', 'DABB', 'NTR', 'STH', 'JPH', 'PBP', 'DNJ', 'PRJ', 'TKG', 'PCG'],
  794: ['PCG', 'TKG', 'PRJ', 'DNJ', 'PBP', 'JPH', 'STH', 'NTR', 'DABB', 'DHKA'],
  795: ['BNP', 'JKG', 'JS', 'MBG', 'KCP', 'DSH', 'CWD', 'PDA', 'KKS', 'RBR', 'FRP', 'BNG', 'DHKA'],
  796: ['DHKA', 'BNG', 'FRP', 'RBR', 'KKS', 'PDA', 'CWD', 'DSH', 'KCP', 'MBG', 'JS', 'JKG', 'BNP'],
  797: ['DHKA', 'DABB', 'STH', 'JPH', 'PBP', 'RNG', 'KWN', 'KRG'],
  798: ['KRG', 'KWN', 'RNG', 'PBP', 'JPH', 'STH', 'DABB', 'DHKA'],
  799: ['DHKA', 'DABB', 'MYM', 'JMP'],
  800: ['JMP', 'MYM', 'DABB', 'DHKA'],
  801: ['CTG', 'FNI', 'LKS', 'COM', 'AKH', 'BBZ', 'NSD', 'DABB', 'DHKA'],
  802: ['DHKA', 'DABB', 'NSD', 'BBZ', 'AKH', 'COM', 'LKS', 'FNI', 'CTG'],
  803: ['RAJ', 'ALP', 'NTR', 'STH', 'JPH', 'PBP', 'DNJ', 'PRJ', 'TKG', 'RHI', 'KSM', 'PCG'],
  804: ['PCG', 'KSM', 'RHI', 'TKG', 'DNJ', 'PBP', 'JPH', 'STH', 'NTR', 'ALP', 'RAJ'],
  805: ['DHKA', 'DABB', 'JDP', 'IWDB', 'NTR', 'STH', 'JPH', 'BRM', 'FLB', 'PBP', 'SYP', 'NLF', 'DOM', 'CLH'],
  806: ['CLH', 'DOM', 'NLF', 'SYP', 'PBP', 'FLB', 'BRM', 'JPH', 'STH', 'NTR', 'IWDB', 'JDP', 'DABB', 'DHKA'],
  807: ['DHKA', 'DABB', 'TGL', 'SMA', 'ULP', 'BAL', 'CTM', 'PBN'],
  808: ['PBN', 'CTM', 'BAL', 'ULP', 'SMA', 'TGL', 'DABB', 'DHKA'],
  809: ['DHKA', 'DABB', 'IWDB', 'STH', 'BOG', 'BNP2', 'GBD', 'KWN', 'LMH', 'ADT', 'KKN', 'HTB', 'PTG', 'BMR'],
  810: ['BMR', 'PTG', 'HTB', 'KKN', 'ADT', 'LMH', 'KWN', 'GBD', 'BNP2', 'BOG', 'STH', 'IWDB', 'DHKA'],
  813: ['CXBZ', 'CTG', 'DABB', 'DHKA'],
  814: ['DHKA', 'DABB', 'CTG', 'CXBZ'],
  815: ['CXBZ', 'CTG', 'DABB', 'DHKA'],
  816: ['DHKA', 'DABB', 'CTG', 'CXBZ'],
  821: ['CTG', 'YSR', 'JAL', 'PTY', 'CXBZ'],
  822: ['CXBZ', 'RAMU', 'ISM', 'DLH', 'CKR', 'HRB', 'LHG', 'STK', 'DHA2', 'PTY', 'GOM', 'YSR', 'CTG'],
  823: ['CTG', 'YSR', 'GOM', 'PTY', 'DHA2', 'STK', 'LHG', 'HRB', 'CKR', 'DLH', 'ISM', 'RAMU', 'CXBZ'],
  824: ['CXBZ', 'PTY', 'JAL', 'YSR', 'CTG'],
  825: ['KHU', 'NWP', 'NRL', 'KSY', 'BNG', 'DHKA'],
  826: ['DHKA', 'BNG', 'KSY', 'NRL', 'NWP', 'KHU'],
  827: ['BNP', 'JS', 'NRL', 'KSY', 'BNG', 'DHKA'],
  828: ['DHKA', 'BNG', 'KSY', 'NRL', 'JS', 'BNP'],
  921: ['CTG', 'COM', 'AKH', 'BBZ', 'NSD', 'DABB', 'DHKA'],
  922: ['DHKA', 'DABB', 'NSD', 'BBZ', 'AKH', 'COM', 'CTG'],
};
