const crypto = require('crypto');
const password = 'rizdy6-wumkyh-rEqxox';
const hash = crypto.createHash('sha256').update(password).digest('hex');
console.log(hash);
