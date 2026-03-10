export interface PollingNote {
    polling_notes_id: number;
    candidate_id: number;
    polling_order_member_id: number;
    note: string;
    vote: string;
    polling_id: number;
    polling_order_id: number;
    pn_created_at: string;
    completed: boolean;
    private: boolean;
    polling_name?: string;
    end_date?: string;
    start_date?: string;
    name?: string;
    total?: string;
}
