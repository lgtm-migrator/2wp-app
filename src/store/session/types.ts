export interface Web3SessionState {
  enabled: boolean;
  account?: string;
  web3?: object;
  rLogin?: {
    disconnect: () => Promise<void>;
  };
}