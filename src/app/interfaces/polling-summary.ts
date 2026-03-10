export interface PollingSummary {
    polling_id: number;
    polling_name: string;
    start_date: string;
    end_date: string;
    polling_order_id: number;
    candidate_id: number;
    polling_candidate_id: number;
    name: string;
    polling_notes_id: number;
    note: string;
    vote: number;
    pn_created_at: string;
    polling_order_member_id: number;
    completed: boolean;
}
