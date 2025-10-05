export interface LoginResponse {
  accessToken: string;
  tokenType: string;
  username: string;
  roles: string[];
}