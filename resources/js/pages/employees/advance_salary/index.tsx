import { Head, router } from '@inertiajs/react';
import { Button } from "@/components/ui/button";
import { toast } from 'sonner';
import { useState, useRef, useEffect } from 'react';
import { route } from 'ziggy-js';

import { buildColumns, AdvanceSalary } from "./columns";
import { DataTable } from "./data-table";

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

import { useTranslation } from 'react-i18next';
import { PlusIcon } from 'lucide-react';

// ── Types ────────────────────────────────────────────────────────────────────
interface Props {
    advance_salaries: any;
    filters: { search?: string };
    employees: { id: number; name: string }[];
}

const EMPTY_FORM = {
    employee_id: '',
    amount: '',
    request_date: '',
    reason: '',
    status: '',
};

const getEmptyForm = () => ({
    employee_id: '',
    amount: '',
    request_date: '',
    reason: '',
    status: '',
});


export default function Index({ advance_salaries, filters, employees }: Props) {

    const { t } = useTranslation();

    const [search, setSearch] = useState(filters?.search || '');
    const [form, setForm] = useState(getEmptyForm());


    // Modal state
    const [isOpen, setIsOpen] = useState(false);
    const [editingAdvanceSalary, setEditingAdvanceSalary] = useState<AdvanceSalary | null>(null);

    // Delete state
    const [deletingAdvanceSalary, setDeletingAdvanceSalary] = useState<AdvanceSalary | null>(null);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);

    // Form state (managed manually — not useForm — because image is a File)
    // const [form, setForm] = useState(EMPTY_FORM);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [processing, setProcessing] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // ── Helpers ──────────────────────────────────────────────────────────────

    const convertKhmerToArabic = (str: string) => {
        const khmerDigits = [/០/g, /១/g, /២/g, /៣/g, /៤/g, /៥/g, /៦/g, /៧/g, /៨/g, /៩/g];
        const arabicDigits = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];

        let result = str;
        for (let i = 0; i < 10; i++) {
            result = result.replace(khmerDigits[i], arabicDigits[i]);
        }

        // Remove anything that is still not a number or a decimal point
        return result.replace(/[^0-9.]/g, '');
    };

    const resetForm = () => {
        setForm(getEmptyForm());
    };

    const openCreateModal = () => {
        setEditingAdvanceSalary(null);
        resetForm();
        setForm(f => ({ ...f, status: 'pending' }));
        setIsOpen(true);
    };

    const openEditModal = (advance_salary: AdvanceSalary) => {
        setEditingAdvanceSalary(advance_salary);
        setForm({
            employee_id: advance_salary.employee_id ? String(advance_salary.employee_id) : '',
            amount: String(advance_salary.amount ?? ''),
            request_date: advance_salary.request_date ?? '',
            reason: advance_salary.reason ?? '',
            status: advance_salary.status,
        });
        setIsOpen(true);
    };

    // ── Submit ────────────────────────────────────────────────────────────────

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        setProcessing(true);
        setErrors({});

        const fd = new FormData();
        fd.append('employee_id', form.employee_id);
        fd.append('amount', form.amount);
        fd.append('request_date', form.request_date);
        fd.append('reason', form.reason);
        fd.append('status', form.status);

        if (editingAdvanceSalary) {
            fd.append('_method', 'PUT');
            router.post(route('advance-salary.update', editingAdvanceSalary.id), fd, {
                forceFormData: true,
                onSuccess: () => {
                    setIsOpen(false);
                    resetForm();
                    toast.success(t('advance_salary.updated_successfully'));
                },
                onError: (errs) => {
                    setErrors(errs as Record<string, string>);
                    toast.error(t('advance_salary.error_please_try'));
                },
                onFinish: () => setProcessing(false),
            });
        } else {
            router.post(route('advance-salary.store'), fd, {
                forceFormData: true,
                onSuccess: () => {
                    setIsOpen(false);
                    resetForm();
                    toast.success(t('advance_salary.created_successfully'));
                },
                onError: (errs) => {
                    setErrors(errs as Record<string, string>);
                    toast.error(t('advance_salary.error_please_try'));
                },
                onFinish: () => setProcessing(false),
            });
        }
    };

    // ── Delete ────────────────────────────────────────────────────────────────

    const handleDelete = (advance_salary: AdvanceSalary) => {
        setDeletingAdvanceSalary(advance_salary);
        setIsDeleteOpen(true);
    };

    const confirmDelete = () => {
        if (!deletingAdvanceSalary) return;
        router.delete(route('advance-salary.destroy', deletingAdvanceSalary.id), {
            onSuccess: () => {
                setIsDeleteOpen(false);
                setDeletingAdvanceSalary(null);
                toast.success(t('advance_salary.deleted_successfully'));
            },
            onError: (errors: any) => {
                if (errors.delete) {
                    toast.error(errors.delete);
                } else {
                    toast.error(t('depot.error_please_try'));
                }
            }
        });
    };

    useEffect(() => {
        const timeout = setTimeout(() => {
            router.get('/advance-salary', {
                search: search || undefined,
                page: 1 // reset ONLY when typing
            }, {
                preserveState: true,
                replace: true,
            });
        }, 400);

        return () => clearTimeout(timeout);
    }, [search]);

    const applyFilter = () => {
        router.get('/advance-salary', {
            search: search || undefined,
            page: 1
        }, {
            preserveState: true,
            replace: true,
        });
    };

    // ── Table columns (with callbacks wired) ─────────────────────────────────

    const columns = buildColumns(openEditModal, handleDelete);

    // ── Render ────────────────────────────────────────────────────────────────

    return (
        <>
            <Head title="Products" />


            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <div className="p-2">
                    <div className="flex justify-between items-center mb-6">
                        <h1 className="text-2xl font-bold">{t('advance_salary.advance_salary_label')}</h1>

                        <Button className="bg-indigo-800 hover:bg-indigo-700" onClick={openCreateModal}>
                            <PlusIcon className="size-4" />
                            {t('advance_salary.new_advance_salary')}
                        </Button>
                    </div>

                    <Input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && applyFilter()}
                    />

                    <DataTable columns={columns} data={advance_salaries.data} />

                    <div className="flex justify-between items-center mt-4">
                        <div className="text-sm text-gray-500">
                            Showing {advance_salaries.from} to {advance_salaries.to} of {advance_salaries.total}
                        </div>

                        <div className="flex gap-1">
                            {advance_salaries.links.map((link: any, i: number) => (
                                <button
                                    key={i}
                                    onClick={() => {
                                        if (link.url) {
                                            router.get(link.url, {}, {
                                                preserveState: true,
                                                preserveScroll: true
                                            });
                                        }
                                    }}
                                    disabled={!link.url}
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                    className={`px-3 py-1 text-sm rounded border ${link.active
                                        ? 'bg-indigo-600 text-white'
                                        : 'bg-white hover:bg-gray-50'
                                        }`}
                                />
                            ))}
                        </div>
                    </div>

                </div>

            </div>

            {/* ── Create / Edit Dialog ─────────────────────────────────────── */}
            <Dialog open={isOpen} onOpenChange={(open) => {
                setIsOpen(open);
                if (!open) { setEditingAdvanceSalary(null); resetForm(); }
            }}>
                <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
                    <form onSubmit={submit} encType="multipart/form-data">
                        <DialogHeader className="mb-4">
                            <DialogTitle>{editingAdvanceSalary ? t('advance_salary.edit_advance_salary') : t('advance_salary.new_advance_salary')}</DialogTitle>
                            <DialogDescription>
                                {editingAdvanceSalary ? t('advance_salary.edit_description') : t('advance_salary.add_description')}
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-4">

                            {/* Employee Name */}
                            <div className="space-y-1">
                                <Label htmlFor="name">{t('advance_salary.employee_name')}<span className="text-red-500">*</span></Label>
                                <Select
                                    value={form.employee_id}
                                    onValueChange={(value) => setForm(f => ({ ...f, employee_id: value }))}
                                >
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder={t('advance_salary.select_employee')} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {employees?.map((employee) => (
                                            <SelectItem key={employee.id} value={String(employee.id)}>
                                                {employee.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {errors.employee_id && <p className="text-red-500 text-xs">{errors.employee_id}</p>}
                            </div>


                            {/* Amount */}
                            <div className="space-y-1">
                                <Label htmlFor="amount">{t('advance_salary.amount')}<span className="text-red-500">*</span></Label>
                                <Input
                                    id="amount"
                                    type="text"
                                    value={form.amount}
                                    onChange={e => {
                                        const cleanedValue = convertKhmerToArabic(e.target.value);
                                        setForm(f => ({ ...f, amount: cleanedValue }));
                                    }}
                                    className="font-sans"
                                />
                                {errors.amount && <p className="text-red-500 text-xs">{errors.amount}</p>}
                            </div>

                            {/* request date */}
                            <div className="space-y-1">
                                <div className="space-y-1">
                                    <Label htmlFor="request_date">{t('advance_salary.request_date')}</Label>
                                    <Input
                                        id="request_date"
                                        type="date"
                                        value={form.request_date}
                                        onChange={e => setForm(f => ({ ...f, request_date: e.target.value }))}
                                    />
                                    {errors.request_date && <p className="text-red-500 text-xs">{errors.request_date}</p>}
                                </div>
                            </div>

                            {/* Reason */}
                            <div className="space-y-1">
                                <div className="space-y-1">
                                    <Label htmlFor="reason">{t('advance_salary.reason')}</Label>
                                    <Input
                                        id="reason"
                                        type="text"
                                        value={form.reason}
                                        onChange={e => setForm(f => ({ ...f, reason: e.target.value }))}
                                        placeholder="e.g. For family needs"
                                    />
                                    {errors.reason && <p className="text-red-500 text-xs">{errors.reason}</p>}
                                </div>
                            </div>


                            {/* Status */}
                            <div className="space-y-1">
                                <Label>{t('advance_salary.status_label')} <span className="text-red-500">*</span></Label>
                                <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Select a status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="pending">{t('advance_salary.status.pending')}</SelectItem>
                                        <SelectItem value="approved">{t('advance_salary.status.approved')}</SelectItem>
                                        <SelectItem value="rejected">{t('advance_salary.status.rejected')}</SelectItem>
                                    </SelectContent>
                                </Select>
                                {errors.status && <p className="text-red-500 text-xs">{errors.status}</p>}
                            </div>

                        </div>

                        <DialogFooter className="mt-6">
                            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                                {t('advance_salary.cancel')}
                            </Button>
                            <Button type="submit" disabled={processing} className="bg-indigo-800 hover:bg-indigo-700">
                                {processing ? t('advance_salary.save_processing') : (editingAdvanceSalary ? t('advance_salary.update') : t('advance_salary.create'))}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* ── Delete Confirmation ──────────────────────────────────────── */}
            <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{t('advance_salary.delete_title')}</AlertDialogTitle>
                        <AlertDialogDescription>
                            {t('advance_salary.delete_description')} {' '}
                            <span className="font-semibold text-foreground">"{deletingAdvanceSalary?.employee_name}"</span>{' '}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setDeletingAdvanceSalary(null)}>{t('advance_salary.cancel')}</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            onClick={confirmDelete}
                        >
                            {t('advance_salary.delete')}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}

Index.layout = {
    breadcrumbs: [
        { title: ('advance_salary.title'), href: '/advance_salary' },
    ],
};
