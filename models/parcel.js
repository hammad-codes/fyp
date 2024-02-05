module.exports = class Parcel {
    constructor(locationRef, senderRef, receiverRef, weight, readyTime, dueTime, expectedTime, actualDeliveryTime, status, serviceTime, onTimeDelivery) {
      this.locationRef = locationRef;
      this.senderRef = senderRef;
      this.receiverRef = receiverRef;
      this.weight = weight;
      this.readyTime = readyTime;
      this.dueTime = dueTime;
      this.expectedTime = expectedTime;
      this.actualDeliveryTime = actualDeliveryTime;
      this.status = status;
      this.serviceTime = serviceTime;
      this.onTimeDelivery = onTimeDelivery;
    }
    toObject() {
      return {
        locationRef: this.locationRef,
        senderRef: this.senderRef,
        receiverRef: this.receiverRef,
        weight: this.weight,
        readyTime: this.readyTime,
        dueTime: this.dueTime,
        expectedTime: this.expectedTime,
        actualDeliveryTime: this.actualDeliveryTime,
        status: this.status,
        serviceTime: this.serviceTime,
        onTimeDelivery: this.onTimeDelivery
      };
    }
  }
  