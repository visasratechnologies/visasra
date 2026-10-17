import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { workerId, email, phone, bankAccountNumber, bankIfscCode, bankName, bankBranch, payoutUpi } = body;

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

    if (bankAccountNumber && bankAccountNumber.replace(/\D/g, '').length < 8) {
      return NextResponse.json({ error: 'Invalid Bank Account Number' }, { status: 400 });
    }
    if (bankIfscCode && bankIfscCode.trim().length !== 11) {
      return NextResponse.json({ error: 'IFSC Code must be exactly 11 characters' }, { status: 400 });
    }

    const updated = await prisma.worker.update({
      where: { id: worker.id },
      data: {
        bankAccountNumber: bankAccountNumber ? bankAccountNumber.trim() : worker.bankAccountNumber,
        bankIfscCode: bankIfscCode ? bankIfscCode.trim().toUpperCase() : worker.bankIfscCode,
        bankName: bankName ? bankName.trim() : worker.bankName,
        bankBranch: bankBranch ? bankBranch.trim() : worker.bankBranch,
        payoutUpi: payoutUpi ? payoutUpi.trim() : worker.payoutUpi,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Bank details updated successfully',
      worker: updated,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to update bank details';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
