const date1 = new Date();
date1.setFullYear(date1.getFullYear() - 1);
date1.setMonth(5);
date1.setDate(1);

const date2 = new Date();
date2.setMonth(4);
date2.setDate(31);

console.log("Start:", date1.toISOString());
console.log("End:", date2.toISOString());
console.log("Start Local:", date1.toLocaleString('pt-BR'));
console.log("End Local:", date2.toLocaleString('pt-BR'));
