import { Service, PlatformAccessory, CharacteristicValue } from 'homebridge';
import { IotData } from 'aws-sdk';

import { NeoPixelHomebridgePlugin } from './platform';

/**
 * Platform Accessory
 * An instance of this class is created for each accessory your platform registers
 * Each accessory may expose multiple services of different service types.
 */
export class LightBulbPlatformAccessory {
  private service: Service;


  constructor(
    private readonly platform: NeoPixelHomebridgePlugin,
    private readonly accessory: PlatformAccessory,
    private readonly iotdata: IotData,
  ) {
    // set accessory information
    this.accessory
      .getService(this.platform.Service.AccessoryInformation)!
      .setCharacteristic(this.platform.Characteristic.Manufacturer, 'Neopixel');

    // get the LightBulb service if it exists, otherwise create a new LightBulb service
    // you can create multiple services for each accessory
    this.service =
      this.accessory.getService(this.platform.Service.Lightbulb) ||
      this.accessory.addService(this.platform.Service.Lightbulb);

    // set the service name, this is what is displayed as the default name on the Home app
    // in this example we are using the name we stored in the `accessory.context` in the `discoverDevices` method.
    this.service.setCharacteristic(
      this.platform.Characteristic.Name,
      accessory.context.device.displayName,
    );

    // each service must implement at-minimum the "required characteristics" for the given service type
    // see https://developers.homebridge.io/#/service/Lightbulb

    // register handlers for the On/Off Characteristic
    this.service
      .getCharacteristic(this.platform.Characteristic.On)
      .onSet(this.setOn.bind(this)) // SET - bind to the `setOn` method below
      .onGet(this.getOn.bind(this)); // GET - bind to the `getOn` method below

    // register handlers for the Brightness Characteristic
    this.service
      .getCharacteristic(this.platform.Characteristic.Brightness)
      .onSet(this.setBrightness.bind(this)) // SET - bind to the 'setBrightness` method below
      .onGet(this.getBrightness.bind(this)); // GET - bind to the 'getBrightness` method below
  }

  /**
   * Handle "SET" requests from HomeKit
   * These are sent when the user changes the state of an accessory, for example, turning on a Light bulb.
   */
  async setOn(value: CharacteristicValue) {
    const params = {
      thingName: this.accessory.context.device.uniqueId,
      payload: JSON.stringify({
        state: {
          desired: {
            light: (value as boolean) ? 'on' : 'off',
          },
        },
      }),
    };

    await this.iotdata.updateThingShadow(params).promise();

    this.platform.log.debug('Set Characteristic On ->', value);
  }

  /**
   * Handle the "GET" requests from HomeKit
   * These are sent when HomeKit wants to know the current state of the accessory, for example, checking if a Light bulb is on.
   *
   * GET requests should return as fast as possbile. A long delay here will result in
   * HomeKit being unresponsive and a bad user experience in general.
   *
   * If your device takes time to respond you should update the status of your device
   * asynchronously instead using the `updateCharacteristic` method instead.

   * @example
   * this.service.updateCharacteristic(this.platform.Characteristic.On, true)
   */
  async getOn(): Promise<CharacteristicValue> {
    const params = {
      thingName: this.accessory.context.device.uniqueId,
    };

    const res = await this.iotdata.getThingShadow(params).promise();
    const payload = JSON.parse(res.payload!.toString());

    const lightStatus = payload.state.reported.light === 'on';

    this.platform.log.debug('Get Characteristic On ->', lightStatus);


    // if you need to return an error to show the device as "Not Responding" in the Home app:
    // throw new this.platform.api.hap.HapStatusError(this.platform.api.hap.HAPStatus.SERVICE_COMMUNICATION_FAILURE);

    return lightStatus;
  }

  /**
   * Handle "SET" requests from HomeKit
   * These are sent when the user changes the state of an accessory, for example, changing the Brightness
   */
  async setBrightness(value: CharacteristicValue) {
    const brightness = Math.round((value as number / 100) * 255);

    const params = {
      thingName: this.accessory.context.device.uniqueId,
      payload: JSON.stringify({
        state: {
          desired: {
            brightness,
          },
        },
      }),
    };

    this.platform.log.debug('Set Characteristic Brightness -> ', value);

    await this.iotdata.updateThingShadow(params).promise();
  }

  /**
   * Handle "SET" requests from HomeKit
   * These are sent when the user changes the state of an accessory, for example, changing the Brightness
   */
  async getBrightness(): Promise<CharacteristicValue> {
    const params = {
      thingName: this.accessory.context.device.uniqueId,
    };
    const res = await this.iotdata.getThingShadow(params).promise();
    const payload = JSON.parse(res.payload!.toString());

    const reportedBrightness = payload.state.reported.brightness || 0;
    const brightness = Math.round((reportedBrightness / 255) * 100);

    this.platform.log.debug('Get Characteristic Brightness -> ', brightness);

    return brightness;
  }
}
