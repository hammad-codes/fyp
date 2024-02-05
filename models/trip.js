module.exports = class Trip {
    constructor(nRiders, nParcels, nTWV, totalDistance, date) {
      this.nRiders = nRiders;
      this.nParcels = nParcels;
      this.nTWV = nTWV;
      this.totalDistance = totalDistance;
      this.date = date;
    }
    toObject() {
        return {
            nRiders: this.nRiders,
            nParcels: this.nParcels,
            nTWV: this.nTWV,
            totalDistance: this.totalDistance,
            date: this.date
        };
    }
  }
  