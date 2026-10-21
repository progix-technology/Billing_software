const { generateLicenseKey } = require('../services/licenseService');

const args = process.argv.slice(2);
const machineId = args[0] || 'PRGX-776E-AB6E-25E9';
const plan = args[1] || 'Gold';
const days = parseInt(args[2] || '365', 10);

const key = generateLicenseKey(machineId, plan, days);

console.log('====================================');
console.log('🔑 LICENSE KEY GENERATOR');
console.log('====================================');
console.log(`Machine ID : ${machineId}`);
console.log(`Plan       : ${plan}`);
console.log(`Validity   : ${days} Days`);
console.log(`LICENSE KEY: ${key}`);
console.log('====================================');
