import TransportWebUSB from '@ledgerhq/hw-transport-webusb';

interface TransportRequest {
  resolve: (value: (PromiseLike<TransportWebUSB> | TransportWebUSB)) => void;
  reject: (reason?: any) => void;
}
interface GenericLedgerRequestFn<Type> {
  (transport: TransportWebUSB): Promise<Type>;
}

export default class LedgerTransportService {
  private static instance: LedgerTransportService;

  private transportRequestList: TransportRequest[];

  private transportWebUsb!: TransportWebUSB;

  private isTransportBusy: boolean;

  private constructor() {
    this.transportRequestList = [];
    this.isTransportBusy = false;
  }

  public static getInstance(): LedgerTransportService {
    if (!LedgerTransportService.instance) {
      LedgerTransportService.instance = new LedgerTransportService();
    }

    return LedgerTransportService.instance;
  }

  public static refreshConnection() {
    LedgerTransportService.instance = new LedgerTransportService();
  }

  getTransport(): Promise<TransportWebUSB> {
    console.log('getTransport');
    return new Promise<TransportWebUSB>((resolve, reject) => {
      if (this.transportRequestList.length === 0 && !this.isTransportBusy) {
        this.transportRequestList.push({ resolve, reject });
        this.processNext();
      } else {
        this.transportRequestList.push({ resolve, reject });
      }
    });
  }

  public enqueueRequest<Type>(request: GenericLedgerRequestFn<Type>): Promise<Type> {
    console.log('enqueueRequest');
    return new Promise<Type>((resolve, reject) => {
      this.getTransport()
        .then((transport :TransportWebUSB) => request(transport))
        .then(resolve)
        .catch(reject)
        .finally(() => this.releaseTransport());
    });
  }

  public releaseTransport():void {
    this.isTransportBusy = false;
    this.processNext();
  }

  public close():void {
    this.isTransportBusy = false;
    this.transportWebUsb.close()
      .then(() => {
        console.log('Closing...');
      });
  }

  public isConnected():boolean {
    this.isTransportBusy = false;
    let isConnected = false;
    try {
      this.processNext();
      isConnected = true;
    } catch (e) {
      console.log(`debittting ==> Error ${e}`);
    }

    return isConnected;
  }

  private processNext(): void {
    console.log('ProcessNext');
    if (this.transportRequestList.length === 0) return;
    this.isTransportBusy = true;
    const request = this.transportRequestList.shift();
    if (!this.transportWebUsb && request) {
      TransportWebUSB.create()
        .then((transport: TransportWebUSB) => {
          this.transportWebUsb = transport;
          request.resolve(this.transportWebUsb);
        })
        .catch(request.reject);
    } else {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      request.resolve(this.transportWebUsb);
    }
  }
}
