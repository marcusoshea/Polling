export interface CandidateTrendPoint {
  polling_id: number;
  polling_name: string;
  end_date: string;
  yes: number;
  wait: number;
  no: number;
  abstain: number;
  total: number;
  rating: number | null;
}
