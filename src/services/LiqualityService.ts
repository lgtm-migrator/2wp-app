import * as bitcoin from 'bitcoinjs-lib';
import {
  LiqualityError,
  LiqualityGetAddressesResponse,
  LiqualityMethods, LiqualitySignedTx,
  LiqualityTx,
  WalletAddress,
  WindowBitcoinProvider,
} from '@/types';
import { WalletService } from '@/services';
import { EnvironmentAccessorService } from '@/services/enviroment-accessor.service';

export default class LiqualityService extends WalletService {
  private bitcoinProvider!: WindowBitcoinProvider;

  constructor(testBitcoinProvider?: WindowBitcoinProvider) {
    super();
    if (testBitcoinProvider) {
      this.bitcoinProvider = testBitcoinProvider;
    }
  }

  enable(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      try {
        this.bitcoinProvider = window.bitcoin;
        window.bitcoin.enable()
          .then(() => {
            resolve();
          });
      } catch (e) {
        reject(new LiqualityError());
      }
    });
  }

  getAccountAddresses(batch: number, index: number): Promise<WalletAddress[]> {
    return new Promise<WalletAddress[]>((resolve, reject) => {
      const walletAddresses: WalletAddress[] = [];
      this.enable()
        .then(() => Promise.all([
          this.bitcoinProvider.request({
            method: LiqualityMethods.GET_ADDRESS,
            params: [index, batch, true],
          }),
          this.bitcoinProvider.request({
            method: LiqualityMethods.GET_ADDRESS,
            params: [index, batch, false],
          }),
        ]))
        .then(([changeAddreses, noChangeAddresses]) => {
          const addresses = noChangeAddresses as LiqualityGetAddressesResponse[];
          addresses.concat(changeAddreses as LiqualityGetAddressesResponse[])
            .forEach((liqualityAddress: LiqualityGetAddressesResponse) => {
              walletAddresses.push({
                address: liqualityAddress.address,
                serializedPath: liqualityAddress.derivationPath,
                publicKey: liqualityAddress.publicKey,
                path: [0],
              });
            });
          resolve(walletAddresses);
        })
        .catch(reject);
    });
  }

  // eslint-disable-next-line class-methods-use-this
  public getWalletAddressesPerCall(): number {
    return EnvironmentAccessorService
      .getEnvironmentVariables().vueAppWalletAddressesPerCallLiquality;
  }

  // eslint-disable-next-line class-methods-use-this
  public getWalletMaxCall(): number {
    return EnvironmentAccessorService.getEnvironmentVariables().vueAppWalletMaxCallLiquality;
  }

  sign(tx: LiqualityTx): Promise<LiqualitySignedTx> {
    const liqualityTx = tx as LiqualityTx;
    console.log('trying to signnnnnnnnnnn');
    return new Promise<LiqualitySignedTx>((resolve, reject) => {
      try {
        console.log('verify 0');

        this.bitcoinProvider.request({
          method: LiqualityMethods.SIGN_PSBT,
          params: [
            liqualityTx.base64UnsignedPsbt,
            liqualityTx.inputs,
          ],
        })
          .then((signedBase64Psbt) => {
            console.log('verify 2');
            const signedPsbt = bitcoin.Psbt.fromBase64(signedBase64Psbt as string);
            console.log('verify 3');
            if (!signedPsbt.validateSignaturesOfAllInputs()) {
              console.log('verify 4');
              reject(new Error('Invalid signature provided'));
            } else {
              console.log('verify 5');
              resolve({
                signedTx: signedPsbt.finalizeAllInputs().extractTransaction().toHex(),
              });
            }
          }).catch((error) => {
            console.log(`Ocorreu um erro ${error}`);
          });
      } catch (e) {
        console.log('Error captured throwing LiqualityError');
        reject(new LiqualityError());
      }
    });
  }
}
