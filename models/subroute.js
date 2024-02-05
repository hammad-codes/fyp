module.exports = class Subroute {
    constructor(tripRef, riderRef, startTime, endTime, parcels) {
      this.tripRef = tripRef;
      this.riderRef = riderRef;
      this.startTime = startTime;
      this.endTime = endTime;
      this.parcels = parcels || [];
    }
    toObject() {
        return {
            tripRef: this.tripRef,
            riderRef: this.riderRef,
            startTime: this.startTime,
            endTime: this.endTime,
            parcels: this.parcels
        };
    }
  }
  