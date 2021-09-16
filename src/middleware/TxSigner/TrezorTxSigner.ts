import TrezorService from '@/services/TrezorService';
import { TrezorSignedTx, Tx } from '@/types';
import * as constants from '@/store/constants';
import TxSigner from './TxSigner';

export default class TrezorTxSigner extends TxSigner {
  private trezorService: TrezorService;

  constructor() {
    super();
    this.trezorService = new TrezorService(
      process.env.VUE_APP_COIN ?? constants.BTC_NETWORK_TESTNET,
    );
  }

  public sign(tx: Tx): Promise<TrezorSignedTx> {
    return new Promise<TrezorSignedTx>((resolve, reject) => {
      this.trezorService.sign(tx)
        .then(resolve)
        .catch(reject);
    });
  }
}