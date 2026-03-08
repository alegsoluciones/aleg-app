export interface MedicalService {
    id: string;
    name: string;
    price: number;
    category?: string;
}

export type PaymentMethod = 'CASH' | 'YAPE' | 'POS' | 'TRANSFER';
export type InvoiceStatus = 'PAID' | 'PENDING' | 'CANCELLED';
export type DocumentType = 'BOLETA' | 'FACTURA';

export interface InvoiceItem {
    serviceId: string;
    name: string;
    price: number;
    quantity: number;
}

export interface Invoice {
    id: string;
    tenantId: string;
    patientId: string;
    patientName: string;
    documentType: DocumentType;
    items: InvoiceItem[];
    subtotal: number;
    discount: number;
    totalAmount: number;
    finalAmount: number;
    status: InvoiceStatus;
    paymentMethod: PaymentMethod;
    date: string;
    notes?: string;
}
