// Status display config tuned for high-craft CA Audit B2B SaaS
export const STATUS_CONFIG = {
  pending: {
    label: 'Pending Upload',
    shortLabel: 'Pending',
    badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
    dotClass: 'bg-slate-400',
    icon: 'Clock',
    description: 'Awaiting initial document upload from staff or client',
  },
  uploaded: {
    label: 'Uploaded — Ready for Review',
    shortLabel: 'Uploaded',
    badgeClass: 'bg-sky-50 text-sky-800 border-sky-200',
    dotClass: 'bg-sky-500',
    icon: 'UploadCloud',
    description: 'Document has been uploaded and queued for audit review',
  },
  under_review: {
    label: 'Under Audit Review',
    shortLabel: 'Under Review',
    badgeClass: 'bg-amber-50 text-amber-800 border-amber-200',
    dotClass: 'bg-amber-500',
    icon: 'FileSearch',
    description: 'Reviewer is currently scrutinizing the document',
  },
  approved: {
    label: 'Approved & Verified',
    shortLabel: 'Approved',
    badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    dotClass: 'bg-emerald-500',
    icon: 'CheckCircle2',
    description: 'Document satisfies audit requirements and has been signed off',
  },
  correction_required: {
    label: 'Correction Required',
    shortLabel: 'Action Required',
    badgeClass: 'bg-rose-50 text-rose-800 border-rose-200',
    dotClass: 'bg-rose-500',
    icon: 'AlertCircle',
    description: 'Reviewer requested changes or missing pages from staff',
  },
};

export const ACTION_CONFIG = {
  document_added: {
    label: 'Document Slot Added',
    icon: '📋',
    colorClass: 'text-slate-600 bg-slate-100 border-slate-200',
  },
  document_uploaded: {
    label: 'Document Uploaded',
    icon: '📤',
    colorClass: 'text-sky-700 bg-sky-50 border-sky-200',
  },
  review_started: {
    label: 'Audit Review Started',
    icon: '🔍',
    colorClass: 'text-amber-700 bg-amber-50 border-amber-200',
  },
  approved: {
    label: 'Document Approved',
    icon: '✅',
    colorClass: 'text-emerald-700 bg-emerald-50 border-emerald-200',
  },
  correction_requested: {
    label: 'Correction Requested',
    icon: '⚠️',
    colorClass: 'text-rose-700 bg-rose-50 border-rose-200',
  },
  document_reuploaded: {
    label: 'Revised Document Uploaded',
    icon: '🔄',
    colorClass: 'text-indigo-700 bg-indigo-50 border-indigo-200',
  },
};

// Common CA firm audit correction presets for quick review feedback
export const CORRECTION_PRESETS = [
  'Page 3 is missing. Please upload the complete bank statement.',
  'Bank seal and authorized signatory stamp are missing.',
  'Statement period mismatch: please provide statements for the full financial year.',
  'Unreconciled closing balance: totals do not match the ledger extract.',
  'Scanned document is blurry or partially illegible.',
  'Supporting payment vouchers / invoices are missing for major entries.',
];

// Demo accounts metadata for instant 1-click evaluation switching
export const DEMO_ACCOUNTS = [
  {
    firm: 'Firm A — ABC & Co.',
    firmIdName: 'ABC & Co.',
    name: 'Priya Sharma',
    role: 'admin',
    roleLabel: 'Admin / Partner',
    email: 'admin@abc.com',
    password: 'password',
    badge: 'bg-purple-100 text-purple-800 border-purple-200',
  },
  {
    firm: 'Firm A — ABC & Co.',
    firmIdName: 'ABC & Co.',
    name: 'Aman Verma',
    role: 'reviewer',
    roleLabel: 'Audit Reviewer',
    email: 'reviewer@abc.com',
    password: 'password',
    badge: 'bg-amber-100 text-amber-800 border-amber-200',
  },
  {
    firm: 'Firm A — ABC & Co.',
    firmIdName: 'ABC & Co.',
    name: 'Rohit Mehta',
    role: 'staff',
    roleLabel: 'Staff / Assistant',
    email: 'staff@abc.com',
    password: 'password',
    badge: 'bg-sky-100 text-sky-800 border-sky-200',
  },
  {
    firm: 'Firm B — XYZ & Co.',
    firmIdName: 'XYZ & Co.',
    name: 'Sunita Rao',
    role: 'admin',
    roleLabel: 'Admin / Partner',
    email: 'admin@xyz.com',
    password: 'password',
    badge: 'bg-purple-100 text-purple-800 border-purple-200',
  },
  {
    firm: 'Firm B — XYZ & Co.',
    firmIdName: 'XYZ & Co.',
    name: 'Karan Joshi',
    role: 'reviewer',
    roleLabel: 'Audit Reviewer',
    email: 'reviewer@xyz.com',
    password: 'password',
    badge: 'bg-amber-100 text-amber-800 border-amber-200',
  },
  {
    firm: 'Firm B — XYZ & Co.',
    firmIdName: 'XYZ & Co.',
    name: 'Meena Pillai',
    role: 'staff',
    roleLabel: 'Staff / Assistant',
    email: 'staff@xyz.com',
    password: 'password',
    badge: 'bg-sky-100 text-sky-800 border-sky-200',
  },
];
