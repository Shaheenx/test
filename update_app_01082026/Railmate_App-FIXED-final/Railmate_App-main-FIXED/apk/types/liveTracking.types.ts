export interface LiveTrainPosition {
  train_id: string;
  train_number: string;
  train_name_en: string;
  train_name_bn: string;
  origin_name_en: string;
  destination_name_en: string;
  scheduled_departure: string;
  scheduled_arrival: string;
  estimated_delay_minutes: number;
  progress_pct: number;
  live_status: 'SCHEDULED' | 'ON_TIME' | 'DELAYED' | 'ARRIVED';
}
