const CryptoJS = require("crypto-js");

const SECRET_KEY = process.env.OBSERVATION_SECRET || "cleSuperSecrete123";

exports.encrypt = (text) => {
  return CryptoJS.AES.encrypt(text, SECRET_KEY).toString();
};

exports.decrypt = (cipherText) => {
  const bytes = CryptoJS.AES.decrypt(cipherText, SECRET_KEY);
  return bytes.toString(CryptoJS.enc.Utf8);
};
