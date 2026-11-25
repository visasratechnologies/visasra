import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getWorkerFromRequest } from '@/lib/jwt';

export async function POST(req: Request) {
  try {
    const authWorker = await getWorkerFromRequest(req);
    if (!authWorker) {
      return NextResponse.json({ error: 'Unauthorized: Partner session token required' }, { status: 401 });
    }

    const body = await req.json();
    const { bankAccountNumber, bankIfscCode, bankName, bankBranch, payoutUpi } = body;
    const targetWorkerId = authWorker.workerId;

    const worker = await prisma.worker.findUnique({ where: { id: targetWorkerId } });
    if (!worker) {
      return NextResponse.json({ error: 'Partner account not found' }, { status: 404 });
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
      worker: {
        ...updated,
        aadhaarNumber: updated.aadhaarNumber ? `XXXX-XXXX-${updated.aadhaarNumber.replace(/\D/g, '').slice(-4)}` : null,
        panNumber: updated.panNumber ? `XXXXX${updated.panNumber.trim().slice(-4)}` : null,
        bankAccountNumber: updated.bankAccountNumber ? `XXXXXXXX${updated.bankAccountNumber.replace(/\D/g, '').slice(-4)}` : null,
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to update bank details';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
