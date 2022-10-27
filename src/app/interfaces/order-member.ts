export interface OrderMember {
    polling_order_member_id: Number;
    name: string;
    email: string;
    approved?: boolean
    removed?: boolean
  }