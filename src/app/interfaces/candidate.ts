export interface Candidate {
    candidate_id: number;
    name: string;
    link?: string | null;
    polling_order_id: number;
    watch_list?: boolean;
}
