import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      workerId,
      phone,
      email,
      aadhaarNumber,
      aadhaarFront,
      aadhaarBack,
      panNumber,
      panDoc,
      drivingLicenseNumber,
      drivingLicenseDoc,
      currentAddress,
      permanentAddress,
      altPhone,
      selfie,
      bankAccountNumber,
      bankIfscCode,
      bankName,
      bankBranch,
      payoutUpi,
    } = body;

    // Find worker by id, email, or phone
    let worker = null;
    if (workerId) {
      worker = await prisma.worker.findUnique({ where: { id: workerId } });
    }
    if (!worker && email) {
      worker = await prisma.worker.findUnique({ where: { email: email.toLowerCase().trim() } });
    }
    if (!worker && phone) {
      const cleanPhone = phone.trim();
      const digits = cleanPhone.replace(/\D/g, '').slice(-10);
      worker = await prisma.worker.findFirst({
        where: {
          OR: [
            { phone: cleanPhone },
            { phone: `+91 ${digits.slice(0, 5)} ${digits.slice(5)}` },
            { phone: `+91${digits}` },
            { phone: digits },
          ],
        },
      });
    }

    if (!worker) {
      return NextResponse.json({ error: 'Worker account not found' }, { status: 404 });
    }

    // Validation checks
    if (!aadhaarNumber || aadhaarNumber.replace(/\D/g, '').length !== 12) {
      return NextResponse.json({ error: 'Please enter a valid 12-digit Aadhaar number' }, { status: 400 });
    }
    if (!panNumber || panNumber.trim().length < 9) {
      return NextResponse.json({ error: 'Please enter a valid PAN number' }, { status: 400 });
    }
    if (!drivingLicenseNumber || !drivingLicenseNumber.trim()) {
      return NextResponse.json({ error: 'Please enter your Driving License number' }, { status: 400 });
    }
    if (!currentAddress || !currentAddress.trim()) {
      return NextResponse.json({ error: 'Please enter your current address' }, { status: 400 });
    }
    if (!permanentAddress || !permanentAddress.trim()) {
      return NextResponse.json({ error: 'Please enter your permanent address' }, { status: 400 });
    }
    if (!altPhone || altPhone.replace(/\D/g, '').length < 10) {
      return NextResponse.json({ error: 'Please provide a valid alternate mobile number' }, { status: 400 });
    }

    // Save and submit for Admin verification
    const updatedWorker = await prisma.worker.update({
      where: { id: worker.id },
      data: {
        kycStatus: 'pending',
        aadhaarNumber: aadhaarNumber.replace(/\D/g, ''),
        aadhaarFront: aadhaarFront || null,
        aadhaarBack: aadhaarBack || null,
        panNumber: panNumber.trim().toUpperCase(),
        panDoc: panDoc || null,
        drivingLicenseNumber: drivingLicenseNumber.trim().toUpperCase(),
        drivingLicenseDoc: drivingLicenseDoc || null,
        currentAddress: currentAddress.trim(),
        permanentAddress: permanentAddress.trim(),
        altPhone: altPhone.trim(),
        selfie: selfie || null,
        bankAccountNumber: bankAccountNumber ? bankAccountNumber.trim() : worker.bankAccountNumber,
        bankIfscCode: bankIfscCode ? bankIfscCode.trim().toUpperCase() : worker.bankIfscCode,
        bankName: bankName ? bankName.trim() : worker.bankName,
        bankBranch: bankBranch ? bankBranch.trim() : worker.bankBranch,
        payoutUpi: payoutUpi ? payoutUpi.trim() : worker.payoutUpi,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Application submitted successfully! Admin will verify your documents.',
      worker: updatedWorker,
    });
  } catch (err: unknown) {
    console.error('Worker KYC submission error:', err);
    const message = err instanceof Error ? err.message : 'Failed to submit application';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const workerId = searchParams.get('workerId');
    const email = searchParams.get('email');
    const phone = searchParams.get('phone');

    let worker = null;
    if (workerId) {
      worker = await prisma.worker.findUnique({ where: { id: workerId } });
    } else if (email) {
      worker = await prisma.worker.findUnique({ where: { email: email.toLowerCase().trim() } });
    } else if (phone) {
      const digits = phone.replace(/\D/g, '').slice(-10);
      worker = await prisma.worker.findFirst({
        where: {
          OR: [
            { phone },
            { phone: `+91 ${digits.slice(0, 5)} ${digits.slice(5)}` },
            { phone: digits },
          ],
        },
      });
    }

    if (!worker) {
      return NextResponse.json({ error: 'Worker not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      worker,
      kycStatus: worker.kycStatus,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error fetching KYC status';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
