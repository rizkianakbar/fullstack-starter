import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/_authenticated/payments')({
  component: PaymentsPage,
});

function PaymentsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Payments</h1>
        <p className="mt-1 text-sm text-gray-500">Create and manage your payments</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-lg border bg-white p-6">
          <h2 className="text-lg font-medium">Create Payment</h2>
          <p className="mt-2 text-sm text-gray-500">Implement the payment creation form here</p>
        </div>

        <div className="rounded-lg border bg-white p-6">
          <h2 className="text-lg font-medium">Payment History</h2>
          <p className="mt-2 text-sm text-gray-500">Implement the payments table here</p>
        </div>
      </div>
    </div>
  );
}
