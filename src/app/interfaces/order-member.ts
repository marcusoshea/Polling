export interface OrderMember {
    polling_order_member_id: number;
    name: string;
    email: string;
    approved?: boolean;
    removed?: boolean;
}
