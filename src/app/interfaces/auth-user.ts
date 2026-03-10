export interface AuthUser {
    access_token: string;
    isOrderAdmin: boolean;
    pollingOrder: number;
    memberId: number;
    name: string;
    email: string;
    active: boolean;
}
