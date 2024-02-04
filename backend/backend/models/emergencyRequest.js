module.exports = class EmergencyRequest {
  constructor(tripRef, routeRef, riderRef, locationRef, type, description) {
    this.tripRef = tripRef;
    this.routeRef = routeRef;
    this.riderRef = riderRef;
    this.locationRef = locationRef;
    this.type = type;
    this.description = description;
  }

  toObject() {
    return {
      tripRef: this.tripRef,
      routeRef: this.routeRef,
      riderRef: this.riderRef,
      locationRef: this.locationRef,
      type: this.type,
      description: this.description,
    };
  }
};
