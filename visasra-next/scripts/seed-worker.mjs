import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function run() {
  const hash = await bcrypt.hash('worker123', 10);

  const workerData = {
    name: 'Hareharan Nagula',
    phone: '+91 91703 24144',
    email: 'aurumgroups9@gmail.com',
    password: hash,
    rating: 4.9,
    ordersDone: 323,
    status: 'active',
    kycStatus: 'verified',
    aadhaarNumber: '542189022222',
    aadhaarFront: '/images/demo/aadhaar-front.jpg',
    aadhaarBack: '/images/demo/aadhaar-back.jpg',
    panNumber: 'ABCDE1234F',
    panDoc: '/images/demo/pan-card.jpg',
    drivingLicenseNumber: 'TN0120220001234',
    drivingLicenseDoc: '/images/demo/driving-license.jpg',
    currentAddress: 'No. 42, G.N. Chetty Road, T. Nagar, Chennai, Tamil Nadu 600017',
    permanentAddress: 'Plot 15, Lake View Enclave, Anna Nagar West, Chennai, Tamil Nadu 600040',
    altPhone: '+91 98765 43210',
    selfie: '/images/demo/worker-selfie.jpg',
    walletBalance: 4200,
    payoutUpi: 'hareharan@okaxis',
    bankAccountNumber: '50100438921456',
    bankIfscCode: 'HDFC0000124',
    bankName: 'HDFC Bank',
    bankBranch: 'T. Nagar Branch, Chennai',
  };

  const existing = await prisma.worker.findFirst({
    where: { OR: [{ email: 'aurumgroups9@gmail.com' }, { phone: '+91 91703 24144' }] }
  });

  if (existing) {
    const updated = await prisma.worker.update({
      where: { id: existing.id },
      data: workerData,
    });
    console.log('Updated existing worker:', updated.name, updated.kycStatus, updated.bankName);
  } else {
    const created = await prisma.worker.create({ data: workerData });
    console.log('Created worker:', created.name);
  }

  const ramesh = await prisma.worker.upsert({
    where: { phone: '+91 98765 43210' },
    update: {
      kycStatus: 'verified',
      status: 'active',
      ordersDone: 323,
      aadhaarNumber: '542189022222',
      panNumber: 'ABCDE1234F',
      drivingLicenseNumber: 'TN0120220001234',
      currentAddress: 'No. 42, G.N. Chetty Road, T. Nagar, Chennai, Tamil Nadu 600017',
      permanentAddress: 'Plot 15, Lake View Enclave, Anna Nagar West, Chennai, Tamil Nadu 600040',
      bankAccountNumber: '50100438921456',
      bankIfscCode: 'HDFC0000124',
      bankName: 'HDFC Bank',
      bankBranch: 'T. Nagar Branch, Chennai',
      payoutUpi: 'ramesh@oksbi',
    },
    create: {
      name: 'Ramesh Kumar',
      phone: '+91 98765 43210',
      email: 'ramesh@visasra.com',
      password: hash,
      rating: 4.9,
      ordersDone: 323,
      status: 'active',
      kycStatus: 'verified',
      aadhaarNumber: '542189022222',
      panNumber: 'ABCDE1234F',
      drivingLicenseNumber: 'TN0120220001234',
      currentAddress: 'No. 42, G.N. Chetty Road, T. Nagar, Chennai, Tamil Nadu 600017',
      permanentAddress: 'Plot 15, Lake View Enclave, Anna Nagar West, Chennai, Tamil Nadu 600040',
      altPhone: '+91 91703 24144',
      walletBalance: 4200,
      payoutUpi: 'ramesh@oksbi',
      bankAccountNumber: '50100438921456',
      bankIfscCode: 'HDFC0000124',
      bankName: 'HDFC Bank',
      bankBranch: 'T. Nagar Branch, Chennai',
    },
  });
  console.log('Ramesh Kumar seeded/updated:', ramesh.name, ramesh.kycStatus);
}

run()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
