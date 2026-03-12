import type { Invoice } from '../types/billing';

const API_URL = 'http://localhost:3000/billing';

export const BillingService = {
    getInvoices: async (): Promise<Invoice[]> => {
        const token = localStorage.getItem('token');
        const tenantSlug = localStorage.getItem('currentTenantSlug');

        try {
            const response = await fetch(API_URL, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'x-tenant-slug': tenantSlug || ''
                }
            });
            if (!response.ok) return [];
            return response.json();
        } catch (error) {
            console.error(error);
            return [];
        }
    },

    createInvoice: async (invoiceData: any): Promise<Invoice> => {
        const token = localStorage.getItem('token');
        const tenantSlug = localStorage.getItem('currentTenantSlug');

        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
                'x-tenant-slug': tenantSlug || ''
            },
            body: JSON.stringify(invoiceData)
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.message || 'Failed to create invoice');
        }

        return response.json();
    },

    // Helper calculate stats client-side from list to avoid extra endpoint for now
    calculateStats: (invoices: Invoice[]) => {
        const today = new Date().toISOString().split('T')[0];
        const todayInvoices = invoices.filter(i => i.date === today);
        const paidToday = todayInvoices.filter(i => i.status === 'PAID');

        return {
            totalRevenue: paidToday.reduce((acc, curr) => acc + Number(curr.finalAmount), 0),
            count: paidToday.length,
            pending: invoices.filter(i => i.status === 'PENDING').length // Pending usually means debts, so all-time pending is better? Or today pending? Keeping all-time pending for debts.
        };
    }
};
