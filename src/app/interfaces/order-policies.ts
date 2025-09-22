export interface OrderPolicies {
  order_policy_id: number;
  polling_order_id: number;
  polling_order_policy: string;
  created_at: Date;
  updated_at: Date;
}

export interface CreateOrderPolicyRequest {
  polling_order_id: number;
  polling_order_policy: string;
  authToken: string;
}

export interface UpdateOrderPolicyRequest {
  polling_order_policy: string;
  authToken: string;
}


