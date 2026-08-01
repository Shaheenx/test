import { useQuery } from '@tanstack/react-query';
import { getAllStations } from '../api/stations';
import { Station } from '../types/station.types';

// Major Bangladesh Railway stations as offline fallback. IDs are the same
// deterministic UUIDs the canonical seed generator produces
// (uuid_generate_v5(uuid_ns_url(), 'station:<code>')) — computed once with
// the same algorithm so a fallback-served station's id still correctly
// joins against trains.origin_id/destination_id if the network comes back
// mid-session.
const FALLBACK_STATIONS: Station[] = [
  { id: '2b2e2054-4cc8-574f-a50d-577a5575541d', code: 'DHKA', name_en: 'Dhaka (Kamalapur)', name_bn: 'ঢাকা (কমলাপুর)', division: 'Dhaka',      zone: 'East', is_major: true  },
  { id: 'f0477a91-9775-5a75-b482-2222e5f9b8f4', code: 'CTG',  name_en: 'Chattogram',        name_bn: 'চট্টগ্রাম',     division: 'Chittagong', zone: 'East', is_major: true  },
  { id: 'b313ab96-9745-5f43-97a9-0e4d4798539a', code: 'SYT',  name_en: 'Sylhet',             name_bn: 'সিলেট',         division: 'Sylhet',     zone: 'East', is_major: true  },
  { id: 'd0fc77e1-691f-59bc-8bd3-ff4124db2a60', code: 'RAJ',  name_en: 'Rajshahi',           name_bn: 'রাজশাহী',       division: 'Rajshahi',   zone: 'West', is_major: true  },
  { id: '28476c87-c94e-52a4-bba8-c6f0ad2d5011', code: 'KHU',  name_en: 'Khulna',              name_bn: 'খুলনা',         division: 'Khulna',     zone: 'West', is_major: true  },
  { id: 'b263b292-9c6e-5588-b12b-7ee1e29b7b35', code: 'MYM',  name_en: 'Mymensingh',          name_bn: 'ময়মনসিংহ',     division: 'Mymensingh', zone: 'East', is_major: true  },
  { id: '765dad4f-300f-5879-a530-6106370aa60d', code: 'COM',  name_en: 'Comilla',             name_bn: 'কুমিল্লা',      division: 'Chittagong', zone: 'East', is_major: false },
  { id: '3d8aaeef-7950-563c-be7d-e6c4ee28f7f1', code: 'NSD',  name_en: 'Narsingdi',           name_bn: 'নরসিংদী',       division: 'Dhaka',      zone: 'East', is_major: false },
  { id: '78ed64ce-8e96-5a17-9ee6-087382027e93', code: 'AKH',  name_en: 'Akhaura',             name_bn: 'আখাউড়া',       division: 'Chittagong', zone: 'East', is_major: false },
  { id: 'ffde9491-7ce8-54c4-b342-a9b22178ac19', code: 'JDP',  name_en: 'Joydebpur',           name_bn: 'জয়দেবপুর',     division: 'Dhaka',      zone: 'East', is_major: false },
  { id: 'c73b6b45-8189-505d-9f1d-53bddaa2f0e1', code: 'NRG',  name_en: 'Narayanganj',         name_bn: 'নারায়ণগঞ্জ',   division: 'Dhaka',      zone: 'East', is_major: false },
  { id: '0f6d7679-0ee6-5cd3-857e-3316c04cf46a', code: 'IWD',  name_en: 'Ishwardi',            name_bn: 'ঈশ্বরদী',       division: 'Rajshahi',   zone: 'West', is_major: false },
  { id: '193c6b72-1317-5405-ac5d-0d9579775b1a', code: 'PBP',  name_en: 'Parbatipur',          name_bn: 'পার্বতীপুর',    division: 'Rangpur',    zone: 'West', is_major: false },
  { id: '1ccd87b3-60e9-51d5-9cfa-1612cb1afa49', code: 'JS',   name_en: 'Jessore',             name_bn: 'যশোর',          division: 'Khulna',     zone: 'West', is_major: false },
  { id: '2728a0b9-3923-5a5e-9fb7-508c494f2f4f', code: 'RNG',  name_en: 'Rangpur',             name_bn: 'রংপুর',         division: 'Rangpur',    zone: 'West', is_major: false },
  { id: '5fcd802b-e95c-5867-8be5-12892b2e729c', code: 'BOG',  name_en: 'Bogura',              name_bn: 'বগুড়া',         division: 'Rajshahi',   zone: 'West', is_major: false },
  { id: 'dd01afbd-3c9f-5472-b037-51bf91a67bc5', code: 'DNJ',  name_en: 'Dinajpur',            name_bn: 'দিনাজপুর',      division: 'Rangpur',    zone: 'West', is_major: false },
];

export const useStations = () =>
  useQuery({
    queryKey: ['stations'],
    queryFn: async (): Promise<Station[]> => {
      try {
        const data = await getAllStations();
        if (data && data.length > 0) return data;
        return FALLBACK_STATIONS;
      } catch {
        return FALLBACK_STATIONS;
      }
    },
    staleTime: 60 * 60 * 1000,
    retry: 1,
  });

export { FALLBACK_STATIONS };
