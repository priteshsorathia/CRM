const prisma = require('../src/database/prisma');

async function check() {
    try {
        const tickets = await prisma.supportTicket.count();
        const callbacks = await prisma.callbackRequest.count();
        console.log(`Tickets: ${tickets}`);
        console.log(`Callbacks: ${callbacks}`);
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

check();
