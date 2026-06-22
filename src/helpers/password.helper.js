const bcrypt = require("bcryptjs");

const isBcryptHash = (value) =>
  typeof value === "string" && /^\$2[aby]\$/.test(value);

const hashPassword = (plainPassword) => bcrypt.hash(plainPassword, 10);

const comparePassword = async (plainPassword, storedPassword) => {
  if (isBcryptHash(storedPassword)) {
    return bcrypt.compare(plainPassword, storedPassword);
  }

  return plainPassword === storedPassword;
};

module.exports = {
  hashPassword,
  comparePassword,
};
