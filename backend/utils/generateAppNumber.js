const generateAppNumber = (prefix = 'NS') => {
  const d = new Date();
  return `${prefix}${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}${Math.floor(1000+Math.random()*9000)}`;
};
module.exports = generateAppNumber;
