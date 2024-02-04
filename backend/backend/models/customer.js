module.exports = class Customer {
    constructor(name, cnic, phone, address, email) {
      this.name = name;
      this.cnic = cnic;
      this.phone = phone;
      this.address = address;
      this.email = email;
    }
    toObject() {
        return {
            name: this.name,
            cnic: this.cnic,
            phone: this.phone,
            address: this.address,
            email: this.email
        };
    }
  }
  