module.exports = class Rider {
    constructor(name, cnic, phone, address,email,password) {
      this.name = name;
      this.cnic = cnic;
      this.phone = phone;
      this.address = address;
      this.email = email;
      this.password = password;
    }
    toObject() {
        return {
            name: this.name,
            cnic: this.cnic,
            phone: this.phone,
            address: this.address,
            email: this.email,
            password: this.password
        };
    }
  }
  